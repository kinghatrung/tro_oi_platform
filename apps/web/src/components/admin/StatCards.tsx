import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card, Col, Flex, Progress, Row } from 'antd';

export interface StatCardItem {
  title: string;
  value: number;
  icon: ReactNode;
  href: string;
}

/** Hàng thẻ số liệu (bấm để mở trang quản lý tương ứng). */
export function StatCards({ items }: { items: StatCardItem[] }) {
  return (
    <Row gutter={[16, 16]}>
      {items.map((item) => (
        <Col key={item.title} xs={12} md={8} xl={4}>
          <Link href={item.href} className="block h-full">
            <Card variant="borderless" hoverable className="h-full">
              <Flex align="center" gap={8} className="text-sm text-subtle">
                <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  {item.icon}
                </span>
                {item.title}
              </Flex>
              <p className="mt-3 text-2xl font-bold text-ink">
                {item.value.toLocaleString('vi-VN')}
              </p>
            </Card>
          </Link>
        </Col>
      ))}
    </Row>
  );
}

interface StatusBreakdownProps<TStatus extends string> {
  title: string;
  total: number;
  byStatus: Partial<Record<TStatus, number>>;
  labels: Record<TStatus, string>;
  /** Trang quản lý; mỗi dòng mở `${href}?status=...`. */
  href: string;
}

/** Số mục theo từng trạng thái, dạng thanh tỉ lệ. */
export function StatusBreakdown<TStatus extends string>({
  title,
  total,
  byStatus,
  labels,
  href,
}: StatusBreakdownProps<TStatus>) {
  return (
    <Card
      variant="borderless"
      title={title}
      extra={<Link href={href}>Quản lý</Link>}
      className="h-full"
    >
      <Flex vertical gap={12}>
        {(Object.keys(labels) as TStatus[]).map((status) => {
          const count = byStatus[status] ?? 0;
          return (
            <Link key={status} href={`${href}?status=${status}`} className="block">
              <Flex justify="space-between" className="text-sm text-body">
                <span>{labels[status]}</span>
                <span className="font-semibold text-ink">{count}</span>
              </Flex>
              <Progress
                percent={total ? Math.round((count / total) * 100) : 0}
                showInfo={false}
                size="small"
              />
            </Link>
          );
        })}
      </Flex>
    </Card>
  );
}
