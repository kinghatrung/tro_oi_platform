'use client';

import Link from 'next/link';
import { App, Button, Card, Col, Flex, Row, Skeleton, Tabs } from 'antd';
import { Search, Trash2 } from 'lucide-react';
import type { SavedSearch } from '@tro-oi/shared';

import { CardItem, EmptyState, EmptyVariant, ProductCard } from '@/components/common';
import { useAuthStore, useRequireUser } from '@/stores/useAuthStore';
import { formatRelativeTime } from '@/utils/helpers';

/** Tin Trọ ơi + món đồ Chợ ơi + tìm kiếm đã lưu (lấy từ store, bỏ lưu ngay tại chỗ). */
export default function FavouritePage() {
  const user = useRequireUser();
  const { message } = App.useApp();
  const favorites = useAuthStore((state) => state.favorites);
  const favoriteProducts = useAuthStore((state) => state.favoriteProducts);
  const savedSearches = useAuthStore((state) => state.savedSearches);

  const removeSearch = (search: SavedSearch) =>
    useAuthStore
      .getState()
      .toggleSavedSearch(search.query, search.title)
      .catch((error: Error) => message.error(error.message));

  if (!user) {
    return (
      <Card variant="borderless">
        <Skeleton active />
      </Card>
    );
  }

  return (
    <Card variant="borderless" classNames={{ body: 'pt-2!' }}>
      <h1 className="text-primary pt-2">Đã lưu</h1>
      <Tabs
        items={[
          {
            key: 'listings',
            label: `Tin Trọ ơi (${favorites.length})`,
            children:
              favorites.length === 0 ? (
                <EmptyState
                  variant={EmptyVariant.FAVORITE}
                  description="Bạn chưa lưu tin nào. Bấm ♡ Lưu trên tin đăng để xem lại sau."
                >
                  <Link href="/tim-kiem">
                    <Button type="primary">Tìm trọ ngay</Button>
                  </Link>
                </EmptyState>
              ) : (
                <Flex vertical gap={4}>
                  {favorites.map((listing) => (
                    <CardItem key={listing.id} column listing={listing} />
                  ))}
                </Flex>
              ),
          },
          {
            key: 'products',
            label: `Đồ Chợ ơi (${favoriteProducts.length})`,
            children:
              favoriteProducts.length === 0 ? (
                <EmptyState
                  variant={EmptyVariant.FAVORITE}
                  description="Bạn chưa lưu món đồ nào. Bấm ♡ trên món đồ để xem lại sau."
                >
                  <Link href="/cho-oi">
                    <Button type="primary">Dạo Chợ ơi</Button>
                  </Link>
                </EmptyState>
              ) : (
                <Row gutter={[16, 16]}>
                  {favoriteProducts.map((product) => (
                    <Col key={product.id} xs={12} md={8} lg={6}>
                      <ProductCard product={product} />
                    </Col>
                  ))}
                </Row>
              ),
          },
          {
            key: 'searches',
            label: `Tìm kiếm (${savedSearches.length})`,
            children:
              savedSearches.length === 0 ? (
                <EmptyState
                  variant={EmptyVariant.SEARCH}
                  description="Chưa có tìm kiếm nào. Bấm Lưu tìm kiếm ở trang tìm kiếm để quay lại bộ lọc đó nhanh hơn."
                >
                  <Link href="/tim-kiem">
                    <Button type="primary">Tìm trọ ngay</Button>
                  </Link>
                </EmptyState>
              ) : (
                <ul className="divide-y divide-line">
                  {savedSearches.map((search) => (
                    <li key={search.id} className="flex items-center gap-3 py-3">
                      <Search size={18} className="shrink-0 text-brand" />
                      <Link
                        href={search.query ? `/tim-kiem?${search.query}` : '/tim-kiem'}
                        className="min-w-0 flex-1"
                      >
                        <span className="block font-semibold text-ink">{search.title}</span>
                        <span className="text-xs text-subtle">
                          Lưu {formatRelativeTime(search.createdAt)}
                        </span>
                      </Link>
                      <Button
                        type="text"
                        aria-label={`Xoá tìm kiếm ${search.title}`}
                        icon={<Trash2 size={16} />}
                        onClick={() => removeSearch(search)}
                      />
                    </li>
                  ))}
                </ul>
              ),
          },
        ]}
      />
    </Card>
  );
}
