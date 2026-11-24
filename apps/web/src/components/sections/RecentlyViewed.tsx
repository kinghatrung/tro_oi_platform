'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Listing } from '@tro-oi/shared';

import { getViewedListings } from '@/api/users';
import { useIsClient } from '@/components/common';
import { readViewHistory } from '@/lib/viewHistory';
import { useAuthStore } from '@/stores/useAuthStore';

import { SectionNews } from './SectionNews';

/**
 * Lịch sử xem: đã đăng nhập → lấy từ tài khoản (đồng bộ giữa thiết bị, giá / trạng thái mới nhất);
 * chưa đăng nhập hoặc API lỗi → bản lưu trên trình duyệt (lịch sử chỉ là tiện ích, không báo lỗi).
 */
export function useViewHistory<T>(readLocal: () => T[], fetchRemote: () => Promise<T[]>) {
  const isClient = useIsClient();
  const userId = useAuthStore((state) => state.user?.id);
  const [remote, setRemote] = useState<{ userId: string; items: T[] }>();
  const local = useMemo(() => (isClient ? readLocal() : []), [isClient, readLocal]);

  useEffect(() => {
    if (!userId) return;
    fetchRemote().then(
      (items) => setRemote({ userId, items }),
      () => setRemote({ userId, items: readLocal() }),
    );
  }, [userId, fetchRemote, readLocal]);

  // Đổi tài khoản → bỏ kết quả của tài khoản trước, dùng bản trình duyệt tới khi tải xong
  return userId && remote?.userId === userId ? remote.items : local;
}

/** "Tin bạn đã xem" trên trang chủ, chưa xem tin nào thì ẩn. */
export function RecentlyViewed() {
  const items = useViewHistory<Listing>(readViewHistory, getViewedListings);

  if (items.length === 0) return null;
  return <SectionNews title="Tin bạn đã xem" items={items} />;
}
