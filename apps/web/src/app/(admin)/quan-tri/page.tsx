'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { App, Button, Card, Col, Row, Segmented, Skeleton, Table, Tag } from 'antd';
import {
  ArrowRight,
  BadgeCheck,
  CalendarX,
  CircleCheck,
  Clock,
  Eye,
  EyeOff,
  FilePen,
  Flag,
  House,
  RefreshCw,
  ShoppingBag,
  TriangleAlert,
  Users,
} from 'lucide-react';
import {
  LISTING_STATUS_LABELS,
  ListingStatus,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
  PROPERTY_CATEGORY_LABELS,
  ProductStatus,
  USER_ROLE_LABELS,
  UserRole,
  type AdminDailyActivity,
  type AdminStats,
} from '@tro-oi/shared';

import { getAdminStats } from '@/api/admin';
import {
  ChartLegend,
  ColumnChart,
  CompositionList,
  LineChart,
  Lollipop,
  PartLegend,
  SegmentedBar,
  Sparkline,
  type ChartItem,
  type ChartPart,
  type ChartSeries,
} from '@/components/admin';
import { formatNumber } from '@/utils/helpers';

import { ADMIN_BASE } from './const';

type ActivityKey = 'users' | 'listings' | 'products';

const RANGES = [
  { value: 7, label: '7 ngày' },
  { value: 30, label: '30 ngày' },
  { value: 90, label: '90 ngày' },
];
const ACTIVITY_SERIES: ChartSeries<ActivityKey>[] = [
  { key: 'users', label: 'Người dùng mới', color: 'var(--series-1)' },
  { key: 'listings', label: 'Tin Trọ ơi mới', color: 'var(--series-2)' },
  { key: 'products', label: 'Tin Chợ ơi mới', color: 'var(--series-3)' },
];

/** Vai trò: màu phân loại theo thứ tự cố định (màu đi theo vai trò, không theo hạng). */
const ROLE_PARTS: { key: UserRole; color: string; onColor?: string }[] = [
  { key: UserRole.RENTER, color: 'var(--series-1)' },
  { key: UserRole.LANDLORD, color: 'var(--series-2)' },
  { key: UserRole.AGENT, color: 'var(--series-3)' },
  { key: UserRole.ADMIN, color: 'var(--series-4)', onColor: 'var(--series-4-ink)' },
];

/** Trạng thái tin: màu trạng thái + icon (không để màu đứng một mình). */
const LISTING_STATUS_PARTS: { key: ListingStatus; color: string; icon: ReactNode }[] = [
  { key: ListingStatus.ACTIVE, color: 'var(--status-good)', icon: <CircleCheck size={16} /> },
  { key: ListingStatus.PENDING, color: 'var(--status-warning)', icon: <Clock size={16} /> },
  { key: ListingStatus.EXPIRED, color: 'var(--status-serious)', icon: <CalendarX size={16} /> },
  { key: ListingStatus.CLOSED, color: 'var(--subtle)', icon: <EyeOff size={16} /> },
  { key: ListingStatus.DRAFT, color: 'var(--line-strong)', icon: <FilePen size={16} /> },
];
const PRODUCT_STATUS_PARTS: { key: ProductStatus; color: string; icon: ReactNode }[] = [
  { key: ProductStatus.ACTIVE, color: 'var(--status-good)', icon: <CircleCheck size={16} /> },
  { key: ProductStatus.PENDING, color: 'var(--status-warning)', icon: <Clock size={16} /> },
  { key: ProductStatus.SOLD, color: 'var(--body)', icon: <BadgeCheck size={16} /> },
  { key: ProductStatus.CLOSED, color: 'var(--subtle)', icon: <EyeOff size={16} /> },
];

/** { key: số } → cột, nhiều → ít; `hideEmpty` bỏ cột 0. */
function toColumns<TKey extends string>(
  counts: Partial<Record<TKey, number>>,
  labels: Record<TKey, string>,
  hideEmpty = false,
): ChartItem[] {
  return (Object.keys(labels) as TKey[])
    .map((key) => ({ key, label: labels[key], value: counts[key] ?? 0 }))
    .filter((item) => !hideEmpty || item.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** Khung thẻ: tiêu đề + phần phải (link) + nội dung. */
function Panel({
  title,
  extra,
  children,
}: {
  title: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="h-full rounded-xl bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-primary">{title}</h2>
        {extra}
      </div>
      {children}
    </section>
  );
}

const panelLink = (href: string, label = 'Quản lý') => (
  <Link href={href} className="flex items-center gap-1 text-sm font-semibold">
    {label} <ArrowRight size={16} />
  </Link>
);

interface KpiTileProps {
  icon: ReactNode;
  label: string;
  value: number;
  /** Dòng phụ: mới trong kỳ, tách nhỏ... */
  hint: ReactNode;
  trend?: number[];
  href: string;
}

/** Thẻ số liệu: nhãn, số lớn, dòng phụ, đường xu hướng của kỳ đang chọn. */
function KpiTile({ icon, label, value, hint, trend, href }: KpiTileProps) {
  return (
    <Link href={href} className="block h-full">
      <div className="flex h-full flex-col rounded-xl bg-surface p-5 transition-shadow hover:shadow-md">
        <div className="flex items-center gap-2 text-sm text-body">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-soft text-brand">
            {icon}
          </span>
          {label}
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-3xl font-bold text-ink">{formatNumber(value)}</p>
          {trend && <Sparkline values={trend} />}
        </div>
        <p className="mt-1 text-xs text-subtle">{hint}</p>
      </div>
    </Link>
  );
}

interface AttentionItemProps {
  icon: ReactNode;
  label: string;
  count: number;
  action: string;
  href: string;
}

/** Việc cần admin xử lý: số + trạng thái (icon + chữ, không chỉ màu). */
function AttentionItem({ icon, label, count, action, href }: AttentionItemProps) {
  const hasWork = count > 0;
  return (
    <Link href={href} className="block h-full">
      <div className="flex h-full items-center gap-4 rounded-xl bg-surface p-4 transition-shadow hover:shadow-md">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-body">{label}</p>
          <p className="text-2xl font-bold text-ink">{formatNumber(count)}</p>
        </div>
        {hasWork ? (
          <Tag color="warning" icon={<TriangleAlert size={12} className="mr-1 inline" />}>
            {action}
          </Tag>
        ) : (
          <Tag color="success" icon={<CircleCheck size={12} className="mr-1 inline" />}>
            Đã xong
          </Tag>
        )}
      </div>
    </Link>
  );
}

/** Tổng quan quản trị: việc cần xử lý, số liệu chính, hoạt động theo ngày, cơ cấu người dùng & tin. */
export default function AdminDashboardPage() {
  const { message } = App.useApp();
  const [stats, setStats] = useState<AdminStats>();
  const [range, setRange] = useState(30);
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [loadedAt, setLoadedAt] = useState<Date>();
  const [isLoading, setIsLoading] = useState(false);

  // setState chỉ trong callback của promise (không gọi đồng bộ trong effect)
  const fetchStats = useCallback(
    () =>
      getAdminStats()
        .then((data) => {
          setStats(data);
          setLoadedAt(new Date());
        })
        .catch((error: Error) => message.error(error.message))
        .finally(() => setIsLoading(false)),
    [message],
  );

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const reload = () => {
    setIsLoading(true);
    void fetchStats();
  };

  const daily = useMemo<AdminDailyActivity[]>(
    () => stats?.daily.slice(-range) ?? [],
    [range, stats],
  );
  const totals = useMemo(
    () =>
      daily.reduce(
        (sum, day) => ({
          users: sum.users + day.users,
          listings: sum.listings + day.listings,
          products: sum.products + day.products,
        }),
        { users: 0, listings: 0, products: 0 },
      ),
    [daily],
  );

  if (!stats) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  const rangeLabel = `${range} ngày qua`;
  const pendingListings = stats.listings.byStatus.pending ?? 0;
  const pendingProducts = stats.products.byStatus.pending ?? 0;
  const roleParts: ChartPart[] = ROLE_PARTS.map(({ key, ...part }) => ({
    key,
    label: USER_ROLE_LABELS[key],
    value: stats.users.byRole[key] ?? 0,
    ...part,
  }));
  const listingStatusParts: ChartPart[] = LISTING_STATUS_PARTS.map(({ key, ...part }) => ({
    key,
    label: LISTING_STATUS_LABELS[key],
    value: stats.listings.byStatus[key] ?? 0,
    href: `${ADMIN_BASE}/tin-tro?status=${key}`,
    ...part,
  }));
  const productStatusParts: ChartPart[] = PRODUCT_STATUS_PARTS.map(({ key, ...part }) => ({
    key,
    label: PRODUCT_STATUS_LABELS[key],
    value: stats.products.byStatus[key] ?? 0,
    href: `${ADMIN_BASE}/tin-cho?status=${key}`,
    ...part,
  }));

  return (
    // Tải lại: giữ khung cũ, làm mờ (không nhảy bố cục)
    <div className={`flex flex-col gap-4 transition-opacity ${isLoading ? 'opacity-60' : ''}`}>
      {/* Tiêu đề + chọn kỳ (áp cho số "mới" và biểu đồ bên dưới) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-primary text-xl!">Tổng quan hệ thống</h1>
          {loadedAt && (
            <p className="text-sm text-subtle">
              Cập nhật lúc{' '}
              {loadedAt.toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Segmented options={RANGES} value={range} onChange={(value) => setRange(Number(value))} />
          <Button
            icon={<RefreshCw size={16} />}
            aria-label="Tải lại số liệu"
            loading={isLoading}
            onClick={reload}
          />
        </div>
      </div>

      {/* Việc cần xử lý */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <AttentionItem
            icon={<House size={22} />}
            label="Tin Trọ ơi chờ duyệt"
            count={pendingListings}
            action="Cần duyệt"
            href={`${ADMIN_BASE}/tin-tro?status=pending`}
          />
        </Col>
        <Col xs={24} md={8}>
          <AttentionItem
            icon={<ShoppingBag size={22} />}
            label="Tin Chợ ơi chờ duyệt"
            count={pendingProducts}
            action="Cần duyệt"
            href={`${ADMIN_BASE}/tin-cho?status=pending`}
          />
        </Col>
        <Col xs={24} md={8}>
          <AttentionItem
            icon={<Flag size={22} />}
            label="Báo cáo vi phạm đang mở"
            count={stats.reports.open}
            action="Cần xử lý"
            href={`${ADMIN_BASE}/bao-cao`}
          />
        </Col>
      </Row>

      {/* Số liệu chính */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <KpiTile
            icon={<Users size={18} />}
            label="Người dùng"
            value={stats.users.total}
            hint={`+${formatNumber(totals.users)} trong ${rangeLabel} · ${formatNumber(stats.users.blocked)} bị khoá`}
            trend={daily.map((day) => day.users)}
            href={`${ADMIN_BASE}/nguoi-dung`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiTile
            icon={<House size={18} />}
            label="Tin Trọ ơi"
            value={stats.listings.total}
            hint={`+${formatNumber(totals.listings)} trong ${rangeLabel} · ${formatNumber(stats.listings.byStatus.active ?? 0)} đang hiển thị`}
            trend={daily.map((day) => day.listings)}
            href={`${ADMIN_BASE}/tin-tro`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiTile
            icon={<ShoppingBag size={18} />}
            label="Tin Chợ ơi"
            value={stats.products.total}
            hint={`+${formatNumber(totals.products)} trong ${rangeLabel} · ${formatNumber(stats.products.byStatus.active ?? 0)} đang bán`}
            trend={daily.map((day) => day.products)}
            href={`${ADMIN_BASE}/tin-cho`}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <KpiTile
            icon={<Eye size={18} />}
            label="Lượt xem tin"
            value={stats.listings.views + stats.products.views}
            hint={`Trọ ơi ${formatNumber(stats.listings.views)} · Chợ ơi ${formatNumber(stats.products.views)}`}
            href={`${ADMIN_BASE}/tin-tro`}
          />
        </Col>
      </Row>

      {/* Hoạt động theo ngày + người dùng theo vai trò */}
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={16}>
          <Panel
            title={`Hoạt động ${rangeLabel}`}
            extra={
              <Segmented
                size="small"
                options={[
                  { value: 'chart', label: 'Biểu đồ' },
                  { value: 'table', label: 'Bảng' },
                ]}
                value={view}
                onChange={(value) => setView(value as 'chart' | 'table')}
              />
            }
          >
            {view === 'chart' ? (
              <>
                <ChartLegend series={ACTIVITY_SERIES} />
                <div className="mt-3">
                  <LineChart rows={daily} series={ACTIVITY_SERIES} />
                </div>
              </>
            ) : (
              <Table<AdminDailyActivity>
                size="small"
                rowKey="date"
                pagination={false}
                scroll={{ y: 280 }}
                dataSource={[...daily].reverse()}
                columns={[
                  {
                    title: 'Ngày',
                    dataIndex: 'date',
                    render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
                  },
                  ...ACTIVITY_SERIES.map((s) => ({
                    title: s.label,
                    dataIndex: s.key,
                    align: 'right' as const,
                  })),
                ]}
              />
            )}
          </Panel>
        </Col>
        <Col xs={24} xl={8}>
          <Panel title="Người dùng theo vai trò" extra={panelLink(`${ADMIN_BASE}/nguoi-dung`)}>
            <p className="text-sm text-body">
              <b className="text-3xl text-ink">{formatNumber(stats.users.total)}</b> tài khoản
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <SegmentedBar parts={roleParts} tall />
              <PartLegend parts={roleParts} />
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-2">
              {roleParts.map((part) => (
                <li key={part.key} className="rounded-lg bg-soft px-3 py-2">
                  <p className="text-xs text-body">{part.label}</p>
                  <p className="text-lg font-bold text-ink">{formatNumber(part.value)}</p>
                </li>
              ))}
            </ul>
          </Panel>
        </Col>
      </Row>

      {/* Cơ cấu tin Trọ ơi */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Panel title="Tin Trọ ơi theo trạng thái" extra={panelLink(`${ADMIN_BASE}/tin-tro`)}>
            <CompositionList parts={listingStatusParts} />
          </Panel>
        </Col>
        <Col xs={24} lg={8}>
          <Panel title="Tin Trọ ơi theo loại hình">
            <ColumnChart items={toColumns(stats.listings.byCategory, PROPERTY_CATEGORY_LABELS)} />
          </Panel>
        </Col>
        <Col xs={24} lg={8}>
          <Panel title="Tỉnh nhiều tin nhất" extra={panelLink(`${ADMIN_BASE}/ban-do`, 'Bản đồ')}>
            {stats.listings.topCities.length === 0 ? (
              <p className="text-sm text-subtle">Chưa có tin đang hiển thị.</p>
            ) : (
              <Lollipop
                items={stats.listings.topCities.map(({ city, count }) => ({
                  key: city,
                  label: city,
                  value: count,
                }))}
              />
            )}
          </Panel>
        </Col>
      </Row>

      {/* Cơ cấu tin Chợ ơi */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Panel title="Tin Chợ ơi theo trạng thái" extra={panelLink(`${ADMIN_BASE}/tin-cho`)}>
            <CompositionList parts={productStatusParts} />
          </Panel>
        </Col>
        <Col xs={24} lg={16}>
          <Panel title="Tin Chợ ơi theo danh mục">
            {/* 15 danh mục → chỉ vẽ danh mục đang có tin */}
            <ColumnChart
              items={toColumns(stats.products.byCategory, PRODUCT_CATEGORY_LABELS, true)}
            />
          </Panel>
        </Col>
      </Row>
    </div>
  );
}
