'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Form, Segmented, Select, Tag, type TableColumnsType } from 'antd';
import {
  LISTING_STATUS_LABELS,
  ListingStatus,
  PROPERTY_CATEGORY_LABELS,
  PropertyCategory,
  type AdminListingQuery,
  type Listing,
} from '@tro-oi/shared';

import { searchAdminListings } from '@/api/admin';
import { deleteListing, updateListing } from '@/api/listings';
import { DataTable, EntityCell, FilterBar, ModerationActions, PageCard } from '@/components/admin';
import { formatListingPrice, formatRelativeTime } from '@/utils/helpers';

import { useAdminTable } from '../useAdminTable';

const STATUS_COLORS: Record<ListingStatus, string> = {
  [ListingStatus.PENDING]: 'processing',
  [ListingStatus.ACTIVE]: 'success',
  [ListingStatus.CLOSED]: 'default',
  [ListingStatus.EXPIRED]: 'warning',
  [ListingStatus.DRAFT]: 'default',
};
const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: ListingStatus.PENDING, label: 'Chờ duyệt' },
  { value: ListingStatus.ACTIVE, label: 'Đang hiển thị' },
  { value: ListingStatus.CLOSED, label: 'Đã ẩn' },
  { value: ListingStatus.EXPIRED, label: 'Hết hạn' },
];
const CATEGORY_OPTIONS = (
  Object.entries(PROPERTY_CATEGORY_LABELS) as [PropertyCategory, string][]
).map(([value, label]) => ({ value, label }));

type AdvancedFilters = Pick<AdminListingQuery, 'category'>;
const DEFAULT_FILTERS: AdvancedFilters = { category: undefined };

/** Quản lý toàn bộ tin Trọ ơi: duyệt, ẩn/hiện, xoá. */
export default function AdminListingsPage() {
  const searchParams = useSearchParams();
  const initialQuery = useMemo<AdminListingQuery>(
    () => ({
      status: (searchParams.get('status') as ListingStatus) || undefined,
      authorId: searchParams.get('authorId') || undefined,
    }),
    [searchParams],
  );
  const { items, isLoading, query, updateQuery, reload, runAction, pagination } = useAdminTable(
    searchAdminListings,
    initialQuery,
    'tin',
  );

  const columns = useMemo<TableColumnsType<Listing>>(
    () => [
      {
        title: 'Tin đăng',
        key: 'listing',
        render: (_, listing) => (
          <EntityCell
            image={listing.images[0]}
            title={listing.title}
            subtitle={`${PROPERTY_CATEGORY_LABELS[listing.category]} · ${listing.address?.city ?? ''}`}
          />
        ),
      },
      {
        title: 'Người đăng',
        key: 'author',
        width: 160,
        render: (_, listing) =>
          listing.author && (
            <Link href={`/nguoi-dung/${listing.author.id}`} target="_blank">
              {listing.author.name}
            </Link>
          ),
      },
      {
        title: 'Giá',
        key: 'price',
        width: 150,
        render: (_, listing) => (
          <span className="font-semibold text-price">
            {formatListingPrice(listing.price, listing.transaction)}
          </span>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        width: 130,
        render: (status: ListingStatus) => (
          <Tag color={STATUS_COLORS[status]}>{LISTING_STATUS_LABELS[status]}</Tag>
        ),
      },
      { title: 'Lượt xem', dataIndex: 'viewCount', width: 100, align: 'right' },
      {
        title: 'Ngày đăng',
        dataIndex: 'createdAt',
        width: 120,
        render: (value: string) => formatRelativeTime(value),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, listing) => (
          <ModerationActions
            status={listing.status}
            viewHref={`/phong-tro/${listing.id}`}
            onSetVisible={(visible, text, moderationNote) =>
              runAction(
                () =>
                  updateListing(listing.id, {
                    status: visible ? ListingStatus.ACTIVE : ListingStatus.CLOSED,
                    moderationNote,
                  }),
                text,
              )
            }
            onDelete={() => runAction(() => deleteListing(listing.id), 'Đã xoá tin')}
          />
        ),
      },
    ],
    [runAction],
  );

  return (
    <PageCard>
      <FilterBar<AdvancedFilters>
        keyword={{ placeholder: 'Tìm tiêu đề, địa chỉ' }}
        onSearch={(keyword) => updateQuery({ keyword })}
        onReload={reload}
        quickFilters={
          <>
            <Segmented
              options={STATUS_FILTERS}
              value={query.status ?? ''}
              onChange={(value) => updateQuery({ status: (value as ListingStatus) || undefined })}
            />
            {query.authorId && (
              <Tag closable onClose={() => updateQuery({ authorId: undefined })}>
                Đang lọc theo 1 người đăng
              </Tag>
            )}
          </>
        }
        advanced={{
          values: { category: query.category },
          defaultValues: DEFAULT_FILTERS,
          onApply: updateQuery,
          fields: (
            <Form.Item name="category" label="Loại hình">
              <Select allowClear placeholder="Tất cả" options={CATEGORY_OPTIONS} />
            </Form.Item>
          ),
        }}
      />
      <DataTable<Listing>
        mobileKeys={['price', 'status', 'actions']}
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        pagination={pagination}
      />
    </PageCard>
  );
}
