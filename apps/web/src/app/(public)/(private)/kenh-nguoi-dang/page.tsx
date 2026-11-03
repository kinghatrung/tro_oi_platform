'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { Button, Card, Col, Flex, Row, Skeleton, Statistic } from 'antd';
import { Eye, EyeOff, FileText, Heart, Plus, TrendingUp } from 'lucide-react';
import { ListingStatus } from '@tro-oi/shared';

import { EmptyState, EmptyVariant } from '@/components/common';
import { NO_IMAGE } from '@/constants';
import { formatListingPrice } from '@/utils/helpers';

import { SELLER_BASE } from './const';
import { useMyListings } from './useMyListings';

const TOP_COUNT = 5;

/** Tổng quan Kênh người đăng: số liệu tin đăng + tin được xem nhiều nhất. */
export default function SellerOverviewPage() {
  const { user, listings } = useMyListings();

  const stats = useMemo(() => {
    const items = listings ?? [];
    return {
      total: items.length,
      active: items.filter((item) => item.status === ListingStatus.ACTIVE).length,
      hidden: items.filter((item) => item.status !== ListingStatus.ACTIVE).length,
      views: items.reduce((sum, item) => sum + (item.viewCount ?? 0), 0),
      saves: items.reduce((sum, item) => sum + (item.favoriteCount ?? 0), 0),
    };
  }, [listings]);
  const topListings = useMemo(
    () =>
      [...(listings ?? [])]
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, TOP_COUNT),
    [listings],
  );
  const statCards = [
    { title: 'Tổng tin đăng', value: stats.total, icon: <FileText size={20} /> },
    { title: 'Đang hiển thị', value: stats.active, icon: <Eye size={20} /> },
    { title: 'Đã ẩn', value: stats.hidden, icon: <EyeOff size={20} /> },
    { title: 'Lượt xem', value: stats.views, icon: <TrendingUp size={20} /> },
    { title: 'Lượt lưu', value: stats.saves, icon: <Heart size={20} /> },
  ];

  if (!user || !listings) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <Flex vertical gap={16}>
      <Card variant="borderless">
        <Flex justify="space-between" align="center" wrap gap={12}>
          <div>
            <h1 className="text-primary text-xl!">Xin chào, {user.name}</h1>
            <p className="text-secondary">Theo dõi hiệu quả và quản lý tin đăng của bạn.</p>
          </div>
          <Link href="/dang-tin">
            <Button type="primary" icon={<Plus size={16} />}>
              Đăng tin mới
            </Button>
          </Link>
        </Flex>
      </Card>

      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col key={card.title} xs={12} md={8} xl={{ flex: '20%' }}>
            <Card variant="borderless" className="h-full">
              <Statistic
                title={
                  <Flex align="center" gap={8}>
                    {card.icon}
                    {card.title}
                  </Flex>
                }
                value={card.value}
                groupSeparator="."
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        variant="borderless"
        title="Tin được xem nhiều nhất"
        extra={<Link href={`${SELLER_BASE}/tin-dang`}>Quản lý tất cả tin</Link>}
      >
        {topListings.length === 0 ? (
          <EmptyState variant={EmptyVariant.LISTING} description="Bạn chưa có tin đăng nào">
            <Link href="/dang-tin">
              <Button type="primary">Đăng tin đầu tiên</Button>
            </Link>
          </EmptyState>
        ) : (
          <Flex vertical gap={12}>
            {topListings.map((listing, index) => (
              <Flex key={listing.id} align="center" gap={12}>
                <span className="w-6 text-center font-bold text-subtle">{index + 1}</span>
                <div className="relative h-14 w-18 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={listing.images[0] || NO_IMAGE}
                    alt={listing.title}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-default line-clamp-1">{listing.title}</p>
                  <p className="text-sm text-price font-semibold">
                    {formatListingPrice(listing.price, listing.transaction)}
                  </p>
                </div>
                <Flex gap={16} className="shrink-0 text-sm text-body">
                  <Flex align="center" gap={4}>
                    <Eye size={16} /> {listing.viewCount ?? 0}
                  </Flex>
                  <Flex align="center" gap={4}>
                    <Heart size={16} /> {listing.favoriteCount ?? 0}
                  </Flex>
                </Flex>
              </Flex>
            ))}
          </Flex>
        )}
      </Card>
    </Flex>
  );
}
