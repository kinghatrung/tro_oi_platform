'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useState } from 'react';
import { Flex, Space } from 'antd';
import { MapPin, Heart, Image } from 'lucide-react';

import { formatPrice, formatRelativeTime } from '@/helpers';

interface CardItemProps {
  id?: string;
  timeAgo?: string;
  countMedia?: number;
  imageUrl?: string;
  title?: string;
  propertyType?: string;
  area?: number;
  price?: number;
  pricePerSquareMeter?: number;
  bedrooms?: number;
  mainDirection?: string;
  address?: string;
}

export function CardItem({
  id,
  imageUrl,
  title,
  timeAgo,
  countMedia,
  propertyType,
  area,
  price,
  pricePerSquareMeter,
  bedrooms,
  mainDirection,
  address,
}: CardItemProps) {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <Link
      href={`/bat-dong-san/${id}`}
      className={clsx(`
        group
        block
        overflow-hidden
        rounded-lg
        bg-white
        cursor-pointer
        transition-all duration-300
        ease-in-out
        hover:shadow-lg
      `)}
    >
      <div className="relative overflow-hidden">
        <img
          src={imageUrl || '/images/test.jpg'}
          alt={title || ''}
          className={clsx(`
            aspect-4/4
            size-full
            object-cover
            transition-transform duration-500
            group-hover:scale-105
          `)}
        />

        {/* Favorite */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            setIsFavorite((prev) => !prev);
          }}
          className={clsx(`
            absolute top-3 right-3
            flex size-9 items-center justify-center
            rounded-full
            bg-black/20
            backdrop-blur-sm
            transition-all duration-200
            hover:scale-110
            hover:bg-black/40
            active:scale-95
          `)}
        >
          <Heart
            size={20}
            className={isFavorite ? 'fill-[#f0325e] stroke-[#f0325e]' : 'stroke-white'}
          />
        </button>

        <Flex
          justify="space-between"
          align="center"
          className={clsx(`
            absolute bottom-0 left-0 right-0
            px-3! py-1.5!
            bg-[linear-gradient(#2220_0%,#222222bf_100%)]
          `)}
        >
          <p className="text-muted">{formatRelativeTime(timeAgo || 0)}</p>

          <Space>
            <p className="text-muted">{countMedia}</p>
            <Image size={16} color="#fff" />
          </Space>
        </Flex>
      </div>

      <div className="p-2">
        <p className="text-default line-clamp-2">
          {title || 'Cho thuê nhà nguyên căn + kết hợp làm văn phòng hoặc'}
        </p>

        <Flex vertical gap={4} className="mt-1!">
          <Space size={8} wrap>
            <p className="text-secondary">{bedrooms} PN</p>
            <p className="text-secondary">{mainDirection || null}</p>
            <p className="text-secondary">{propertyType || null}</p>
          </Space>
          <Space size={8} wrap>
            <p className="text-primary text-[#f0325e]">{formatPrice(price || 0)}</p>
            <p className="text-secondary text-[#222]!">
              {formatPrice(pricePerSquareMeter || 0)}/m²
            </p>
            <p className="text-secondary text-[#222]!">{area || null} m²</p>
          </Space>
          <Space size={4}>
            <MapPin size={16} color="#bfbfbf" />
            <p className="text-secondary">{address || 'Hà Nội'}</p>
          </Space>
        </Flex>
      </div>
    </Link>
  );
}
