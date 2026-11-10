'use client';

import { useMemo } from 'react';

import { useIsClient } from '@/components/common';
import { readViewHistory } from '@/lib/viewHistory';

import { SectionNews } from './SectionNews';

/** "Tin bạn đã xem" trên trang chủ — đọc localStorage sau khi hydrate, chưa xem tin nào thì ẩn. */
export function RecentlyViewed() {
  const isClient = useIsClient();
  const items = useMemo(() => (isClient ? readViewHistory() : []), [isClient]);

  if (items.length === 0) return null;
  return <SectionNews title="Tin bạn đã xem" items={items} />;
}
