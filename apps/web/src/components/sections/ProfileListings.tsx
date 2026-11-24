'use client';

import { useState, type ReactNode } from 'react';
import { Button, Flex, Space } from 'antd';
import { ListingStatus, type Listing } from '@tro-oi/shared';

import { CardItem, EmptyState, EmptyVariant, PaginationControl } from '@/components/common';

interface ProfileListingsProps {
  listings: Listing[];
  /** Hồ sơ công khai: chỉ hiện tin đang hiển thị, không có tab. */
  readOnly?: boolean;
  onPostListing?: () => void;
  /** Nội dung cạnh tiêu đề, vd nút "Quản lý tin". */
  extra?: ReactNode;
  /** Hồ sơ công khai phân trang phía server (`?page=` trên URL). */
  pagination?: { total: number; page: number; pageSize: number };
}

type ListingTab = 'active' | 'hidden';

/** Danh sách tin của một người dùng, chia tab Đang hiển thị / Đã ẩn. */
export function ProfileListings({
  listings,
  readOnly = false,
  onPostListing,
  extra,
  pagination,
}: ProfileListingsProps) {
  const [tab, setTab] = useState<ListingTab>('active');
  const activeListings = listings.filter((item) => item.status === ListingStatus.ACTIVE);
  const hiddenListings = listings.filter((item) => item.status !== ListingStatus.ACTIVE);
  const visibleListings = readOnly || tab === 'active' ? activeListings : hiddenListings;

  return (
    <div className="rounded-lg bg-surface py-4 px-5">
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center">
          <p className="text-primary text-xl">
            Tất cả tin đăng ({pagination?.total ?? listings.length})
          </p>
          {extra}
        </Flex>

        {!readOnly && (
          <Space>
            <Button
              type={tab === 'active' ? 'primary' : 'default'}
              className={`h-8! ${tab === 'hidden' ? 'btn-gray text-ink!' : ''}`}
              onClick={() => setTab('active')}
            >
              Đang hiển thị ({activeListings.length})
            </Button>

            <Button
              type={tab === 'hidden' ? 'primary' : 'default'}
              className={`h-8! ${tab === 'active' ? 'btn-gray text-ink!' : ''}`}
              onClick={() => setTab('hidden')}
            >
              Đã ẩn ({hiddenListings.length})
            </Button>
          </Space>
        )}

        {visibleListings.length > 0 ? (
          <Flex vertical gap={8}>
            {visibleListings.map((listing) => (
              <div key={listing.id} className="border border-line rounded-lg overflow-hidden">
                <CardItem column listing={listing} />
              </div>
            ))}
            {pagination && pagination.total > pagination.pageSize && (
              <PaginationControl
                total={pagination.total}
                pageSize={pagination.pageSize}
                currentPage={pagination.page}
              />
            )}
          </Flex>
        ) : (
          <EmptyState
            variant={EmptyVariant.LISTING}
            description="Chưa có tin đăng"
            className="pb-5!"
          >
            {onPostListing && (
              <Button type="primary" onClick={onPostListing}>
                Đăng tin ngay
              </Button>
            )}
          </EmptyState>
        )}
      </Flex>
    </div>
  );
}
