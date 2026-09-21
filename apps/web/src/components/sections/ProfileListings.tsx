'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button, Flex, Space } from 'antd';

interface ProfileListingsProps {
  activeCount?: number;
  soldCount?: number;
  onPostListing?: () => void;
}

export function ProfileListings({
  activeCount = 0,
  soldCount = 0,
  onPostListing,
}: ProfileListingsProps) {
  const [tab, setTab] = useState<'active' | 'sold'>('active');

  const totalCount = activeCount + soldCount;

  return (
    <div className="rounded-lg bg-white py-4 px-5">
      <Flex vertical gap={16}>
        <p className="text-primary text-xl">Tất cả tin đăng ({totalCount})</p>

        <Space>
          <Button
            type={tab === 'active' ? 'primary' : 'default'}
            className={`h-8! ${tab === 'sold' ? 'btn-gray text-[#222]!' : ''}`}
            onClick={() => setTab('active')}
          >
            Tin đang hoạt động ({activeCount})
          </Button>

          <Button
            type={tab === 'sold' ? 'primary' : 'default'}
            className={`h-8! ${tab === 'active' ? 'btn-gray text-[#222]!' : ''}`}
            onClick={() => setTab('sold')}
          >
            Đã bán ({soldCount})
          </Button>
        </Space>

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

          <Button type="primary" onClick={onPostListing}>
            Đăng tin ngay
          </Button>
        </Space>
      </Flex>
    </div>
  );
}
