'use client';

import { useEffect, useState } from 'react';
import { App, Card, Col, Flex, Row, Skeleton } from 'antd';
import { Flag, House, ShoppingBag, UserPlus, Users, UserX } from 'lucide-react';
import {
  LISTING_STATUS_LABELS,
  PRODUCT_STATUS_LABELS,
  type AdminStats,
  type ListingStatus,
  type ProductStatus,
} from '@tro-oi/shared';

import { getAdminStats } from '@/api/admin';
import { StatCards, StatusBreakdown, type StatCardItem } from '@/components/admin';

import { ADMIN_BASE } from './const';

/** Tổng quan quản trị: người dùng, tin Trọ ơi, tin Chợ ơi, báo cáo chờ xử lý. */
export default function AdminDashboardPage() {
  const { message } = App.useApp();
  const [stats, setStats] = useState<AdminStats>();

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((error: Error) => message.error(error.message));
  }, [message]);

  if (!stats) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  const cards: StatCardItem[] = [
    {
      title: 'Người dùng',
      value: stats.users.total,
      icon: <Users size={18} />,
      href: `${ADMIN_BASE}/nguoi-dung`,
    },
    {
      title: 'Mới trong 7 ngày',
      value: stats.users.newLast7Days,
      icon: <UserPlus size={18} />,
      href: `${ADMIN_BASE}/nguoi-dung`,
    },
    {
      title: 'Tài khoản bị khoá',
      value: stats.users.blocked,
      icon: <UserX size={18} />,
      href: `${ADMIN_BASE}/nguoi-dung?isBlocked=true`,
    },
    {
      title: 'Tin Trọ ơi',
      value: stats.listings.total,
      icon: <House size={18} />,
      href: `${ADMIN_BASE}/tin-tro`,
    },
    {
      title: 'Tin Chợ ơi',
      value: stats.products.total,
      icon: <ShoppingBag size={18} />,
      href: `${ADMIN_BASE}/tin-cho`,
    },
    {
      title: 'Báo cáo chờ xử lý',
      value: stats.reports.open,
      icon: <Flag size={18} />,
      href: `${ADMIN_BASE}/bao-cao`,
    },
  ];

  return (
    <Flex vertical gap={16}>
      <StatCards items={cards} />
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <StatusBreakdown<ListingStatus>
            title="Tin Trọ ơi theo trạng thái"
            total={stats.listings.total}
            byStatus={stats.listings.byStatus}
            labels={LISTING_STATUS_LABELS}
            href={`${ADMIN_BASE}/tin-tro`}
          />
        </Col>
        <Col xs={24} lg={12}>
          <StatusBreakdown<ProductStatus>
            title="Tin Chợ ơi theo trạng thái"
            total={stats.products.total}
            byStatus={stats.products.byStatus}
            labels={PRODUCT_STATUS_LABELS}
            href={`${ADMIN_BASE}/tin-cho`}
          />
        </Col>
      </Row>
    </Flex>
  );
}
