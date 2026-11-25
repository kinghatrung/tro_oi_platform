import { TOOLS } from '../tools/index.js';
import { MAX_TOOL_ROUNDS, Orchestrator } from './orchestrator.js';
import type {
  ChatEvent,
  LlmPort,
  LlmTurn,
  RunSummary,
  TroiApiPort,
} from './ports.js';

const LISTING = {
  id: 'a'.repeat(24),
  title: 'Phòng trọ khép kín Cầu Giấy',
  price: 3_500_000,
  images: ['http://api/uploads/a.jpg'],
  transaction: 'rent-room',
  category: 'phong-tro',
  area: 18,
  address: { ward: 'Phường Cầu Giấy', city: 'Hà Nội' },
};

/** Model giả trả lần lượt các lượt đã soạn; ghi lại số công cụ được gửi mỗi lượt. */
const scriptedLlm = (turns: LlmTurn[]) => {
  const toolCounts: number[] = [];
  const llm: LlmPort = {
    name: 'test',
    complete: ({ tools }) => {
      toolCounts.push(tools.length);
      return Promise.resolve(
        turns.shift() ?? { text: 'Hết kịch bản', toolCalls: [] },
      );
    },
  };
  return { llm, toolCounts };
};

const fakeApi = () => {
  const calls: { path: string; params: Record<string, unknown> }[] = [];
  const api: TroiApiPort = {
    get: <T>(path: string, params: Record<string, unknown> = {}) => {
      calls.push({ path, params });
      return Promise.resolve({ items: [LISTING], total: 1 } as T);
    },
  };
  return { api, calls };
};

let lastSummary: RunSummary | undefined;

const run = async (orchestrator: Orchestrator) => {
  const events: ChatEvent[] = [];
  lastSummary = await orchestrator.run(
    [{ role: 'user', content: 'phòng dưới 4 củ ở cầu giấy' }],
    {},
    (e) => events.push(e),
  );
  return events;
};

describe('Orchestrator', () => {
  it('gọi công cụ → đổi triệu sang đồng, thêm "Phường" → trả lời + thẻ tin từ dữ liệu API', async () => {
    const { llm } = scriptedLlm([
      {
        text: '',
        toolCalls: [
          {
            id: 'c1',
            name: 'tim_tin',
            args: { ward: 'Cầu Giấy', maxPrice: 4 },
          },
        ],
      },
      { text: 'Có 1 phòng 3,5 triệu.', toolCalls: [] },
    ]);
    const { api, calls } = fakeApi();
    const events = await run(new Orchestrator(llm, api, TOOLS));

    expect(calls[0]).toMatchObject({
      path: '/listings',
      params: { ward: 'Phường Cầu Giấy', maxPrice: 4_000_000, pageSize: 3 },
    });
    expect(events.map((e) => e.event)).toEqual([
      'status',
      'text',
      'cards',
      'action',
    ]);
    expect(events[2]).toMatchObject({
      data: { items: [{ kind: 'listing', id: LISTING.id, price: 3_500_000 }] },
    });
    // Agent gõ tên khu vực vào ô tìm kiếm + Enter, rồi áp bộ lọc (giá theo triệu như URL của web)
    const action = {
      type: 'open-search',
      query: 'Cầu Giấy',
      path: '/tim-kiem?keyword=C%E1%BA%A7u+Gi%E1%BA%A5y&ward=Ph%C6%B0%E1%BB%9Dng+C%E1%BA%A7u+Gi%E1%BA%A5y&maxPrice=4',
      label: 'Nhà ở · Phường Cầu Giấy · dưới 4 triệu',
    };
    expect(events[3]).toEqual({ event: 'action', data: action });
    // Tóm tắt để lưu log: câu trả lời, số thẻ, công cụ đã gọi + số kết quả
    expect(lastSummary).toEqual({
      text: 'Có 1 phòng 3,5 triệu.',
      cards: 1,
      tools: [
        { name: 'tim_tin', args: { ward: 'Cầu Giấy', maxPrice: 4 }, total: 1 },
      ],
      action,
    });
  });

  it('moTrang=false (hỏi nhanh) → không mở trang; nhiều lần tìm → mở theo lần cuối', async () => {
    const quick = scriptedLlm([
      {
        text: '',
        toolCalls: [{ id: 'c1', name: 'tim_tin', args: { moTrang: false } }],
      },
      { text: 'Có 1 phòng.', toolCalls: [] },
    ]);
    const quickEvents = await run(
      new Orchestrator(quick.llm, fakeApi().api, TOOLS),
    );
    expect(quickEvents.some((e) => e.event === 'action')).toBe(false);

    // 0 kết quả → không chuyển sang trang trống
    const empty = scriptedLlm([
      { text: '', toolCalls: [{ id: 'c1', name: 'tim_tin', args: {} }] },
      { text: 'Chưa có phòng.', toolCalls: [] },
    ]);
    const emptyApi: TroiApiPort = {
      get: <T>() => Promise.resolve({ items: [], total: 0 } as T),
    };
    const emptyEvents = await run(new Orchestrator(empty.llm, emptyApi, TOOLS));
    expect(emptyEvents.some((e) => e.event === 'action')).toBe(false);

    const retry = scriptedLlm([
      {
        text: '',
        toolCalls: [{ id: 'c1', name: 'tim_tin', args: { maxPrice: 2 } }],
      },
      {
        text: '',
        toolCalls: [
          {
            id: 'c2',
            name: 'tim_do_cu',
            args: {
              keyword: 'tủ lạnh',
              minPrice: 1_000_000,
              maxPrice: 5_000_000,
            },
          },
        ],
      },
      { text: 'Đây.', toolCalls: [] },
    ]);
    const retryEvents = await run(
      new Orchestrator(retry.llm, fakeApi().api, TOOLS),
    );
    expect(retryEvents.find((e) => e.event === 'action')).toMatchObject({
      data: {
        query: 'tủ lạnh',
        path: '/cho-oi/tim-kiem?keyword=t%E1%BB%A7+l%E1%BA%A1nh&price=1tr-5tr',
        label: 'tủ lạnh · 1 triệu – 5 triệu',
      },
    });
  });

  it('tham số sai / công cụ lạ → báo lỗi lại cho model, không gọi API', async () => {
    const seen: string[] = [];
    const llm: LlmPort = {
      name: 'test',
      complete: ({ messages }) => {
        const last = messages.at(-1);
        if (last?.role === 'tool') {
          seen.push(last.content);
          return Promise.resolve({ text: 'Xin lỗi.', toolCalls: [] });
        }
        return Promise.resolve({
          text: '',
          toolCalls: [
            { id: 'c1', name: 'tim_tin', args: { maxPrice: -1, hack: true } },
          ],
        });
      },
    };
    const { api, calls } = fakeApi();
    await run(new Orchestrator(llm, api, TOOLS));
    expect(calls).toHaveLength(0);
    expect(seen[0]).toContain('Tham số không hợp lệ');
  });

  it(`gọi công cụ quá ${MAX_TOOL_ROUNDS} vòng → lượt cuối không gửi công cụ, bắt trả lời`, async () => {
    const loop = {
      text: '',
      toolCalls: [{ id: 'c', name: 'tim_tin', args: {} }],
    };
    const { llm, toolCounts } = scriptedLlm([
      ...Array.from({ length: MAX_TOOL_ROUNDS }, () => loop),
      { text: 'Đây là kết quả.', toolCalls: [] },
    ]);
    const events = await run(new Orchestrator(llm, fakeApi().api, TOOLS));
    expect(toolCounts.at(-1)).toBe(0);
    expect(events.find((e) => e.event === 'text')).toMatchObject({
      data: { text: 'Đây là kết quả.' },
    });
  });
});
