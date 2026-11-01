'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { Button, Flex, Space } from 'antd';
import { ListingStatus, type Listing } from '@tro-oi/shared';

import { CardItem } from '@/components/common';

interface ProfileListingsProps {
  listings: Listing[];
  /** Hồ sơ công khai: chỉ hiện tin đang hiển thị, không có tab. */
  readOnly?: boolean;
  onPostListing?: () => void;
  /** Nội dung cạnh tiêu đề, vd nút "Quản lý tin". */
  extra?: ReactNode;
}

type ListingTab = 'active' | 'hidden';

/** Danh sách tin của một người dùng, chia tab Đang hiển thị / Đã ẩn. */
export function ProfileListings({
  listings,
  readOnly = false,
  onPostListing,
  extra,
}: ProfileListingsProps) {
  const [tab, setTab] = useState<ListingTab>('active');
  const activeListings = listings.filter((item) => item.status === ListingStatus.ACTIVE);
  const hiddenListings = listings.filter((item) => item.status !== ListingStatus.ACTIVE);
  const visibleListings = readOnly || tab === 'active' ? activeListings : hiddenListings;

  return (
    <div className="rounded-lg bg-white py-4 px-5">
      <Flex vertical gap={16}>
        <Flex justify="space-between" align="center">
          <p className="text-primary text-xl">Tất cả tin đăng ({listings.length})</p>
          {extra}
        </Flex>

        {!readOnly && (
          <Space>
            <Button
              type={tab === 'active' ? 'primary' : 'default'}
              className={`h-8! ${tab === 'hidden' ? 'btn-gray text-[#222]!' : ''}`}
              onClick={() => setTab('active')}
            >
              Đang hiển thị ({activeListings.length})
            </Button>

            <Button
              type={tab === 'hidden' ? 'primary' : 'default'}
              className={`h-8! ${tab === 'active' ? 'btn-gray text-[#222]!' : ''}`}
              onClick={() => setTab('hidden')}
            >
              Đã ẩn ({hiddenListings.length})
            </Button>
          </Space>
        )}

        {visibleListings.length > 0 ? (
          <Flex vertical gap={8}>
            {visibleListings.map((listing) => (
              <div key={listing.id} className="border border-[#f0f0f0] rounded-lg overflow-hidden">
                <CardItem column listing={listing} />
              </div>
            ))}
          </Flex>
        ) : (
          <Space vertical align="center" className="pb-5">
            <div className="relative w-50 h-50">
              <Image
                alt="Ảnh logo"
                sizes="200px"
                fill
                src="/images/tro-oi-banner-no-logo.svg"
                className="object-contain"
              />
            </div>

            <p className="text-[#595959] text-sm">Chưa có tin đăng</p>

            {onPostListing && (
              <Button type="primary" onClick={onPostListing}>
                Đăng tin ngay
              </Button>
            )}
          </Space>
        )}
      </Flex>
    </div>
  );
}
