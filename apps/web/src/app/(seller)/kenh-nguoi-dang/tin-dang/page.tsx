'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Flex,
  Input,
  Popconfirm,
  Segmented,
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from 'antd';
import { Eye, EyeOff, Heart, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react';
import { LISTING_STATUS_LABELS, ListingStatus, type Listing } from '@tro-oi/shared';

import { EmptyState, EmptyVariant } from '@/components/common';
import { NO_IMAGE } from '@/constants';
import { formatListingPrice, formatNumber, formatRelativeTime } from '@/utils/helpers';

import { LISTING_TTL_DAYS, STATUS_TAG_COLORS } from '../const';
import { useMyListings } from '../useMyListings';

type StatusFilter = 'all' | 'active' | 'pending' | 'hidden';

const PAGE_SIZE = 10;

const matchesFilter = (listing: Listing, filter: StatusFilter) => {
  if (filter === 'all') return true;
  if (filter === 'active') return listing.status === ListingStatus.ACTIVE;
  if (filter === 'pending') return listing.status === ListingStatus.PENDING;
  return listing.status !== ListingStatus.ACTIVE && listing.status !== ListingStatus.PENDING;
};

/** Quản lý tin: lọc theo trạng thái, tìm theo tiêu đề, sửa / ẩn-hiện / xoá. */
export default function SellerListingsPage() {
  const { listings, toggleStatus, remove } = useMyListings();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [keyword, setKeyword] = useState('');

  const counts = useMemo(() => {
    const items = listings ?? [];
    return {
      all: items.length,
      active: items.filter((item) => matchesFilter(item, 'active')).length,
      pending: items.filter((item) => matchesFilter(item, 'pending')).length,
      hidden: items.filter((item) => matchesFilter(item, 'hidden')).length,
    };
  }, [listings]);
  const visibleListings = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    return (listings ?? []).filter(
      (item) => matchesFilter(item, filter) && item.title.toLowerCase().includes(search),
    );
  }, [filter, keyword, listings]);
  const filterOptions = useMemo(
    () => [
      { value: 'all', label: `Tất cả (${counts.all})` },
      { value: 'active', label: `Đang hiển thị (${counts.active})` },
      { value: 'pending', label: `Chờ duyệt (${counts.pending})` },
      { value: 'hidden', label: `Đã ẩn (${counts.hidden})` },
    ],
    [counts],
  );
  const columns = useMemo<TableColumnsType<Listing>>(
    () => [
      {
        title: 'Tin đăng',
        key: 'listing',
        // Rộng cố định: không có width thì cột co lại, nội dung tràn đè lên cột Trạng thái
        width: 300,
        render: (_, listing) => (
          <Flex gap={12} align="center">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-md">
              <Image
                src={listing.images[0] || NO_IMAGE}
                alt={listing.title}
                fill
                sizes="80px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              {listing.status === ListingStatus.ACTIVE ? (
                <Link href={`/phong-tro/${listing.id}`} className="line-clamp-2 font-semibold">
                  {listing.title}
                </Link>
              ) : (
                <p className="line-clamp-2 font-semibold text-ink">{listing.title}</p>
              )}
              <p className="text-sm text-price font-semibold">
                {formatListingPrice(listing.price, listing.transaction)}
              </p>
              <p className="text-xs text-subtle line-clamp-1">{listing.address?.fullAddress}</p>
            </div>
          </Flex>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        width: 120,
        render: (status: ListingStatus) => (
          <Tag color={STATUS_TAG_COLORS[status]}>{LISTING_STATUS_LABELS[status]}</Tag>
        ),
      },
      {
        title: 'Hiệu quả',
        key: 'performance',
        width: 140,
        sorter: (a, b) => (a.viewCount ?? 0) - (b.viewCount ?? 0),
        render: (_, listing) => (
          <div className="flex flex-col gap-1 text-sm text-body">
            <span className="flex items-center gap-1.5">
              <Eye size={15} /> {formatNumber(listing.viewCount ?? 0)} lượt xem
            </span>
            <span className="flex items-center gap-1.5">
              <Heart size={15} /> {formatNumber(listing.favoriteCount ?? 0)} lượt lưu
            </span>
          </div>
        ),
      },
      {
        title: 'Thời hạn',
        key: 'dates',
        width: 150,
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
        render: (_, listing) => (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-body">Đăng {formatRelativeTime(listing.createdAt)}</span>
            <span className="text-subtle">
              {listing.status === ListingStatus.ACTIVE && listing.expiresAt
                ? `Hết hạn ${new Date(listing.expiresAt).toLocaleDateString('vi-VN')}`
                : '—'}
            </span>
          </div>
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 140,
        fixed: 'right',
        render: (_, listing) => {
          const isActive = listing.status === ListingStatus.ACTIVE;
          const isExpired = listing.status === ListingStatus.EXPIRED;
          const toggleLabel = isActive
            ? 'Ẩn tin'
            : isExpired
              ? `Gia hạn ${LISTING_TTL_DAYS} ngày`
              : 'Hiện lại';
          return (
            <Flex gap={4}>
              <Tooltip title="Sửa">
                <Link href={`/dang-tin?id=${listing.id}`}>
                  <Button size="small" aria-label="Sửa tin" icon={<Pencil size={14} />} />
                </Link>
              </Tooltip>
              {/* Tin chờ duyệt: chỉ admin đổi được trạng thái */}
              {listing.status !== ListingStatus.PENDING && (
                <Tooltip title={toggleLabel}>
                  <Button
                    size="small"
                    aria-label={toggleLabel}
                    icon={
                      isActive ? (
                        <EyeOff size={14} />
                      ) : isExpired ? (
                        <RotateCw size={14} />
                      ) : (
                        <Eye size={14} />
                      )
                    }
                    onClick={() => toggleStatus(listing)}
                  />
                </Tooltip>
              )}
              <Popconfirm
                title="Xoá tin này?"
                description="Tin đã xoá không thể khôi phục."
                okText="Xoá"
                cancelText="Huỷ"
                okButtonProps={{ danger: true }}
                onConfirm={() => remove(listing)}
              >
                <Button size="small" danger aria-label="Xoá tin" icon={<Trash2 size={14} />} />
              </Popconfirm>
            </Flex>
          );
        },
      },
    ],
    [remove, toggleStatus],
  );

  return (
    <Card variant="borderless">
      <Flex justify="space-between" align="center" wrap gap={12} className="mb-4!">
        <h1 className="text-primary text-xl!">Quản lý tin đăng</h1>
        <Link href="/dang-tin">
          <Button type="primary" icon={<Plus size={16} />}>
            Đăng tin mới
          </Button>
        </Link>
      </Flex>

      <Flex justify="space-between" align="center" wrap gap={12} className="mb-4!">
        <Segmented
          options={filterOptions}
          value={filter}
          onChange={(value) => setFilter(value as StatusFilter)}
        />
        <Input.Search
          allowClear
          placeholder="Tìm theo tiêu đề"
          className="max-w-72"
          onChange={(event) => setKeyword(event.target.value)}
        />
      </Flex>

      <Table<Listing>
        rowKey="id"
        columns={columns}
        dataSource={visibleListings}
        loading={!listings}
        pagination={{ pageSize: PAGE_SIZE, hideOnSinglePage: true }}
        scroll={{ x: 870 }}
        locale={{
          emptyText: (
            <EmptyState
              size="small"
              variant={EmptyVariant.LISTING}
              description="Không có tin đăng"
            />
          ),
        }}
      />
    </Card>
  );
}
