'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button, Flex, Space } from 'antd';

interface ProfileReviewsProps {
  totalCount?: number;
  buyerCount?: number;
  sellerCount?: number;
}

export function ProfileReviews({
  totalCount = 0,
  buyerCount = 0,
  sellerCount = 0,
}: ProfileReviewsProps) {
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all');

  return (
    <div className="rounded-lg bg-white py-4 px-5">
      <Flex vertical gap={16}>
        <p className="text-primary text-xl">Đánh giá</p>

        <Space>
          <Button
            type={filter === 'all' ? 'primary' : 'default'}
            className={`h-8! ${filter !== 'all' ? 'btn-gray text-[#222]!' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({totalCount})
          </Button>

          <Button
            type={filter === 'buyer' ? 'primary' : 'default'}
            className={`h-8! ${filter !== 'buyer' ? 'btn-gray text-[#222]!' : ''}`}
            onClick={() => setFilter('buyer')}
          >
            Từ người mua ({buyerCount})
          </Button>

          <Button
            type={filter === 'seller' ? 'primary' : 'default'}
            className={`h-8! ${filter !== 'seller' ? 'btn-gray text-[#222]!' : ''}`}
            onClick={() => setFilter('seller')}
          >
            Từ người bán ({sellerCount})
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

          <p className="text-[#595959] text-sm">Chưa có đánh giá nào</p>
        </Space>
      </Flex>
    </div>
  );
}
