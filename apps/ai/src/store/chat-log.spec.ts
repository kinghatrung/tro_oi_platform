import { ChatLog, RETENTION_DAYS, flagsOf, type ChatTurn } from './chat-log.js';

const DAY = 86_400_000;

const turn = (id: string, patch: Partial<ChatTurn> = {}): ChatTurn => ({
  id,
  sessionId: 's1',
  section: 'housing',
  question: 'phòng dưới 4 củ',
  answer: 'Có 3 phòng.',
  tools: [{ name: 'tim_tin', args: { maxPrice: 4 }, total: 3 }],
  cards: 3,
  model: 'test',
  ms: 1200,
  ...patch,
});

describe('ChatLog', () => {
  it('tự gắn dấu: lỗi, không trả lời, 0 kết quả, công cụ lỗi', () => {
    expect(flagsOf(turn('a'))).toEqual([]);
    expect(
      flagsOf(
        turn('b', {
          answer: '',
          error: 'Model lỗi 503',
          tools: [
            { name: 'tim_tin', args: {}, total: 0 },
            { name: 'xem_tin', args: {}, error: 'Không tìm thấy' },
          ],
        }),
      ),
    ).toEqual(['error', 'no_answer', 'no_results', 'tool_error']);
  });

  it('lưu, 👍/👎, lọc "cần xem lại" (có dấu hoặc bị 👎), mới nhất trước', () => {
    const log = new ChatLog(':memory:');
    const now = Date.now();
    log.save(turn('ok'), new Date(now - 3000));
    log.save(
      turn('empty', { tools: [{ name: 'tim_tin', args: {}, total: 0 }] }),
      new Date(now - 2000),
    );
    log.save(turn('bad'), new Date(now - 1000));

    expect(log.rate('bad', -1)).toBe(true);
    expect(log.rate('khong-co', 1)).toBe(false);

    const review = log.list('review', 1, 20);
    expect(review.total).toBe(2);
    expect(review.items.map((item) => item.id)).toEqual(['bad', 'empty']);
    expect(review.items[0]).toMatchObject({ rating: -1, flags: [] });
    expect(review.items[1]).toMatchObject({
      flags: ['no_results'],
      tools: [{ name: 'tim_tin', total: 0 }],
    });
    expect(log.list('all', 2, 2)).toMatchObject({
      total: 3,
      items: [{ id: 'ok' }],
    });
  });

  it(`xoá log cũ hơn ${RETENTION_DAYS} ngày`, () => {
    const log = new ChatLog(':memory:');
    log.save(turn('old'), new Date(Date.now() - (RETENTION_DAYS + 1) * DAY));
    log.save(turn('new'));
    expect(log.prune()).toBe(1);
    expect(log.list('all', 1, 20).items.map((item) => item.id)).toEqual([
      'new',
    ]);
  });
});
