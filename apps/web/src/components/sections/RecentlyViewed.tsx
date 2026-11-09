'use client';

import { useEffect, useState } from 'react';
import type { Listing } from '@tro-oi/shared';

import { readViewHistory } from '@/lib/viewHistory';

import { SectionNews } from './SectionNews';

/** "Tin bạn đã xem" trên trang chủ — đọc localStorage sau khi mount, chưa xem tin nào thì ẩn. */
export function RecentlyViewed() {
  const [items, setItems] = useState<Listing[]>([]);

  useEffect(() => {
    setItems(readViewHistory());
  }, []);

  if (items.length === 0) return null;
  return <SectionNews title="Tin bạn đã xem" items={items} />;
}
