import { buildDailySeries, toDayKey } from './admin.stats.js';

describe('toDayKey', () => {
  it('chia ngày theo giờ Việt Nam (UTC+7)', () => {
    // 18:30 UTC ngày 9 = 01:30 ngày 10 ở Việt Nam
    expect(toDayKey(new Date('2026-11-09T18:30:00Z'))).toBe('2026-11-10');
    expect(toDayKey(new Date('2026-11-09T16:59:00Z'))).toBe('2026-11-09');
  });
});

describe('buildDailySeries', () => {
  it('đủ số ngày, cũ → mới, ngày trống = 0, kết thúc ở hôm nay', () => {
    const now = new Date('2026-11-10T03:00:00Z');
    const series = buildDailySeries(now, 3, {
      users: [{ _id: '2026-11-08', count: 2 }],
      listings: [
        { _id: '2026-11-10', count: 5 },
        { _id: '2026-11-01', count: 9 }, // ngoài cửa sổ → bỏ qua
      ],
      products: [],
    });

    expect(series).toEqual([
      { date: '2026-11-08', users: 2, listings: 0, products: 0 },
      { date: '2026-11-09', users: 0, listings: 0, products: 0 },
      { date: '2026-11-10', users: 0, listings: 5, products: 0 },
    ]);
  });
});
