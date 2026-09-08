export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
};

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
