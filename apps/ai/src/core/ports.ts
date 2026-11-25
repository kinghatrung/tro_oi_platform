import type { z } from 'zod';

/**
 * Cổng (port) giữa lõi và bên ngoài. Lõi chỉ biết các kiểu này — đổi model / đổi nguồn dữ liệu
 * chỉ cần viết adapter mới (adapters/), không sửa orchestrator.
 */

export interface ToolCall {
  id: string;
  name: string;
  /** Tham số model gửi (chưa kiểm tra) — orchestrator kiểm bằng schema của công cụ. */
  args: unknown;
  /**
   * Dữ liệu riêng của nhà cung cấp, phải gửi trả nguyên vẹn ở lượt sau
   * (vd Gemini: extra_content.google.thought_signature — thiếu thì 400).
   */
  extra?: unknown;
}

export type LlmMessage =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; toolCalls?: ToolCall[] }
  | { role: 'tool'; toolCallId: string; name: string; content: string };

/** Mô tả công cụ gửi cho model (tham số dạng JSON Schema). */
export interface LlmToolSpec {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LlmTurn {
  text: string;
  toolCalls: ToolCall[];
}

export interface LlmPort {
  /** Tên hiển thị trong log / health, vd "openai-compatible:gemini-2.5-flash". */
  readonly name: string;
  complete(input: {
    system: string;
    messages: LlmMessage[];
    tools: LlmToolSpec[];
    signal?: AbortSignal;
  }): Promise<LlmTurn>;
}

/** Đọc dữ liệu công khai của Trọ ơi (GET qua HTTP, đã bóc { code, message, data }). */
export interface TroiApiPort {
  get<T>(
    path: string,
    params?: Record<string, string | number | string[] | undefined>,
    /** JWT của người dùng — chỉ dùng để hỏi API "người này là ai" (quyền admin). */
    token?: string,
  ): Promise<T>;
}

/** Thẻ hiển thị trong khung chat — dựng từ dữ liệu API thật, model không tự tạo được. */
export interface ChatCard {
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

/**
 * Việc agent làm trên giao diện web — widget diễn lại từng bước (gõ vào ô tìm kiếm rồi mở trang).
 * `path` luôn là đường dẫn nội bộ do công cụ dựng từ tham số đã kiểm (model không tự viết URL).
 */
export interface ChatAction {
  type: 'open-search';
  /** Trang kết quả cuối cùng (đủ bộ lọc, keyword = query), vd "/tim-kiem?keyword=C%E1%BA%A7u+Gi%E1%BA%A5y&maxPrice=5". */
  path: string;
  /** Chữ agent gõ vào ô tìm kiếm rồi nhấn Enter; "" = không có gì để gõ (chỉ áp bộ lọc). */
  query: string;
  /** Mô tả bộ lọc hiện trong khung chat, vd "Phòng trọ · Phường Cầu Giấy · 3–5 triệu". */
  label: string;
}

export interface ToolResult {
  /** Dữ liệu rút gọn đưa lại cho model đọc. */
  forModel: unknown;
  cards?: ChatCard[];
  action?: ChatAction;
}

export interface Tool<S extends z.ZodType = z.ZodType> {
  name: string;
  /** Mô tả cho model: khi nào dùng, đơn vị tham số. */
  description: string;
  schema: S;
  /** Dòng trạng thái hiện cho người dùng khi đang chạy, vd "Đang tìm phòng…". */
  status: (args: z.infer<S>) => string;
  run: (args: z.infer<S>, api: TroiApiPort) => Promise<ToolResult>;
}

/** Giữ kiểu tham số của từng công cụ khi khai báo. */
export const defineTool = <S extends z.ZodType>(tool: Tool<S>) =>
  tool as unknown as Tool;

/** Dấu vết 1 lần gọi công cụ — lưu log để admin xem AI đã làm gì. */
export interface ToolTrace {
  name: string;
  args: unknown;
  /** Tổng kết quả (công cụ tìm kiếm); 0 → log gắn dấu "no_results". */
  total?: number;
  error?: string;
}

/** Kết quả 1 câu hỏi: câu trả lời + những gì đã làm. */
export interface RunSummary {
  text: string;
  cards: number;
  tools: ToolTrace[];
  /** Trang agent đã mở cho người dùng (nếu có). */
  action?: ChatAction;
}

/** Sự kiện SSE gửi về widget. */
export type ChatEvent =
  | { event: 'status'; data: { text: string } }
  | { event: 'text'; data: { text: string } }
  | { event: 'cards'; data: { items: ChatCard[] } }
  | { event: 'action'; data: ChatAction };

export interface ChatContext {
  /** Trang người dùng đang xem, vd "/tim-kiem". */
  page?: string;
  section?: 'housing' | 'market';
}
