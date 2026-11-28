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

/** 1 mảnh stream: tool_calls đến từng phần (id / tên / đoạn arguments), ghép theo `index`. */
interface WireChunk {
  choices?: {
    delta?: {
      content?: string | null;
      tool_calls?: (Partial<Omit<WireToolCall, 'function'>> & {
        index?: number;
        function?: { name?: string; arguments?: string };
      })[];
    };
  }[];
  error?: { message?: string };
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
 * Có `onText` → stream (SSE): chữ đẩy ra ngay khi model sinh, tool_calls ghép từ các mảnh.
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
    onText?: (delta: string) => void;
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
      if (res.ok && input.onText) {
        // Nơi không hỗ trợ stream trả JSON thường → đọc như cũ, đẩy cả câu 1 lần
        if (res.headers.get('content-type')?.includes('text/event-stream'))
          return readStream(res, input.onText);
        const turn = parseTurn((await res.json()) as WireResponse);
        if (turn.text) input.onText(turn.text);
        return turn;
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
      onText?: (delta: string) => void;
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
        ...(input.onText && { stream: true }),
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

/** Đọc stream SSE: `data: {json}` từng dòng, kết thúc bằng `data: [DONE]`. */
async function readStream(
  res: Response,
  onText: (delta: string) => void,
): Promise<LlmTurn> {
  let text = '';
  const calls = new Map<
    number,
    { id: string; name: string; args: string; extra?: unknown }
  >();
  const decoder = new TextDecoder();
  let buffer = '';
  for await (const chunk of res.body as AsyncIterable<Uint8Array>) {
    buffer += decoder.decode(chunk, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const data = line.startsWith('data:') ? line.slice(5).trim() : '';
      if (!data || data === '[DONE]') continue;
      const event = JSON.parse(data) as WireChunk;
      if (event.error) throw new Error(event.error.message ?? 'Model lỗi');
      const delta = event.choices?.[0]?.delta;
      if (delta?.content) {
        text += delta.content;
        onText(delta.content);
      }
      // Gemini gửi cả lời gọi trong 1 mảnh, không có index → dùng vị trí trong mảnh
      delta?.tool_calls?.forEach((call, position) => {
        const key = call.index ?? position;
        const current = calls.get(key) ?? { id: '', name: '', args: '' };
        calls.set(key, {
          id: call.id || current.id,
          name: current.name + (call.function?.name ?? ''),
          args: current.args + (call.function?.arguments ?? ''),
          extra: call.extra_content ?? current.extra,
        });
      });
    }
  }
  const toolCalls = [...calls.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, call], index) => ({
      id: call.id || `call_${index}`,
      name: call.name,
      args: parseArgs(call.args),
      ...(call.extra !== undefined && { extra: call.extra }),
    }));
  return { text, toolCalls };
}

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
