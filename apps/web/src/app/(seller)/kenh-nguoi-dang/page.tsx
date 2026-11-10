'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button, Card, Col, Row, Skeleton, Tag } from 'antd';
import {
  ArrowRight,
  CircleCheck,
  Eye,
  Heart,
  MapPin,
  Megaphone,
  PackagePlus,
  Plus,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { ListingStatus, ProductStatus, type Listing, type ProductItem } from '@tro-oi/shared';

import { getMyProducts } from '@/api/products';
import { EmptyState, EmptyVariant, VietnamMap, type MapMarker } from '@/components/common';
import { NO_IMAGE } from '@/constants';
import { formatListingPrice, formatNumber } from '@/utils/helpers';

import { SELLER_BASE } from './const';
import { useMyListings } from './useMyListings';

const TOP_COUNT = 5;
const ATTENTION_COUNT = 5;
/** Tin còn ≤ số ngày này thì nhắc gia hạn. */
const EXPIRING_DAYS = 7;
const DAY_MS = 86_400_000;

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint: string;
}

/** Ô số liệu: icon màu thương hiệu + số lớn + ghi chú nhỏ. */
function StatCard({ icon, label, value, hint }: StatCardProps) {
  return (
    <div className="h-full rounded-xl bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-body">{label}</p>
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
      <p className="mt-1 text-xs text-subtle">{hint}</p>
    </div>
  );
}

/** Lời chào theo giờ trong ngày. */
function greeting(hour: number) {
  if (hour < 11) return 'Chào buổi sáng';
  if (hour < 14) return 'Chào buổi trưa';
  if (hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

/** Tin cần xử lý: hết hạn, sắp hết hạn, chờ duyệt. */
function attentionOf(listing: Listing, now: number): { label: string; color: string } | null {
  if (listing.status === ListingStatus.EXPIRED) return { label: 'Đã hết hạn', color: 'warning' };
  if (listing.status === ListingStatus.PENDING) return { label: 'Chờ duyệt', color: 'processing' };
  if (listing.status === ListingStatus.ACTIVE && listing.expiresAt) {
    const days = Math.ceil((new Date(listing.expiresAt).getTime() - now) / DAY_MS);
    if (days <= EXPIRING_DAYS) return { label: `Còn ${Math.max(days, 0)} ngày`, color: 'orange' };
  }
  return null;
}

/** Tổng quan Kênh người đăng: lời chào, số liệu, bản đồ tin đăng, việc cần làm, đồ đang bán, tin nổi bật. */
export default function SellerOverviewPage() {
  const { user, listings } = useMyListings();
  const [products, setProducts] = useState<ProductItem[]>();
  // Mốc thời gian cố định cho cả lần render (tính ngày hết hạn, lời chào)
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!user) return;
    getMyProducts()
      .then(setProducts)
      .catch(() => setProducts([]));
  }, [user]);

  const stats = useMemo(() => {
    const items = listings ?? [];
    const views = items.reduce((sum, item) => sum + (item.viewCount ?? 0), 0);
    return {
      total: items.length,
      active: items.filter((item) => item.status === ListingStatus.ACTIVE).length,
      views,
      saves: items.reduce((sum, item) => sum + (item.favoriteCount ?? 0), 0),
      averageViews: items.length ? Math.round(views / items.length) : 0,
    };
  }, [listings]);
  const productStats = useMemo(() => {
    const count = (status: ProductStatus) =>
      (products ?? []).filter((item) => item.status === status).length;
    return {
      active: count(ProductStatus.ACTIVE),
      pending: count(ProductStatus.PENDING),
      sold: count(ProductStatus.SOLD),
    };
  }, [products]);
  const topListings = useMemo(
    () =>
      [...(listings ?? [])]
        .sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0))
        .slice(0, TOP_COUNT),
    [listings],
  );
  const mapMarkers = useMemo<MapMarker[]>(
    () =>
      (listings ?? []).flatMap((listing) => {
        const point = listing.address?.geo;
        if (!point) return [];
        return [
          {
            id: listing.id,
            point,
            title: listing.title,
            subtitle: formatListingPrice(listing.price, listing.transaction),
            // Tin chưa hiển thị (ẩn, chờ duyệt, hết hạn) không có trang công khai
            href: listing.status === ListingStatus.ACTIVE ? `/phong-tro/${listing.id}` : undefined,
          },
        ];
      }),
    [listings],
  );
  const attention = useMemo(
    () =>
      (listings ?? [])
        .flatMap((listing) => {
          const note = attentionOf(listing, now);
          return note ? [{ listing, note }] : [];
        })
        .slice(0, ATTENTION_COUNT),
    [listings, now],
  );

  if (!user || !listings) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  const maxViews = topListings[0]?.viewCount || 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Lời chào */}
      <section className="relative overflow-hidden rounded-xl bg-linear-to-r from-brand to-brand-dark px-6 py-7">
        <div className="pointer-events-none absolute -top-20 -right-12 size-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-48 -bottom-24 size-44 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-sm text-white/80">{greeting(new Date(now).getHours())},</p>
            <h1 className="mt-1 text-2xl font-bold text-white!">{user.name}</h1>
            <p className="mt-2 text-white/90">
              Bạn có <b>{formatNumber(stats.active)}</b> tin đang hiển thị
              {products && (
                <>
                  {' '}
                  và <b>{formatNumber(productStats.active)}</b> món đồ đang bán
                </>
              )}
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dang-tin">
              <Button size="large" icon={<Plus size={18} />} className="border-0! text-brand!">
                Đăng tin cho thuê
              </Button>
            </Link>
            <Link href="/cho-oi/dang-ban">
              <Button
                size="large"
                ghost
                icon={<PackagePlus size={18} />}
                className="border-white/70! text-white!"
              >
                Đăng bán đồ
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Số liệu */}
      <Row gutter={[16, 16]}>
        <Col xs={12} xl={6}>
          <StatCard
            icon={<Megaphone size={20} />}
            label="Tin đang hiển thị"
            value={`${formatNumber(stats.active)}/${formatNumber(stats.total)}`}
            hint={`${formatNumber(stats.total - stats.active)} tin đang ẩn hoặc chờ`}
          />
        </Col>
        <Col xs={12} xl={6}>
          <StatCard
            icon={<TrendingUp size={20} />}
            label="Lượt xem"
            value={formatNumber(stats.views)}
            hint={`Trung bình ${formatNumber(stats.averageViews)} lượt/tin`}
          />
        </Col>
        <Col xs={12} xl={6}>
          <StatCard
            icon={<Heart size={20} />}
            label="Lượt lưu tin"
            value={formatNumber(stats.saves)}
            hint="Người thuê bấm ♡ lưu tin của bạn"
          />
        </Col>
        <Col xs={12} xl={6}>
          <StatCard
            icon={<ShoppingBag size={20} />}
            label="Đồ đang bán"
            value={products ? formatNumber(productStats.active) : '…'}
            hint={`${formatNumber(productStats.sold)} món đã bán trên Chợ ơi`}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Bản đồ các tin đã đăng */}
        <Col xs={24} xl={16}>
          <section className="h-full rounded-xl bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-primary">Bản đồ tin đăng</h2>
                <p className="text-sm text-subtle">
                  {formatNumber(mapMarkers.length)}/{formatNumber(stats.total)} tin có vị trí trên
                  bản đồ — bấm ghim để xem tin
                </p>
              </div>
              <Link href="/dang-tin" className="flex items-center gap-1 text-sm font-semibold">
                <MapPin size={16} /> Ghim vị trí khi đăng tin
              </Link>
            </div>
            {mapMarkers.length === 0 ? (
              <EmptyState
                variant={EmptyVariant.LISTING}
                description="Chưa có tin nào được ghim vị trí. Thêm vị trí khi đăng hoặc sửa tin."
              />
            ) : (
              <VietnamMap
                markers={mapMarkers}
                className="h-140 w-full overflow-hidden rounded-lg"
              />
            )}
          </section>
        </Col>

        <Col xs={24} xl={8}>
          {/* Tin nổi bật */}
          <section className="h-full rounded-xl bg-surface p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-primary">Tin được xem nhiều nhất</h2>
              <Link
                href={`${SELLER_BASE}/tin-dang`}
                className="flex items-center gap-1 text-sm font-semibold"
              >
                Quản lý tin <ArrowRight size={16} />
              </Link>
            </div>
            {topListings.length === 0 ? (
              <EmptyState variant={EmptyVariant.LISTING} description="Bạn chưa có tin đăng nào">
                <Link href="/dang-tin">
                  <Button type="primary">Đăng tin đầu tiên</Button>
                </Link>
              </EmptyState>
            ) : (
              <ol className="flex flex-col gap-1">
                {topListings.map((listing, index) => (
                  <li key={listing.id}>
                    <Link
                      href={`/phong-tro/${listing.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-soft"
                    >
                      <span
                        className={
                          index < 3
                            ? 'flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white'
                            : 'flex size-7 shrink-0 items-center justify-center rounded-full bg-soft text-sm font-bold text-body'
                        }
                      >
                        {index + 1}
                      </span>
                      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-soft">
                        <Image
                          src={listing.images[0] || NO_IMAGE}
                          alt={listing.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 font-semibold text-ink">{listing.title}</p>
                        <p className="text-sm font-semibold text-price">
                          {formatListingPrice(listing.price, listing.transaction)}
                        </p>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${((listing.viewCount ?? 0) / maxViews) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1 text-sm text-body">
                        <span className="flex items-center gap-1">
                          <Eye size={15} /> {formatNumber(listing.viewCount ?? 0)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart size={15} /> {formatNumber(listing.favoriteCount ?? 0)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          {/* Việc cần làm */}
          <section className="h-full rounded-xl bg-surface p-5">
            <h2 className="text-primary mb-3">Cần chú ý</h2>
            {attention.length === 0 ? (
              <div className="flex items-center gap-3 rounded-lg bg-brand-soft p-3">
                <CircleCheck size={22} className="shrink-0 text-brand" />
                <p className="text-sm text-ink">
                  Mọi tin đều ổn — không có tin hết hạn hay chờ duyệt.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {attention.map(({ listing, note }) => (
                  <li key={listing.id} className="flex items-center gap-2">
                    <Tag color={note.color} className="m-0! shrink-0">
                      {note.label}
                    </Tag>
                    <Link
                      href={`${SELLER_BASE}/tin-dang`}
                      className="line-clamp-1 min-w-0 flex-1 text-sm text-ink!"
                    >
                      {listing.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </Col>
        <Col xs={24} lg={12}>
          {/* Chợ ơi */}
          <section className="h-full rounded-xl bg-surface p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-primary">Đồ bán trên Chợ ơi</h2>
              <Link
                href={`${SELLER_BASE}/do-ban`}
                className="flex items-center gap-1 text-sm font-semibold"
              >
                Quản lý <ArrowRight size={16} />
              </Link>
            </div>
            {!products ? (
              <Skeleton active paragraph={{ rows: 1 }} title={false} />
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Đang bán', value: productStats.active },
                  { label: 'Chờ duyệt', value: productStats.pending },
                  { label: 'Đã bán', value: productStats.sold },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg bg-soft px-2 py-3">
                    <p className="text-xl font-bold text-ink">{formatNumber(value)}</p>
                    <p className="text-xs text-body">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </Col>
      </Row>
    </div>
  );
}
