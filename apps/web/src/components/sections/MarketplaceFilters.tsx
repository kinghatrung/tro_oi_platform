'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Flex, Skeleton, Tabs } from 'antd';
import type { ProductItem } from '@tro-oi/shared';

import { searchProducts } from '@/api/products';
import {
  CarouselItem,
  EmptyState,
  EmptyVariant,
  HeaderToolbar,
  PaginationControl,
  ProductCard,
  useIsClient,
  type ViewMode,
} from '@/components/common';
import { PRODUCT_SORT_OPTIONS } from '@/lib/constants/constantsProduct';
import { readProductHistory } from '@/lib/viewHistory';
import { formatNumber } from '@/utils/helpers';

const FOR_YOU_SIZE = 12;
const SORT_OPTIONS = PRODUCT_SORT_OPTIONS.map(({ value, label }) => ({ key: value, label }));
const DEFAULT_SORT = PRODUCT_SORT_OPTIONS[0].value;

/** Lưới thẻ món đồ, 5 cột ở màn rộng. */
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

interface ProductResultsListProps {
  items: ProductItem[];
  total: number;
  pageSize: number;
  currentPage: number;
}

/**
 * Kết quả /cho-oi/tim-kiem (như SearchResultsList của Trọ ơi): thanh đầu "N món đồ" + sắp xếp
 * (lưu trên URL ?sort=) + lưới / danh sách (lưu cục bộ, mặc định lưới) + phân trang.
 */
export function ProductResultsList({
  items,
  total,
  pageSize,
  currentPage,
}: ProductResultsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const sortKey = searchParams.get('sort') ?? DEFAULT_SORT;

  const handleSortChange = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === DEFAULT_SORT) params.delete('sort');
      else params.set('sort', key);
      params.delete('page');
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return (
    <Flex vertical gap={4}>
      <HeaderToolbar
        sortKey={sortKey}
        onSortChange={handleSortChange}
        sortOptions={SORT_OPTIONS}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        extra={`${formatNumber(total)} món đồ`}
      />

      {items.length === 0 ? (
        <div className="bg-surface py-12">
          <EmptyState
            variant={EmptyVariant.SEARCH}
            description="Chưa có món đồ phù hợp. Thử bỏ bớt bộ lọc hoặc đổi khu vực."
          />
        </div>
      ) : viewMode === 'grid' ? (
        <ProductGrid items={items} emptyText="" />
      ) : (
        <Flex vertical gap={4}>
          {items.map((product) => (
            <ProductCard key={product.id} column product={product} />
          ))}
        </Flex>
      )}

      {total > pageSize && (
        <PaginationControl total={total} pageSize={pageSize} currentPage={currentPage} />
      )}
    </Flex>
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

/** Khối chính trang chủ Chợ ơi: tab "Dành cho bạn" / "Mới nhất" (render ở server). */
export function MarketplaceFeed({ latest }: { latest: ReactNode }) {
  return (
    <section className="mb-4 rounded-lg bg-surface px-5 pb-5">
      <Tabs
        size="large"
        defaultActiveKey="for-you"
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
  const isClient = useIsClient();
  const items = useMemo(() => (isClient ? readProductHistory() : []), [isClient]);

  if (items.length === 0) return null;
  return (
    <section className="mb-4 rounded-lg bg-surface p-5">
      <p className="text-primary mb-4">Đồ bạn đã xem</p>
      <CarouselItem items={items} renderItem={(product) => <ProductCard product={product} />} />
    </section>
  );
}
