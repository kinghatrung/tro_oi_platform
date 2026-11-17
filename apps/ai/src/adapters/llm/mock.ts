import type { LlmMessage, LlmPort, LlmTurn } from '../../core/ports.js';

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;
const UNIT = String.raw`\s*(?:tr|triệu|củ)`;
const toNumber = (value: string) => Number(value.replace(',', '.'));

/** "3–5 triệu" → {min 3, max 5}; "dưới 4 củ" → {max 4}; "trên 2tr" → {min 2}. */
export function parsePriceRange(text: string) {
  const lower = text.toLowerCase();
  const range = lower.match(
    new RegExp(`${NUMBER}\\s*(?:-|–|đến|tới)\\s*${NUMBER}${UNIT}`),
  );
  if (range)
    return { minPrice: toNumber(range[1]), maxPrice: toNumber(range[2]) };
  const under = lower.match(
    new RegExp(`(?:dưới|tối đa|không quá|<)\\s*${NUMBER}${UNIT}`),
  );
  if (under) return { maxPrice: toNumber(under[1]) };
  const over = lower.match(
    new RegExp(`(?:trên|từ|tối thiểu|>)\\s*${NUMBER}${UNIT}`),
  );
  if (over) return { minPrice: toNumber(over[1]) };
  return {};
}

/**
 * Model giả để phát triển khi chưa có key (AI_PROVIDER=mock): gọi tim_tin với khoảng giá đọc được,
 * rồi tóm tắt số kết quả. Không hiểu ngôn ngữ thật — chỉ để thử toàn bộ luồng chat / thẻ / SSE.
 */
export class MockLlm implements LlmPort {
  readonly name = 'mock';

  complete(input: { messages: LlmMessage[] }): Promise<LlmTurn> {
    const last = input.messages.at(-1);
    if (last?.role === 'tool') {
      const { total, error } = JSON.parse(last.content) as {
        total?: number;
        error?: string;
      };
      const text = error
        ? `Mình chưa lấy được dữ liệu (${error}).`
        : total
          ? `Mình tìm thấy ${total} tin phù hợp, đây là vài tin tiêu biểu. (Đang dùng model giả — nối model thật trong apps/ai/.env.local.)`
          : 'Chưa có tin nào khớp. Bạn thử nới khoảng giá hoặc đổi khu vực nhé.';
      return Promise.resolve({ text, toolCalls: [] });
    }
    const question = last?.role === 'user' ? last.content : '';
    return Promise.resolve({
      text: '',
      toolCalls: [
        {
          id: 'mock_1',
          name: 'tim_tin',
          args: { ...parsePriceRange(question), sort: 'price_asc' },
        },
      ],
    });
  }
}
