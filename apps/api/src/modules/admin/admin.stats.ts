/** Múi giờ dùng để chia "ngày" trong thống kê quản trị. */
export const STATS_TIME_ZONE = 'Asia/Ho_Chi_Minh';
/** Số ngày của chuỗi hoạt động trả về (web cắt 7 / 30 / 90). */
export const DAILY_DAYS = 90;

const DAY_MS = 24 * 60 * 60 * 1000;
// en-CA cho định dạng YYYY-MM-DD
const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: STATS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Ngày (theo giờ Việt Nam) của một thời điểm, dạng YYYY-MM-DD. */
export const toDayKey = (date: Date) => dayFormatter.format(date);

/** Pipeline đếm bản ghi mới mỗi ngày (giờ Việt Nam) từ `since`: [{ _id: 'YYYY-MM-DD', count }]. */
export const dailyCountPipeline = (since: Date) => [
  { $match: { createdAt: { $gte: since } } },
  {
    $group: {
      _id: {
        $dateToString: {
          format: '%Y-%m-%d',
          date: '$createdAt',
          timezone: STATS_TIME_ZONE,
        },
      },
      count: { $sum: 1 },
    },
  },
];

export interface DailyActivity {
  date: string;
  users: number;
  listings: number;
  products: number;
}

type DayRows = { _id: string; count: number }[];

/**
 * Ghép số đếm theo ngày thành chuỗi liên tục `days` ngày kết thúc ở `now` (cũ → mới);
 * ngày không có bản ghi = 0.
 */
export function buildDailySeries(
  now: Date,
  days: number,
  rows: { users: DayRows; listings: DayRows; products: DayRows },
): DailyActivity[] {
  const lookup = (list: DayRows) =>
    new Map(list.map((row) => [row._id, row.count]));
  const users = lookup(rows.users);
  const listings = lookup(rows.listings);
  const products = lookup(rows.products);

  return Array.from({ length: days }, (_, index) => {
    const date = toDayKey(
      new Date(now.getTime() - (days - 1 - index) * DAY_MS),
    );
    return {
      date,
      users: users.get(date) ?? 0,
      listings: listings.get(date) ?? 0,
      products: products.get(date) ?? 0,
    };
  });
}

/** Thời điểm bắt đầu cửa sổ `days` ngày (có dư 1 ngày để không hụt do lệch múi giờ). */
export const dailyWindowStart = (now: Date, days: number) =>
  new Date(now.getTime() - days * DAY_MS);
