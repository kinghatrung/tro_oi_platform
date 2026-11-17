import type { PagedResponse } from '@tro-oi/shared';

import { getAccessToken } from './axiosClient';

/** Dịch vụ trợ lý AI (apps/ai) — tách khỏi API chính nên gọi fetch thẳng, không qua axiosClient. */
const AI_URL = (process.env.NEXT_PUBLIC_AI_URL ?? 'http://localhost:5300').replace(/\/$/, '');

/** Thẻ tin / món đồ trong câu trả lời — apps/ai dựng từ dữ liệu API thật. */
export interface AssistantCard {
  kind: 'listing' | 'product';
  id: string;
  title: string;
  image?: string;
  /** Đồng. */
  price: number;
  transaction?: string;
  area?: number;
  address?: string;
}

export type AssistantEvent =
  | { event: 'status'; data: { text: string } }
  | { event: 'text'; data: { text: string } }
  | { event: 'cards'; data: { items: AssistantCard[] } }
  | { event: 'error'; data: { message: string } }
  /** messageId: id lượt trả lời — dùng để gửi 👍 / 👎. */
  | { event: 'done'; data: { messageId: string } };

export interface AssistantRequest {
  /** Id phiên (sessionStorage) — gom các lượt của 1 cuộc trò chuyện trong nhật ký. */
  sessionId: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  context: { page: string; section: 'housing' | 'market' };
}

/** Body lỗi của dịch vụ AI (Nest): { message } → Error tiếng Việt. */
async function failWith(res: Response, fallback: string): Promise<never> {
  const error = (await res.json().catch(() => null)) as { message?: string } | null;
  throw new Error(error?.message ?? fallback);
}

/** 👍 (1) / 👎 (-1) cho 1 câu trả lời. */
export async function rateAssistantAnswer(messageId: string, rating: 1 | -1) {
  const res = await fetch(`${AI_URL}/feedback`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messageId, rating }),
  });
  if (!res.ok) await failWith(res, 'Chưa gửi được đánh giá');
}

// ── Quản trị: nhật ký hội thoại ─────────────────────────────────────────────

/** Dấu "cần xem lại" dịch vụ AI tự gắn. */
export type AssistantLogFlag = 'error' | 'no_answer' | 'no_results' | 'tool_error';
export type AssistantLogFilter = 'review' | 'disliked' | 'liked' | 'all';

export interface AssistantLogItem {
  id: string;
  sessionId: string;
  createdAt: string;
  section?: 'housing' | 'market';
  page?: string;
  question: string;
  answer: string;
  tools: { name: string; args: unknown; total?: number; error?: string }[];
  cards: number;
  model: string;
  ms: number;
  error?: string;
  flags: AssistantLogFlag[];
  rating: 1 | -1 | null;
}

/** GET /admin/conversations — dịch vụ AI tự kiểm quyền admin bằng token (qua API /users/me). */
export async function searchAssistantLogs(query: {
  filter?: AssistantLogFilter;
  page?: number;
  pageSize?: number;
}): Promise<PagedResponse<AssistantLogItem>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const res = await fetch(`${AI_URL}/admin/conversations?${params}`, {
    headers: { authorization: `Bearer ${getAccessToken() ?? ''}` },
  });
  if (!res.ok) await failWith(res, 'Không tải được nhật ký trợ lý AI');
  return (await res.json()) as PagedResponse<AssistantLogItem>;
}

/**
 * POST /chat (SSE): gọi onEvent cho từng sự kiện status → text → cards → done | error.
 * Lỗi HTTP (429 hỏi quá nhiều, 400 câu hỏi sai) → ném Error kèm câu tiếng Việt của dịch vụ.
 */
export async function streamAssistant(
  body: AssistantRequest,
  onEvent: (event: AssistantEvent) => void,
  signal?: AbortSignal,
) {
  const res = await fetch(`${AI_URL}/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) return failWith(res, 'Trợ lý đang bận, bạn thử lại sau ít phút nhé.');

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    // Mỗi sự kiện SSE kết thúc bằng 1 dòng trống
    let end;
    while ((end = buffer.indexOf('\n\n')) >= 0) {
      const block = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const event = /^event: (.+)$/m.exec(block)?.[1];
      const data = /^data: (.*)$/m.exec(block)?.[1];
      if (event) onEvent({ event, data: data ? JSON.parse(data) : {} } as AssistantEvent);
    }
  }
}
