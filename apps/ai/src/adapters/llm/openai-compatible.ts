import type {
  LlmMessage,
  LlmPort,
  LlmToolSpec,
  LlmTurn,
  ToolCall,
} from '../../core/ports.js';

/** Mỗi model; quá giờ thì thử model kế tiếp (bình thường trả lời trong vài giây). */
const TIMEOUT_MS = 20_000;

interface WireToolCall {
  id: string;
  type?: 'function';
  function: { name: string; arguments: string };
  /** Gemini: { google: { thought_signature } } — gửi trả nguyên vẹn. */
  extra_content?: unknown;
}

interface WireResponse {
  choices?: {
    message?: { content?: string | null; tool_calls?: WireToolCall[] };
  }[];
  error?: { message?: string };
}

/** JSON hỏng → để nguyên chuỗi: schema công cụ sẽ báo lỗi và model được yêu cầu gửi lại. */
const parseArgs = (raw: string): unknown => {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return raw;
  }
};

const toWire = (message: LlmMessage) => {
  if (message.role === 'tool') {
    return {
      role: 'tool',
      tool_call_id: message.toolCallId,
      content: message.content,
    };
  }
  if (message.role === 'assistant' && message.toolCalls?.length) {
    return {
      role: 'assistant',
      content: message.content || null,
      tool_calls: message.toolCalls.map((call) => ({
        id: call.id,
        type: 'function',
        function: { name: call.name, arguments: JSON.stringify(call.args) },
        ...(call.extra !== undefined && { extra_content: call.extra }),
      })),
    };
  }
  return { role: message.role, content: message.content };
};

/**
 * Mọi nhà cung cấp có endpoint POST /chat/completions kiểu OpenAI (function calling):
 * Gemini, Groq, OpenRouter, Ollama, vLLM… — đổi model chỉ đổi AI_BASE_URL / AI_MODEL / AI_API_KEY.
 * shortcut: chưa stream token từ model (trả cả câu 1 lần) — thêm stream: true khi cần chữ hiện dần.
 */
export class OpenAiCompatibleLlm implements LlmPort {
  readonly name: string;
  private readonly models: string[];

  /** `model`: 1 tên, hoặc nhiều tên cách nhau dấu phẩy — model trước quá tải / hết lượt thì thử model sau. */
  constructor(
    private readonly baseUrl: string,
    model: string,
    private readonly apiKey?: string,
  ) {
    this.models = model
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);
    this.name = `openai-compatible:${this.models.join(',')}`;
  }

  async complete(input: {
    system: string;
    messages: LlmMessage[];
    tools: LlmToolSpec[];
    signal?: AbortSignal;
  }): Promise<LlmTurn> {
    let lastError = new Error('Chưa cấu hình AI_MODEL');
    for (const model of this.models) {
      let res: Response;
      try {
        res = await this.request(model, input);
      } catch (error) {
        if (input.signal?.aborted) throw error; // người dùng huỷ → dừng hẳn
        // Hết giờ / lỗi mạng → thử model kế tiếp
        lastError = new Error(
          `Model ${model} không phản hồi: ${(error as Error).message}`,
        );
        continue;
      }
      // Gemini trả lỗi dạng mảng [{ error }], phần lớn nơi khác dạng { error }
      const raw = (await res.json().catch(() => ({}))) as
        WireResponse | WireResponse[];
      const body = Array.isArray(raw) ? (raw[0] ?? {}) : raw;
      if (res.ok) return parseTurn(body);
      lastError = new Error(
        `Model ${model} lỗi ${res.status}: ${body.error?.message ?? 'không rõ'}`,
      );
      // Chỉ thử model sau khi lỗi do phía nhà cung cấp (quá tải, hết lượt, model không còn)
      if (!RETRY_NEXT.has(res.status) && res.status < 500) throw lastError;
    }
    throw lastError;
  }

  private request(
    model: string,
    input: {
      system: string;
      messages: LlmMessage[];
      tools: LlmToolSpec[];
      signal?: AbortSignal;
    },
  ) {
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    return fetch(`${this.baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.apiKey && { authorization: `Bearer ${this.apiKey}` }),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: input.system },
          ...input.messages.map(toWire),
        ],
        ...(input.tools.length > 0 && {
          tools: input.tools.map((tool) => ({
            type: 'function',
            function: tool,
          })),
        }),
      }),
      signal: input.signal ? AbortSignal.any([input.signal, timeout]) : timeout,
    });
  }
}

/** 404 model không còn / 408 hết giờ / 429 hết lượt → thử model kế tiếp (5xx luôn thử). */
const RETRY_NEXT = new Set([404, 408, 429]);

function parseTurn(body: WireResponse): LlmTurn {
  const message = body.choices?.[0]?.message;
  const toolCalls: ToolCall[] = (message?.tool_calls ?? []).map(
    (call, index) => ({
      // Vài nhà cung cấp không trả id → tự sinh để ghép kết quả công cụ
      id: call.id || `call_${index}`,
      name: call.function.name,
      args: parseArgs(call.function.arguments),
      ...(call.extra_content !== undefined && { extra: call.extra_content }),
    }),
  );
  return { text: message?.content ?? '', toolCalls };
}
