'use client';

import { useEffect, useMemo, useState } from 'react';
import { App, Segmented, Select, Spin } from 'antd';
import { House, MapPinOff, ShoppingBag } from 'lucide-react';
import {
  LISTING_STATUS_LABELS,
  ListingStatus,
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
  PROPERTY_CATEGORY_LABELS,
  ProductStatus,
  type ListingMapPoint,
  type ProductMapPoint,
} from '@tro-oi/shared';

import { getAdminListingMap, getAdminProductMap } from '@/api/admin';
import { PageCard } from '@/components/admin';
import { VietnamMap, type MapMarker } from '@/components/common';
import { PROVINCES } from '@/constants';
import { formatListingPrice, formatNumber, formatVietnameseCurrency } from '@/utils/helpers';

type Source = 'listing' | 'product';

/** Bộ lọc chung 2 nguồn; status / category là giá trị enum của nguồn đang chọn. */
interface MapQuery {
  status?: string;
  category?: string;
  city?: string;
}

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

/** Mọi khác biệt giữa bản đồ tin Trọ ơi và món Chợ ơi gom ở đây. */
const SOURCES = {
  listing: {
    label: 'Trọ ơi',
    unit: 'tin',
    icon: <House size={16} />,
    statusLabels: LISTING_STATUS_LABELS as Record<string, string>,
    statusFilters: [
      ListingStatus.ACTIVE,
      ListingStatus.PENDING,
      ListingStatus.CLOSED,
      ListingStatus.EXPIRED,
    ],
    categoryPlaceholder: 'Loại hình',
    categoryOptions: toOptions(PROPERTY_CATEGORY_LABELS),
  },
  product: {
    label: 'Chợ ơi',
    unit: 'món',
    icon: <ShoppingBag size={16} />,
    statusLabels: PRODUCT_STATUS_LABELS as Record<string, string>,
    statusFilters: [
      ProductStatus.ACTIVE,
      ProductStatus.PENDING,
      ProductStatus.SOLD,
      ProductStatus.CLOSED,
    ],
    categoryPlaceholder: 'Danh mục',
    categoryOptions: toOptions(PRODUCT_CATEGORY_LABELS),
  },
} as const;

const SOURCE_OPTIONS = (Object.keys(SOURCES) as Source[]).map((value) => ({
  value,
  label: (
    <span className="inline-flex items-center gap-1.5">
      {SOURCES[value].icon}
      {SOURCES[value].label}
    </span>
  ),
}));
const CITY_OPTIONS = PROVINCES.map((city) => ({ value: city, label: city }));

const placeOf = (point: { ward?: string; city?: string }) =>
  [point.ward, point.city].filter(Boolean).join(', ');

/** Ghim tin Trọ ơi: giá · trạng thái · địa chỉ; chỉ tin đang hiển thị có link trang công khai. */
const listingMarker = (point: ListingMapPoint): MapMarker => ({
  id: point.id,
  point: point.geo,
  title: point.title,
  subtitle: [
    formatListingPrice(point.price, point.transaction),
    LISTING_STATUS_LABELS[point.status],
    placeOf(point),
  ]
    .filter(Boolean)
    .join(' · '),
  href: point.status === ListingStatus.ACTIVE ? `/phong-tro/${point.id}` : undefined,
});

/** Ghim món Chợ ơi: giá · trạng thái · địa chỉ; chỉ món đang bán có link trang công khai. */
const productMarker = (point: ProductMapPoint): MapMarker => ({
  id: point.id,
  point: point.geo,
  title: point.title,
  subtitle: [
    point.price === 0 ? 'Cho tặng' : formatVietnameseCurrency(point.price),
    PRODUCT_STATUS_LABELS[point.status],
    placeOf(point),
  ]
    .filter(Boolean)
    .join(' · '),
  href: point.status === ProductStatus.ACTIVE ? `/cho-oi/${point.id}` : undefined,
});

/** Bản đồ toàn bộ tin Trọ ơi / món Chợ ơi có vị trí: lọc trạng thái / loại / tỉnh, ghim gom cụm. */
export default function AdminMapPage() {
  const { message } = App.useApp();
  const [source, setSource] = useState<Source>('listing');
  const [query, setQuery] = useState<MapQuery>({});
  const [result, setResult] = useState<{
    source: Source;
    points: (ListingMapPoint | ProductMapPoint)[];
  }>();
  const config = SOURCES[source];
  // Đổi nguồn → coi như đang tải tới khi API trả điểm của nguồn mới
  const points = result?.source === source ? result.points : undefined;

  useEffect(() => {
    let isCurrent = true;
    const request =
      source === 'listing'
        ? getAdminListingMap(query as Parameters<typeof getAdminListingMap>[0])
        : getAdminProductMap(query as Parameters<typeof getAdminProductMap>[0]);
    request
      .then((data) => isCurrent && setResult({ source, points: data }))
      .catch((error: Error) => message.error(error.message));
    return () => {
      isCurrent = false;
    };
  }, [message, query, source]);

  const markers = useMemo(
    () =>
      (points ?? []).map((point) =>
        source === 'listing'
          ? listingMarker(point as ListingMapPoint)
          : productMarker(point as ProductMapPoint),
      ),
    [points, source],
  );
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { status } of points ?? []) counts.set(status, (counts.get(status) ?? 0) + 1);
    return [...counts];
  }, [points]);

  const updateQuery = (patch: MapQuery) => setQuery((current) => ({ ...current, ...patch }));
  const changeSource = (next: Source) => {
    setSource(next);
    setQuery({}); // trạng thái / loại của 2 nguồn khác nhau
  };

  return (
    <PageCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-primary text-xl!">Bản đồ tin</h1>
            <Segmented
              options={SOURCE_OPTIONS}
              value={source}
              onChange={(value) => changeSource(value as Source)}
            />
          </div>
          <p className="mt-1 text-sm text-subtle">
            {points ? (
              <>
                {formatNumber(points.length)} {config.unit} có vị trí
                {statusCounts.length > 0 &&
                  ` — ${statusCounts
                    .map(
                      ([status, count]) => `${config.statusLabels[status]} ${formatNumber(count)}`,
                    )
                    .join(' · ')}`}
              </>
            ) : (
              'Đang tải…'
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Màn hẹp: cuộn ngang thay vì bị cắt mất lựa chọn cuối */}
          <div className="no-scrollbar max-w-full overflow-x-auto">
            <Segmented
              options={[
                { value: '', label: 'Tất cả' },
                ...config.statusFilters.map((status) => ({
                  value: status,
                  label: config.statusLabels[status],
                })),
              ]}
              value={query.status ?? ''}
              onChange={(value) => updateQuery({ status: String(value) || undefined })}
            />
          </div>
          <Select
            allowClear
            placeholder={config.categoryPlaceholder}
            className="min-w-36"
            options={config.categoryOptions}
            value={query.category}
            onChange={(category?: string) => updateQuery({ category })}
          />
          <Select
            allowClear
            showSearch
            placeholder="Tỉnh / thành"
            className="min-w-44"
            options={CITY_OPTIONS}
            value={query.city}
            onChange={(city?: string) => updateQuery({ city })}
          />
        </div>
      </div>

      <div className="relative min-h-100 flex-1 overflow-hidden rounded-lg">
        <VietnamMap markers={markers} className="h-full w-full" />
        {!points && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/60">
            <Spin size="large" />
          </div>
        )}
        {points?.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-4 flex justify-center">
            <p className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-body shadow-md">
              <MapPinOff size={16} /> Không có {config.unit} nào có vị trí với bộ lọc này
            </p>
          </div>
        )}
      </div>
    </PageCard>
  );
}
