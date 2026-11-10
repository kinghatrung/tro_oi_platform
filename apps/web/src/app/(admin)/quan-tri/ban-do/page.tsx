'use client';

import { useEffect, useMemo, useState } from 'react';
import { App, Segmented, Select, Spin } from 'antd';
import { MapPinOff } from 'lucide-react';
import {
  LISTING_STATUS_LABELS,
  ListingStatus,
  PROPERTY_CATEGORY_LABELS,
  type AdminListingQuery,
  type ListingMapPoint,
  type PropertyCategory,
} from '@tro-oi/shared';

import { getAdminListingMap } from '@/api/admin';
import { PageCard } from '@/components/admin';
import { VietnamMap, type MapMarker } from '@/components/common';
import { PROVINCES } from '@/constants';
import { formatListingPrice, formatNumber } from '@/utils/helpers';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: ListingStatus.ACTIVE, label: 'Đang hiển thị' },
  { value: ListingStatus.PENDING, label: 'Chờ duyệt' },
  { value: ListingStatus.CLOSED, label: 'Đã ẩn' },
  { value: ListingStatus.EXPIRED, label: 'Hết hạn' },
];
const CATEGORY_OPTIONS = (
  Object.entries(PROPERTY_CATEGORY_LABELS) as [PropertyCategory, string][]
).map(([value, label]) => ({ value, label }));
const CITY_OPTIONS = PROVINCES.map((city) => ({ value: city, label: city }));

/** Ghim của 1 tin: popup ghi giá · trạng thái · địa chỉ; chỉ tin đang hiển thị có link trang công khai. */
const toMarker = (point: ListingMapPoint): MapMarker => ({
  id: point.id,
  point: point.geo,
  title: point.title,
  subtitle: [
    formatListingPrice(point.price, point.transaction),
    LISTING_STATUS_LABELS[point.status],
    [point.ward, point.city].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join(' · '),
  href: point.status === ListingStatus.ACTIVE ? `/phong-tro/${point.id}` : undefined,
});

/** Bản đồ toàn bộ tin Trọ ơi có vị trí: lọc trạng thái / loại hình / tỉnh, ghim gom cụm. */
export default function AdminListingMapPage() {
  const { message } = App.useApp();
  const [query, setQuery] = useState<AdminListingQuery>({});
  const [points, setPoints] = useState<ListingMapPoint[]>();

  useEffect(() => {
    let isCurrent = true;
    getAdminListingMap(query)
      .then((data) => isCurrent && setPoints(data))
      .catch((error: Error) => message.error(error.message));
    return () => {
      isCurrent = false;
    };
  }, [message, query]);

  const markers = useMemo(() => (points ?? []).map(toMarker), [points]);
  const statusCounts = useMemo(() => {
    const counts = new Map<ListingStatus, number>();
    for (const { status } of points ?? []) counts.set(status, (counts.get(status) ?? 0) + 1);
    return [...counts];
  }, [points]);

  const updateQuery = (patch: AdminListingQuery) =>
    setQuery((current) => ({ ...current, ...patch }));

  return (
    <PageCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-primary text-xl!">Bản đồ tin Trọ ơi</h1>
          <p className="text-sm text-subtle">
            {points ? (
              <>
                {formatNumber(points.length)} tin có vị trí
                {statusCounts.length > 0 &&
                  ` — ${statusCounts
                    .map(
                      ([status, count]) =>
                        `${LISTING_STATUS_LABELS[status]} ${formatNumber(count)}`,
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
              options={STATUS_FILTERS}
              value={query.status ?? ''}
              onChange={(value) => updateQuery({ status: (value as ListingStatus) || undefined })}
            />
          </div>
          <Select
            allowClear
            placeholder="Loại hình"
            className="min-w-36"
            options={CATEGORY_OPTIONS}
            value={query.category}
            onChange={(category?: PropertyCategory) => updateQuery({ category })}
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
              <MapPinOff size={16} /> Không có tin nào có vị trí với bộ lọc này
            </p>
          </div>
        )}
      </div>
    </PageCard>
  );
}
