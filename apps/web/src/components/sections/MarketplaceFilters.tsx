'use client';

import clsx from 'clsx';
import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, Skeleton, Tabs } from 'antd';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PRODUCT_CATEGORY_LABELS, type ProductItem } from '@tro-oi/shared';

import { searchProducts } from '@/api/products';
import { CarouselItem, EmptyState, EmptyVariant, ProductCard } from '@/components/common';
import {
  PRODUCT_CONDITION_OPTIONS,
  PRODUCT_PRICE_RANGES,
  PRODUCT_SORT_OPTIONS,
} from '@/lib/constants/constantsProduct';
import { readProductHistory } from '@/lib/viewHistory';

/** Icon 3D: Fluent Emoji (Microsoft, MIT) — public/images/cho-oi/<category>.png */
const CATEGORY_ITEMS = [
  { value: '', label: 'Tất cả', icon: '/images/cho-oi/all.png' },
  ...Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => ({
    value,
    label,
    icon: `/images/cho-oi/${value}.png`,
  })),
];
const CONDITION_OPTIONS = [{ value: '', label: 'Mọi tình trạng' }, ...PRODUCT_CONDITION_OPTIONS];
const PRICE_OPTIONS = [
  { value: '', label: 'Mọi mức giá' },
  ...PRODUCT_PRICE_RANGES.map(({ key, label }) => ({ value: key, label })),
];
const SORT_OPTIONS = PRODUCT_SORT_OPTIONS.map(({ value, label }) => ({ value, label }));
const FOR_YOU_SIZE = 12;

/** Đổi 1 tham số trên URL và về trang 1. Giá trị rỗng = bỏ lọc. */
function useUpdateParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (key: string, value?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );
}

const ARROW_CLASS =
  'absolute top-1/2 z-10 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-surface text-ink shadow-[0_1px_6px_rgba(0,0,0,0.2)] transition-transform hover:scale-110';

/** Dải danh mục icon 3D ngay dưới ô tìm kiếm — bấm để lọc; tràn khung → nút mũi tên cuộn. */
export function MarketplaceCategories() {
  const updateParam = useUpdateParam();
  const category = useSearchParams().get('category') ?? '';
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

  const scrollList = (direction: 1 | -1) => {
    const list = listRef.current;
    list?.scrollBy({ left: direction * list.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <nav aria-label="Danh mục" className="relative mb-4 rounded-lg bg-surface px-3 py-4">
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
      <div ref={listRef} className="flex gap-1 overflow-x-auto no-scrollbar">
        {CATEGORY_ITEMS.map((item) => {
          const isSelected = category === item.value;
          return (
            <button
              key={item.value || 'all'}
              type="button"
              aria-pressed={isSelected}
              onClick={() => updateParam('category', item.value)}
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
                className="size-14 transition-transform duration-300 group-hover:-translate-y-1"
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

/** Lọc tình trạng, khoảng giá, sắp xếp — đầu tab "Mới nhất". */
export function MarketplaceFilters() {
  const updateParam = useUpdateParam();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-wrap gap-2">
      <Select
        aria-label="Tình trạng"
        className="min-w-36"
        options={CONDITION_OPTIONS}
        value={searchParams.get('condition') ?? ''}
        onChange={(value) => updateParam('condition', value)}
      />
      <Select
        aria-label="Khoảng giá"
        className="min-w-40"
        options={PRICE_OPTIONS}
        value={searchParams.get('price') ?? ''}
        onChange={(value) => updateParam('price', value)}
      />
      <Select
        aria-label="Sắp xếp"
        className="min-w-36"
        options={SORT_OPTIONS}
        value={searchParams.get('sort') ?? PRODUCT_SORT_OPTIONS[0].value}
        onChange={(value) =>
          updateParam('sort', value === PRODUCT_SORT_OPTIONS[0].value ? null : value)
        }
      />
    </div>
  );
}

/** Lưới thẻ món đồ, 6 cột ở màn rộng. */
export function ProductGrid({ items, emptyText }: { items: ProductItem[]; emptyText: string }) {
  if (items.length === 0) {
    return <EmptyState variant={EmptyVariant.SEARCH} description={emptyText} className="py-10!" />;
  }
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/**
 * "Dành cho bạn": ưu tiên danh mục xem nhiều nhất trong "Đồ bạn đã xem", bù bằng đồ mới nhất.
 * Chưa xem gì → đồ mới nhất.
 */
function ForYouProducts() {
  const [items, setItems] = useState<ProductItem[] | null>(null);

  useEffect(() => {
    const counts = new Map<string, number>();
    for (const { category } of readProductHistory()) {
      counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    const favorite = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
    Promise.all([
      favorite
        ? searchProducts({ category: favorite as ProductItem['category'], pageSize: FOR_YOU_SIZE })
        : null,
      searchProducts({ pageSize: FOR_YOU_SIZE }),
    ])
      .then(([preferred, latest]) => {
        const merged = [...(preferred?.items ?? []), ...latest.items];
        const unique = merged.filter(
          (item, index) => merged.findIndex((other) => other.id === item.id) === index,
        );
        setItems(unique.slice(0, FOR_YOU_SIZE));
      })
      .catch(() => setItems([]));
  }, []);

  if (!items) return <Skeleton active paragraph={{ rows: 6 }} />;
  return <ProductGrid items={items} emptyText="Chưa có món đồ nào." />;
}

/** Khối chính: tab "Dành cho bạn" / "Mới nhất" (theo bộ lọc trên URL, render ở server). */
export function MarketplaceFeed({
  latest,
  initialTab,
}: {
  latest: ReactNode;
  initialTab: 'for-you' | 'latest';
}) {
  const [tab, setTab] = useState<string>(initialTab);

  return (
    <section className="mb-4 rounded-lg bg-surface px-5 pb-5">
      <Tabs
        size="large"
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'for-you',
            label: <span className="font-bold">Dành cho bạn</span>,
            children: <ForYouProducts />,
          },
          { key: 'latest', label: <span className="font-bold">Mới nhất</span>, children: latest },
        ]}
      />
    </section>
  );
}

/** "Đồ bạn đã xem" — đọc localStorage sau khi mount, chưa xem món nào thì ẩn. */
export function RecentlyViewedProducts() {
  // Server/hydrate: false → không đọc localStorage, tránh lệch HTML
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const items = useMemo(() => (isClient ? readProductHistory() : []), [isClient]);

  if (items.length === 0) return null;
  return (
    <section className="mb-4 rounded-lg bg-surface p-5">
      <p className="text-primary mb-4">Đồ bạn đã xem</p>
      <CarouselItem items={items} renderItem={(product) => <ProductCard product={product} />} />
    </section>
  );
}
