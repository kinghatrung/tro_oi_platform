'use client';

import clsx from 'clsx';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCT_CATEGORY_LABELS } from '@tro-oi/shared';

import { CATEGORIES } from '@/constants';

export interface CategoryStripItem {
  /** Giá trị `category` trên URL; "" = Tất cả. */
  value: string;
  label: string;
  icon: string;
}

/** Icon 3D Fluent Emoji (Microsoft, MIT) cho "Tất cả" + ảnh loại hình sẵn có. */
export const HOUSING_CATEGORY_ITEMS: CategoryStripItem[] = [
  { value: '', label: 'Tất cả', icon: '/images/tro-oi/all.png' },
  ...CATEGORIES.map((item) => ({ value: item.category, label: item.title, icon: item.image })),
];

/** Icon 3D Fluent Emoji (Microsoft, MIT): public/images/cho-oi/<category>.png */
export const PRODUCT_CATEGORY_ITEMS: CategoryStripItem[] = [
  { value: '', label: 'Tất cả', icon: '/images/cho-oi/all.png' },
  ...Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
    icon: `/images/cho-oi/${value}.png`,
  })),
];

const ARROW_CLASS =
  'absolute top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-surface text-ink shadow-[0_1px_6px_rgba(0,0,0,0.2)] transition-transform hover:scale-110';

interface CategoryStripProps {
  items: CategoryStripItem[];
  /** Trang nhận bộ lọc (vd trang chủ Chợ ơi → /cho-oi/tim-kiem); bỏ trống = trang hiện tại. */
  basePath?: string;
  className?: string;
}

/**
 * Dải tab loại hình / danh mục bằng icon 3D — bấm để lọc theo `category` (giữ các bộ lọc khác,
 * về trang 1). Tràn khung → nút mũi tên cuộn. Dùng ở Trọ ơi (/tim-kiem) và Chợ ơi.
 */
export function CategoryStrip({ items, basePath, className }: CategoryStripProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const listRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const update = () =>
      setEdges({
        left: list.scrollLeft > 0,
        right: list.scrollLeft + list.clientWidth < list.scrollWidth - 1,
      });
    // ResizeObserver gọi update ngay khi observe → có trạng thái ban đầu
    const observer = new ResizeObserver(update);
    observer.observe(list);
    list.addEventListener('scroll', update, { passive: true });
    return () => {
      observer.disconnect();
      list.removeEventListener('scroll', update);
    };
  }, []);

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('category', value);
    else params.delete('category');
    params.delete('page');
    const target = basePath ?? pathname;
    const query = params.toString();
    router.push(query ? `${target}?${query}` : target, { scroll: !!basePath });
  };

  const scrollList = (direction: 1 | -1) => {
    const list = listRef.current;
    list?.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <nav
      aria-label="Danh mục"
      className={clsx('relative rounded-lg bg-surface px-3 py-4', className)}
    >
      {edges.left && (
        <button
          type="button"
          aria-label="Danh mục trước"
          onClick={() => scrollList(-1)}
          className={clsx(ARROW_CLASS, 'left-2')}
        >
          <ChevronLeft size={20} />
        </button>
      )}
      <div ref={listRef} className="no-scrollbar flex gap-1 overflow-x-auto">
        {items.map((item) => {
          const isSelected = category === item.value;
          return (
            <button
              key={item.value || 'all'}
              type="button"
              aria-pressed={isSelected}
              onClick={() => select(item.value)}
              className={clsx(
                'group flex w-26 shrink-0 cursor-pointer flex-col items-center gap-2 rounded-xl border-0 px-1 py-2 transition-colors',
                isSelected ? 'bg-brand-soft' : 'bg-transparent hover:bg-soft',
              )}
            >
              <Image
                src={item.icon}
                alt=""
                width={56}
                height={56}
                loading="eager"
                unoptimized
                className="size-14 object-contain transition-transform duration-300 group-hover:-translate-y-1"
              />
              <span
                className={clsx(
                  'line-clamp-2 text-center text-sm leading-tight',
                  isSelected ? 'font-bold text-brand' : 'text-ink',
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {edges.right && (
        <button
          type="button"
          aria-label="Danh mục tiếp"
          onClick={() => scrollList(1)}
          className={clsx(ARROW_CLASS, 'right-2')}
        >
          <ChevronRight size={20} />
        </button>
      )}
    </nav>
  );
}
