import { ThemeMode } from '@tro-oi/shared';

/**
 * Theme "tự động theo giờ": sáng 6:00–18:00, tối còn lại. Tính theo giờ Việt Nam (UTC+7, không có
 * giờ mùa hè) để server render và trình duyệt ra cùng kết quả — không nháy màu khi tải trang.
 */
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const VN_OFFSET_MS = 7 * HOUR_MS;
export const DAY_START_HOUR = 6;
export const NIGHT_START_HOUR = 18;

const msOfDay = (now: number) => (now + VN_OFFSET_MS) % DAY_MS;

export function themeByClock(now = Date.now()) {
  const hour = msOfDay(now) / HOUR_MS;
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? ThemeMode.LIGHT : ThemeMode.DARK;
}

/** Còn bao lâu (ms) tới lần đổi sáng ↔ tối kế tiếp. */
export function msUntilThemeSwitch(now = Date.now()) {
  const time = msOfDay(now);
  const day = DAY_START_HOUR * HOUR_MS;
  const night = NIGHT_START_HOUR * HOUR_MS;
  if (time < day) return day - time;
  if (time < night) return night - time;
  return DAY_MS - time + day;
}
