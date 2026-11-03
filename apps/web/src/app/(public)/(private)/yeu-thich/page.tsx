'use client';

import Link from 'next/link';
import { Button, Card, Flex, Skeleton } from 'antd';

import { CardItem, EmptyState, EmptyVariant } from '@/components/common';
import { useAuthStore, useRequireUser } from '@/stores/useAuthStore';

/** Tin đã lưu của người dùng (lấy từ store, bỏ lưu ngay trên thẻ). */
export default function FavouritePage() {
  const user = useRequireUser();
  const favorites = useAuthStore((state) => state.favorites);

  return (
    <div>
      <Card
        variant="borderless"
        className="rounded-t-lg! rounded-b-none!"
        classNames={{ body: 'px-4! py-4!' }}
      >
        <h1 className="text-primary">Tin đã lưu ({favorites.length})</h1>
      </Card>

      {!user ? (
        <Card variant="borderless" className="rounded-none!">
          <Skeleton active />
        </Card>
      ) : favorites.length === 0 ? (
        <Card variant="borderless" className="rounded-none!">
          <EmptyState
            variant={EmptyVariant.FAVORITE}
            description="Bạn chưa lưu tin nào. Bấm ♡ Lưu trên tin đăng để xem lại sau."
          >
            <Link href="/tim-kiem">
              <Button type="primary">Tìm trọ ngay</Button>
            </Link>
          </EmptyState>
        </Card>
      ) : (
        <Flex vertical gap={4}>
          {favorites.map((listing) => (
            <CardItem key={listing.id} column listing={listing} />
          ))}
        </Flex>
      )}
    </div>
  );
}
