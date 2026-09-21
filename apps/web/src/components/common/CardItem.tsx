'use client';

import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { useState } from 'react';
import { Flex, Space, Card, Button } from 'antd';
import { MapPin, Heart, House, CircleUserRound, Image as ImageIcon, BedDouble } from 'lucide-react';

import { formatVietnameseCurrency, formatRelativeTime } from '@/utils/helpers';

interface AuthorType {
  name?: string;
  posted?: number;
  rank?: string;
}

interface CardItemProps {
  id: number;
  column?: boolean;
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
  location?: string;
  district?: string;
  street?: string;
  floorCount?: number;
  furnishing?: string;
  author?: AuthorType;
}

/** Displays a property summary card with listing details and a favorite control. */
export function CardItem({
  id,
  column,
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
  location,
  district,
  street,
  floorCount,
  furnishing,
  author,
}: CardItemProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const locationLabel = address || location;
  const summary = [
    district && `Nhà đất ${district}`,
    street,
    floorCount != null && `${floorCount} tầng`,
    bedrooms != null && `${bedrooms}PN`,
    area != null && `${area}m²`,
    furnishing,
  ]
    .filter(Boolean)
    .join(' - ');

  if (column) {
    return (
      <Card
        variant="borderless"
        className="rounded-none! transition-shadow! duration-200! hover:shadow-[0_4px_20px_rgba(0,0,0,0.16)]!"
        classNames={{
          body: 'pt-3! pb-4! px-6!',
        }}
      >
        {/* Breadcrumb / mô tả ngắn */}
        {summary && <p className="text-secondary mb-2 text-xs!">{summary}</p>}

        <Link href={`/phong-tro/${id}`} className="block">
          <Flex gap={16}>
            {/* Image */}
            <div className="relative h-40 w-40 min-w-40 overflow-hidden rounded-lg">
              <Image
                src={imageUrl || '/images/test.jpg'}
                alt={title || 'Ảnh nhà đất'}
                fill
                sizes="160px"
                className="object-cover"
              />

              {/* Overlay */}
              <Flex
                justify="space-between"
                align="center"
                className="absolute right-0 bottom-0 left-0 bg-black/50 px-2! py-1.5!"
              >
                {timeAgo ? (
                  <span className="text-xs! font-semibold text-white">
                    {formatRelativeTime(timeAgo)}
                  </span>
                ) : (
                  <span />
                )}

                <Space align="center" size={4}>
                  <span className="text-xs! font-semibold text-white">{countMedia}</span>
                  <ImageIcon size={13} className="text-white" />
                </Space>
              </Flex>
            </div>

            {/* Content */}
            <Flex vertical gap={7} className="min-w-0! flex-1">
              {/* Title + Save */}
              <Flex justify="space-between" align="start" gap={12}>
                <h3 className="text-default text-[#222] m-0! line-clamp-2 font-semibold leading-5! min-w-0 flex-1">
                  {title}
                </h3>

                <Button
                  size="small"
                  icon={
                    <Heart
                      size={18}
                      className={isFavorite ? 'fill-[#f0325e] stroke-[#f0325e]' : ''}
                    />
                  }
                  className="shrink-0 text-sm! text-[#222]! rounded-xl! btn-ghost!"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsFavorite((prev) => !prev);
                  }}
                >
                  Lưu
                </Button>
              </Flex>

              {/* Property information */}
              <Flex align="center" gap={12} wrap>
                {bedrooms != null && (
                  <Flex align="center" gap={4}>
                    <BedDouble size={16} color="#222" />
                    <span className="text-secondary text-[#222]">{bedrooms} PN</span>
                  </Flex>
                )}

                {mainDirection && (
                  <Flex align="center" gap={4}>
                    <House size={16} color="#222" />
                    <span className="text-secondary text-[#222]">{mainDirection}</span>
                  </Flex>
                )}

                {propertyType && <span className="text-secondary text-[#222]">{propertyType}</span>}
              </Flex>

              {/* Address */}
              {locationLabel && (
                <Flex align="center" gap={4}>
                  <MapPin size={16} color="#222" />
                  <span className="text-secondary text-[#222]">{locationLabel}</span>
                </Flex>
              )}

              {/* Poster */}
              {author && (
                <Flex align="center" gap={8}>
                  <div className="flex size-5 items-center justify-center rounded-full bg-yellow-400">
                    <CircleUserRound size={15} className="text-white" />
                  </div>

                  <span className="text-secondary text-[#222]">{author?.name}</span>
                  <span className="text-secondary text-sm">
                    {author?.rank} · {author?.posted} tin
                  </span>
                </Flex>
              )}

              {/* Price */}
              <Flex align="center" gap={12}>
                <span className="text-primary text-[#f0325e]">
                  {formatVietnameseCurrency(price || 0)}
                  {area != null && ` - ${area}m²`}
                </span>

                {pricePerSquareMeter != null && (
                  <span className="text-default font-semibold">
                    {formatVietnameseCurrency(pricePerSquareMeter)}/m²
                  </span>
                )}
              </Flex>
            </Flex>
          </Flex>
        </Link>
      </Card>
    );
  }

  return (
    <Link
      href={`/phong-tro/${id}`}
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
          {timeAgo ? <p className="text-muted">{formatRelativeTime(timeAgo)}</p> : <span />}

          <Space>
            <p className="text-muted">{countMedia}</p>
            <ImageIcon size={16} color="#fff" />
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
            <p className="text-primary text-[#f0325e]">{formatVietnameseCurrency(price || 0)}</p>
            <p className="text-secondary text-[#222]!">
              {formatVietnameseCurrency(pricePerSquareMeter || 0)}/m²
            </p>
            <p className="text-secondary text-[#222]!">{area || null} m²</p>
          </Space>
          <Space size={4}>
            <MapPin size={16} color="#bfbfbf" />
            <p className="text-secondary">{address || location || 'Hà Nội'}</p>
          </Space>
        </Flex>
      </div>
    </Link>
  );
}
