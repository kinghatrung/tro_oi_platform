import { ViewCounter } from './view-counter.js';

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130 Safari/537.36';

describe('ViewCounter', () => {
  it('cùng người xem trong 30 phút chỉ tính 1 lượt; hết hạn → tính lại', () => {
    const counter = new ViewCounter(1000);
    expect(counter.shouldCount('t1', '1.1.1.1', CHROME, 0)).toBe(true);
    expect(counter.shouldCount('t1', '1.1.1.1', CHROME, 500)).toBe(false);
    expect(counter.shouldCount('t1', '1.1.1.1', CHROME, 1500)).toBe(true);
  });

  it('khác tin / khác IP / khác trình duyệt → lượt riêng', () => {
    const counter = new ViewCounter();
    expect(counter.shouldCount('t1', '1.1.1.1', CHROME)).toBe(true);
    expect(counter.shouldCount('t2', '1.1.1.1', CHROME)).toBe(true);
    expect(counter.shouldCount('t1', '2.2.2.2', CHROME)).toBe(true);
    expect(counter.shouldCount('t1', '1.1.1.1', `${CHROME} Edg/130`)).toBe(
      true,
    );
  });

  it('bot / không có User-Agent → không tính', () => {
    const counter = new ViewCounter();
    expect(counter.shouldCount('t1', '1.1.1.1', 'Googlebot/2.1')).toBe(false);
    expect(
      counter.shouldCount('t1', '1.1.1.1', 'facebookexternalhit/1.1'),
    ).toBe(false);
    expect(counter.shouldCount('t1', '1.1.1.1', undefined)).toBe(false);
  });
});
