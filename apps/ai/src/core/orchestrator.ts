import { z } from 'zod';

import { buildSystemPrompt } from './prompt.js';
import type {
  ChatAction,
  ChatCard,
  ChatContext,
  ChatEvent,
  LlmMessage,
  LlmPort,
  LlmToolSpec,
  RunSummary,
  Tool,
  ToolTrace,
  TroiApiPort,
} from './ports.js';

/** Số vòng "model gọi công cụ → đọc kết quả" tối đa cho 1 câu hỏi (chặn vòng lặp vô hạn / tốn lượt). */
export const MAX_TOOL_ROUNDS = 4;
const MAX_CARDS = 6;

/** Rút gọn kết quả công cụ để lưu log: tổng kết quả + lỗi (không lưu dữ liệu tin). */
const traceOf = (name: string, args: unknown, output: unknown): ToolTrace => {
  const result = (output ?? {}) as { total?: unknown; error?: unknown };
  return {
    name,
    args,
    ...(typeof result.total === 'number' && { total: result.total }),
    ...(typeof result.error === 'string' && { error: result.error }),
  };
};

const toSpec = (tool: Tool): LlmToolSpec => {
  // $schema thừa — vài nhà cung cấp từ chối khoá lạ trong tham số công cụ
  const { $schema: _schema, ...parameters } = z.toJSONSchema(tool.schema);
  return { name: tool.name, description: tool.description, parameters };
};

/**
 * Agent loop (ReAct): model đọc câu hỏi → gọi công cụ → đọc kết quả → … → trả lời.
 * Công cụ chỉ đọc dữ liệu công khai qua TroiApiPort; tham số model gửi luôn được kiểm bằng schema.
 */
export class Orchestrator {
  private readonly tools: Map<string, Tool>;
  private readonly specs: LlmToolSpec[];

  constructor(
    private readonly llm: LlmPort,
    private readonly api: TroiApiPort,
    tools: Tool[],
  ) {
    this.tools = new Map(tools.map((tool) => [tool.name, tool]));
    this.specs = tools.map(toSpec);
  }

  get modelName() {
    return this.llm.name;
  }

  async run(
    history: LlmMessage[],
    context: ChatContext,
    emit: (event: ChatEvent) => void,
    signal?: AbortSignal,
    token?: string,
  ): Promise<RunSummary> {
    const system = buildSystemPrompt(context);
    const messages = [...history];
    const cards = new Map<string, ChatCard>();
    const traces: ToolTrace[] = [];
    // Thao tác giao diện theo thứ tự model gọi công cụ
    const actions: ChatAction[] = [];

    for (let round = 0; ; round++) {
      // Hết lượt gọi công cụ → bắt model trả lời bằng dữ liệu đang có
      const tools = round < MAX_TOOL_ROUNDS ? this.specs : [];
      const turn = await this.llm.complete({ system, messages, tools, signal });

      if (turn.toolCalls.length === 0 || tools.length === 0) {
        const text = turn.text.trim();
        const shown = [...cards.values()].slice(0, MAX_CARDS);
        const planned = planActions(actions);
        emit({ event: 'text', data: { text } });
        if (shown.length > 0) emit({ event: 'cards', data: { items: shown } });
        for (const action of planned) emit({ event: 'action', data: action });
        return { text, cards: shown.length, tools: traces, actions: planned };
      }

      messages.push({
        role: 'assistant',
        content: turn.text,
        toolCalls: turn.toolCalls,
      });
      // Các công cụ trong 1 lượt chạy song song; kết quả + thao tác lấy lại đúng thứ tự gọi
      const results = await Promise.all(
        turn.toolCalls.map(async (call) => {
          const { output, action } = await this.runTool(
            call.name,
            call.args,
            emit,
            cards,
            token,
          );
          traces.push(traceOf(call.name, call.args, output));
          return {
            action,
            message: {
              role: 'tool' as const,
              toolCallId: call.id,
              name: call.name,
              content: JSON.stringify(output),
            },
          };
        }),
      );
      for (const { action } of results) if (action) actions.push(action);
      messages.push(...results.map(({ message }) => message));
    }
  }

  /** Lỗi (công cụ lạ, tham số sai, API lỗi) trả lại cho model dạng { error } để nó tự sửa / giải thích. */
  private async runTool(
    name: string,
    args: unknown,
    emit: (event: ChatEvent) => void,
    cards: Map<string, ChatCard>,
    token?: string,
  ): Promise<{ output: unknown; action?: ChatAction }> {
    const tool = this.tools.get(name);
    if (!tool) return { output: { error: `Không có công cụ "${name}"` } };

    const parsed = tool.schema.safeParse(args);
    if (!parsed.success) {
      return {
        output: {
          error: `Tham số không hợp lệ: ${z.prettifyError(parsed.error)}`,
        },
      };
    }
    emit({ event: 'status', data: { text: tool.status(parsed.data) } });
    try {
      const result = await tool.run(parsed.data, this.api, token);
      for (const card of result.cards ?? [])
        cards.set(`${card.kind}:${card.id}`, card);
      return { output: result.forModel, action: result.action };
    } catch (error) {
      return {
        output: { error: (error as Error).message || 'Không lấy được dữ liệu' },
      };
    }
  }
}

/**
 * Thứ tự widget làm: chỉ giữ lần tìm kiếm cuối (model hay tìm lại với điều kiện nới ra) và làm nó
 * trước — "tìm … rồi lưu tìm kiếm" cần trang kết quả mở xong; các thao tác khác giữ thứ tự gọi,
 * bỏ thao tác trùng hệt nhau.
 */
export function planActions(actions: ChatAction[]): ChatAction[] {
  const search = actions.findLast((action) => action.type === 'open-search');
  const seen = new Set<string>();
  return [search, ...actions.filter((action) => action.type !== 'open-search')]
    .filter((action): action is ChatAction => Boolean(action))
    .filter((action) => {
      const key = JSON.stringify(action);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
