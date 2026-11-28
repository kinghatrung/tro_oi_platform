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
    /** Có → stream: gọi với từng đoạn chữ ngay khi model sinh ra (chữ hiện dần trên web). */
    onText?: (delta: string) => void;
  }): Promise<LlmTurn>;
}

/** Đọc dữ liệu công khai của Trọ ơi (GET qua HTTP, đã bóc { code, message, data }). */
export interface TroiApiPort {
  get<T>(
    path: string,
    params?: Record<string, string | number | string[] | undefined>,
    /** JWT của người dùng — chỉ để hỏi API về chính họ (quyền admin, được đánh giá ai). */
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
export type ChatAction =
  | {
      /** Gõ `query` vào ô tìm kiếm, nhấn Enter → trang `path` (đủ bộ lọc, keyword = query). */
      type: 'open-search';
      path: string;
      /** "" = không có gì để gõ (chỉ áp bộ lọc). */
      query: string;
      /** Mô tả bộ lọc, vd "Phòng trọ · Phường Cầu Giấy · 3–5 triệu". */
      label: string;
    }
  /** Bấm vào thẻ tin / món đồ trên trang (không có thì mở thẳng) → trang chi tiết `path`. */
  | { type: 'open-item'; path: string; label: string }
  /** Mở chi tiết, tới khối liên hệ, rồi mở trang chat `chatPath` có tin nhắn soạn sẵn (người dùng tự gửi). */
  | { type: 'message'; path: string; chatPath: string; label: string }
  /** Bấm nút đổi giao diện nếu đang khác `mode`. */
  | { type: 'set-theme'; mode: 'light' | 'dark'; label: string }
  /** Mở 1 trang của web (tin đã lưu, thông báo, đăng tin…). */
  | { type: 'open-page'; path: string; label: string }
  /**
   * Tới `path` (bỏ trống = trang đang mở) rồi bấm nút `[data-assistant=target]`. `ensure` = trạng thái
   * bật / tắt mong muốn (nút Lưu, công tắc) — đã đúng thì không bấm.
   */
  | {
      type: 'click';
      target: ClickTarget;
      path?: string;
      ensure?: boolean;
      label: string;
    }
  /**
   * Tới `path`, chạy lệnh `open` của trang nếu có (mở hộp sửa hồ sơ / báo cáo), rồi điền form
   * từng ô một. Không bấm gửi — người dùng kiểm tra (và tải ảnh) rồi tự gửi.
   */
  | {
      type: 'fill-form';
      path: string;
      form: FormKey;
      open?: 'edit-profile' | 'report';
      values: Record<string, unknown>;
      label: string;
    }
  /** Đăng xuất. */
  | { type: 'logout'; label: string };

/** Nút trợ lý bấm được (web gắn `data-assistant`). */
export type ClickTarget =
  | 'save'
  | 'save-search'
  | 'show-phone'
  | 'mark-all-read'
  | 'notify-email'
  | 'notify-sms'
  | 'export-data';

/** Form trợ lý điền sẵn được (trang web đăng ký qua useAssistantForm). */
export type FormKey = 'listing' | 'product' | 'profile' | 'review' | 'report';

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
  /** `token`: JWT người đang chat (chưa đăng nhập → undefined), chỉ dùng cho GET về chính họ. */
  run: (
    args: z.infer<S>,
    api: TroiApiPort,
    token?: string,
  ) => Promise<ToolResult>;
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
  /** Thao tác agent làm trên giao diện, theo thứ tự widget thực hiện. */
  actions: ChatAction[];
}

/** Sự kiện SSE gửi về widget. */
export type ChatEvent =
  | { event: 'status'; data: { text: string } }
  /** Đoạn chữ model vừa sinh (stream) — widget nối dần; `text` cuối cùng là câu đầy đủ, thay thế. */
  | { event: 'delta'; data: { text: string } }
  | { event: 'text'; data: { text: string } }
  | { event: 'cards'; data: { items: ChatCard[] } }
  | { event: 'action'; data: ChatAction };

/** Thẻ vừa hiện ở lượt trước (widget gửi lại) — để hiểu "phòng thứ 2", "món đầu tiên". */
export interface RecentItem {
  kind: 'listing' | 'product';
  id: string;
  title: string;
}

export interface ChatContext {
  /** Trang người dùng đang xem, vd "/tim-kiem", "/phong-tro/<id>". */
  page?: string;
  section?: 'housing' | 'market';
  /** Lưu tin, nhắn tin, lưu tìm kiếm cần đăng nhập. */
  isLoggedIn?: boolean;
  recentItems?: RecentItem[];
}
