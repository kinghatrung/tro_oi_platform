'use client';

import { formatRelativeTime, formatVietnamDate } from '@/utils/helpers';

import { useIsClient } from './useIsClient';

/**
 * "x giờ trước" an toàn khi SSR: server + lần hydrate in ngày cố định (giờ VN) nên HTML luôn khớp,
 * sau hydrate mới đổi sang thời gian tương đối (phụ thuộc Date.now() → server và trình duyệt khác nhau).
 */
export function RelativeTime({ date }: { date: string }) {
  const isClient = useIsClient();
  return (
    <time dateTime={date}>{isClient ? formatRelativeTime(date) : formatVietnamDate(date)}</time>
  );
}
