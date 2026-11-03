'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  App,
  Button,
  Card,
  Flex,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from 'antd';
import { Check, Eye, EyeOff, Trash2, X } from 'lucide-react';
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
import { NO_IMAGE } from '@/constants';
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
];
const CATEGORY_OPTIONS = (
  Object.entries(PROPERTY_CATEGORY_LABELS) as [PropertyCategory, string][]
).map(([value, label]) => ({ value, label }));

/** Quản lý toàn bộ tin Trọ ơi: duyệt, ẩn/hiện, xoá. */
export default function AdminListingsPage() {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const initialQuery = useMemo<AdminListingQuery>(
    () => ({
      status: (searchParams.get('status') as ListingStatus) || undefined,
      authorId: searchParams.get('authorId') || undefined,
    }),
    [searchParams],
  );
  const { items, isLoading, query, updateQuery, reload, pagination } = useAdminTable(
    searchAdminListings,
    initialQuery,
  );

  const runAction = useCallback(
    async (action: () => Promise<unknown>, successText: string) => {
      try {
        await action();
        message.success(successText);
        await reload();
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [message, reload],
  );

  const columns = useMemo<TableColumnsType<Listing>>(
    () => [
      {
        title: 'Tin đăng',
        key: 'listing',
        render: (_, listing) => (
          <Flex gap={12} align="center" className="min-w-72">
            <div className="relative h-14 w-18 shrink-0 overflow-hidden rounded-md bg-soft">
              <Image
                src={listing.images[0] || NO_IMAGE}
                alt=""
                fill
                sizes="72px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 font-semibold text-ink">{listing.title}</p>
              <p className="text-xs text-subtle">
                {PROPERTY_CATEGORY_LABELS[listing.category]} · {listing.address?.city}
              </p>
            </div>
          </Flex>
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
        width: 150,
        fixed: 'right',
        render: (_, listing) => (
          <Flex gap={4}>
            {listing.status === ListingStatus.PENDING && (
              <>
                <Tooltip title="Duyệt">
                  <Button
                    size="small"
                    type="primary"
                    aria-label="Duyệt"
                    icon={<Check size={14} />}
                    onClick={() =>
                      runAction(
                        () => updateListing(listing.id, { status: ListingStatus.ACTIVE }),
                        'Đã duyệt tin',
                      )
                    }
                  />
                </Tooltip>
                <Tooltip title="Từ chối (ẩn)">
                  <Button
                    size="small"
                    aria-label="Từ chối"
                    icon={<X size={14} />}
                    onClick={() =>
                      runAction(
                        () => updateListing(listing.id, { status: ListingStatus.CLOSED }),
                        'Đã từ chối tin',
                      )
                    }
                  />
                </Tooltip>
              </>
            )}
            {listing.status === ListingStatus.ACTIVE && (
              <>
                <Tooltip title="Xem trên web">
                  <Link href={`/phong-tro/${listing.id}`} target="_blank">
                    <Button size="small" aria-label="Xem" icon={<Eye size={14} />} />
                  </Link>
                </Tooltip>
                <Tooltip title="Ẩn tin">
                  <Button
                    size="small"
                    aria-label="Ẩn tin"
                    icon={<EyeOff size={14} />}
                    onClick={() =>
                      runAction(
                        () => updateListing(listing.id, { status: ListingStatus.CLOSED }),
                        'Đã ẩn tin',
                      )
                    }
                  />
                </Tooltip>
              </>
            )}
            {listing.status === ListingStatus.CLOSED && (
              <Tooltip title="Hiển thị lại">
                <Button
                  size="small"
                  aria-label="Hiển thị lại"
                  icon={<Eye size={14} />}
                  onClick={() =>
                    runAction(
                      () => updateListing(listing.id, { status: ListingStatus.ACTIVE }),
                      'Đã hiển thị lại',
                    )
                  }
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Xoá vĩnh viễn tin này?"
              okText="Xoá"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              onConfirm={() => runAction(() => deleteListing(listing.id), 'Đã xoá tin')}
            >
              <Button size="small" danger aria-label="Xoá" icon={<Trash2 size={14} />} />
            </Popconfirm>
          </Flex>
        ),
      },
    ],
    [runAction],
  );

  return (
    <Card variant="borderless">
      <h1 className="text-primary mb-4 text-xl!">Tin Trọ ơi</h1>
      <Flex wrap gap={8} align="center" className="mb-4!">
        <Segmented
          options={STATUS_FILTERS}
          value={query.status ?? ''}
          onChange={(value) => updateQuery({ status: (value as ListingStatus) || undefined })}
        />
        <Input.Search
          allowClear
          placeholder="Tìm tiêu đề, địa chỉ"
          className="max-w-72"
          onSearch={(value) => updateQuery({ keyword: value.trim() || undefined })}
        />
        <Select
          allowClear
          placeholder="Loại hình"
          className="min-w-40"
          options={CATEGORY_OPTIONS}
          value={query.category}
          onChange={(value) => updateQuery({ category: value })}
        />
        {query.authorId && (
          <Tag closable onClose={() => updateQuery({ authorId: undefined })}>
            Đang lọc theo 1 người đăng
          </Tag>
        )}
      </Flex>
      <Table<Listing>
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        pagination={pagination}
        scroll={{ x: 1100 }}
      />
    </Card>
  );
}
