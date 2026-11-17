import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import type { ToolTrace } from '../core/ports.js';

/** Log cũ hơn số ngày này bị xoá khi khởi động (chính sách bảo mật: chỉ giữ để cải thiện trợ lý). */
export const RETENTION_DAYS = 90;

/**
 * Dấu hiệu "câu cần xem lại" — tự gắn khi lưu; 👎 tính riêng qua cột rating.
 * - error: lỗi model / mạng          - no_answer: không có câu trả lời
 * - no_results: công cụ ra 0 kết quả  - tool_error: công cụ báo lỗi (tham số sai, API lỗi)
 */
export type ChatFlag = 'error' | 'no_answer' | 'no_results' | 'tool_error';

export interface ChatTurn {
  id: string;
  sessionId: string;
  section?: string;
  page?: string;
  question: string;
  answer: string;
  tools: ToolTrace[];
  cards: number;
  model: string;
  ms: number;
  error?: string;
}

export interface ChatLogItem extends ChatTurn {
  createdAt: string;
  flags: ChatFlag[];
  /** 1 = 👍, -1 = 👎, null = chưa đánh giá. */
  rating: 1 | -1 | null;
}

/** review = có dấu hiệu hoặc bị 👎; disliked = 👎; liked = 👍. */
export type ChatLogFilter = 'all' | 'review' | 'disliked' | 'liked';

const FILTER_SQL: Record<ChatLogFilter, string> = {
  all: '1 = 1',
  review: "(flags <> '' OR rating = -1)",
  disliked: 'rating = -1',
  liked: 'rating = 1',
};

export function flagsOf(turn: ChatTurn): ChatFlag[] {
  const flags: ChatFlag[] = [];
  if (turn.error) flags.push('error');
  if (!turn.answer.trim()) flags.push('no_answer');
  if (turn.tools.some((tool) => tool.total === 0)) flags.push('no_results');
  if (turn.tools.some((tool) => tool.error)) flags.push('tool_error');
  return flags;
}

interface Row {
  id: string;
  session_id: string;
  created_at: string;
  section: string | null;
  page: string | null;
  question: string;
  answer: string;
  tools: string;
  cards: number;
  model: string;
  ms: number;
  error: string | null;
  flags: string;
  rating: number | null;
}

/** Kho log hội thoại riêng của apps/ai (SQLite 1 file) — không dùng MongoDB của web. */
export class ChatLog {
  private readonly db: DatabaseSync;

  constructor(file: string) {
    if (file !== ':memory:') mkdirSync(dirname(file), { recursive: true });
    this.db = new DatabaseSync(file);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chat_turns (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        section TEXT,
        page TEXT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        tools TEXT NOT NULL,
        cards INTEGER NOT NULL,
        model TEXT NOT NULL,
        ms INTEGER NOT NULL,
        error TEXT,
        flags TEXT NOT NULL,
        rating INTEGER
      );
      CREATE INDEX IF NOT EXISTS chat_turns_created ON chat_turns (created_at DESC);
    `);
    this.prune();
  }

  /** Xoá log quá hạn giữ. Trả số dòng đã xoá. */
  prune(now = Date.now()) {
    const cutoff = new Date(now - RETENTION_DAYS * 86_400_000).toISOString();
    return Number(
      this.db.prepare('DELETE FROM chat_turns WHERE created_at < ?').run(cutoff)
        .changes,
    );
  }

  save(turn: ChatTurn, createdAt = new Date()) {
    this.db
      .prepare(
        `INSERT INTO chat_turns
         (id, session_id, created_at, section, page, question, answer, tools, cards, model, ms, error, flags, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      )
      .run(
        turn.id,
        turn.sessionId,
        createdAt.toISOString(),
        turn.section ?? null,
        turn.page ?? null,
        turn.question,
        turn.answer,
        JSON.stringify(turn.tools),
        turn.cards,
        turn.model,
        turn.ms,
        turn.error ?? null,
        flagsOf(turn).join(','),
      );
  }

  /** 👍 / 👎 (ghi đè được). false = không có lượt chat này. */
  rate(id: string, rating: 1 | -1) {
    return (
      Number(
        this.db
          .prepare('UPDATE chat_turns SET rating = ? WHERE id = ?')
          .run(rating, id).changes,
      ) > 0
    );
  }

  list(filter: ChatLogFilter, page: number, pageSize: number) {
    const where = FILTER_SQL[filter];
    const total = Number(
      (
        this.db
          .prepare(`SELECT COUNT(*) AS n FROM chat_turns WHERE ${where}`)
          .get() as { n: number }
      ).n,
    );
    const rows = this.db
      .prepare(
        `SELECT * FROM chat_turns WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      )
      .all(pageSize, (page - 1) * pageSize) as unknown as Row[];
    return { items: rows.map(toItem), total, page, pageSize };
  }
}

const toItem = (row: Row): ChatLogItem => ({
  id: row.id,
  sessionId: row.session_id,
  createdAt: row.created_at,
  section: row.section ?? undefined,
  page: row.page ?? undefined,
  question: row.question,
  answer: row.answer,
  tools: JSON.parse(row.tools) as ToolTrace[],
  cards: row.cards,
  model: row.model,
  ms: row.ms,
  error: row.error ?? undefined,
  flags: row.flags ? (row.flags.split(',') as ChatFlag[]) : [],
  rating: row.rating === 1 || row.rating === -1 ? row.rating : null,
});
