import { TransactionType } from '@tro-oi/shared';

/** Formats a number using Vietnamese digit grouping. */
export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
};

/** Giờ Việt Nam cố định UTC+7 (không có giờ mùa hè). */
const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * "dd/mm/yyyy" theo giờ Việt Nam — server (UTC) và trình duyệt ra cùng chuỗi, dùng được khi render
 * ở cả 2 phía (toLocaleDateString theo múi giờ máy chạy nên lệch quanh nửa đêm).
 */
export function formatVietnamDate(date: Date | string | number): string {
  const shifted = new Date(new Date(date).getTime() + VIETNAM_OFFSET_MS);
  if (Number.isNaN(shifted.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(shifted.getUTCDate())}/${pad(shifted.getUTCMonth() + 1)}/${shifted.getUTCFullYear()}`;
}

/** Formats a date as a Vietnamese relative time label. */
export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now();
  const target = new Date(date).getTime();

  if (Number.isNaN(target)) {
    return '';
  }

  const diff = now - target;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) {
    return 'vừa xong';
  }

  if (minutes < 60) {
    return `${minutes} phút trước`;
  }

  if (hours < 24) {
    return `${hours} giờ trước`;
  }

  if (days < 7) {
    return `${days} ngày trước`;
  }

  if (weeks < 4) {
    return `${weeks} tuần trước`;
  }

  if (months < 12) {
    return `${months} tháng trước`;
  }

  return `${years} năm trước`;
}

/** Formats an amount as a compact Vietnamese currency value. */
export function formatVietnameseCurrency(value: string | number | null | undefined): string {
  const amount = Number.parseInt(String(value), 10);
  if (!Number.isFinite(amount)) return '0';
  const absValue = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (absValue >= 1_000_000_000) {
    return `${sign}${formatNumber(absValue / 1_000_000_000)} tỷ`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${formatNumber(absValue / 1_000_000)} triệu`;
  }
  if (absValue >= 1_000) {
    return `${sign}${formatNumber(absValue / 1_000)} nghìn`;
  }
  return `${sign}${formatNumber(absValue)}`;
}

/** Giá tin đăng: thêm "/tháng" với tin cho thuê. */
export function formatListingPrice(price: number, transaction: TransactionType): string {
  const amount = formatVietnameseCurrency(price);
  return transaction === TransactionType.RENT ? `${amount}/tháng` : amount;
}
