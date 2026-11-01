'use client';

import Link from 'next/link';
import Image from 'next/image';
import clsx from 'clsx';
import { useCallback, type MouseEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { App, Flex, Space, Card, Button } from 'antd';
import { MapPin, Heart, House, CircleUserRound, Image as ImageIcon, BedDouble } from 'lucide-react';
import {
  DIRECTION_LABELS,
  FURNISHING_STATUS_LABELS,
  PROPERTY_CATEGORY_LABELS,
  USER_ROLE_LABELS,
  type Listing,
} from '@tro-oi/shared';

import { useAuthStore } from '@/stores/useAuthStore';
import { formatListingPrice, formatRelativeTime, formatVietnameseCurrency } from '@/utils/helpers';

interface CardItemProps {
  listing: Listing;
  /** Dạng hàng ngang (trang tìm kiếm/danh sách); mặc định dạng thẻ dọc. */
  column?: boolean;
}

const FALLBACK_IMAGE = '/images/test.jpg';

/** Nút Lưu tin: chưa đăng nhập → chuyển tới trang đăng nhập. */
function useFavoriteToggle(listing: Listing) {
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const isLoggedIn = useAuthStore((state) => Boolean(state.user));
  const isFavorite = useAuthStore((state) =>
    state.favorites.some((item) => item.id === listing.id),
  );
  const toggleFavorite = useAuthStore((state) => state.toggleFavorite);

  const handleToggle = useCallback(
    async (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isLoggedIn) {
        router.push(`/dang-nhap?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      try {
        await toggleFavorite(listing);
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [isLoggedIn, listing, message, pathname, router, toggleFavorite],
  );

  return { isFavorite, handleToggle };
}

/** Displays a property summary card with listing details and a favorite control. */
export function CardItem({ listing, column }: CardItemProps) {
  const { isFavorite, handleToggle } = useFavoriteToggle(listing);
  const { id, title, images, area, price, pricePerSquareMeter, bedrooms, address, author } =
    listing;
  const href = `/phong-tro/${id}`;
  const imageUrl = images[0] || FALLBACK_IMAGE;
  const propertyType = PROPERTY_CATEGORY_LABELS[listing.category];
  const direction = listing.direction && DIRECTION_LABELS[listing.direction];
  const locationLabel = address?.district ? `${address.district}, ${address.city}` : address?.city;
  const priceLabel = formatListingPrice(price, listing.transaction);
  const summary = [
    address?.district && `${propertyType} ${address.district}`,
    address?.street,
    listing.floorCount != null && `${listing.floorCount} tầng`,
    bedrooms != null && `${bedrooms}PN`,
    area != null && `${area}m²`,
    listing.furnishing && FURNISHING_STATUS_LABELS[listing.furnishing],
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

        <Link href={href} className="block">
          <Flex gap={16}>
            {/* Image */}
            <div className="relative h-40 w-40 min-w-40 overflow-hidden rounded-lg">
              <Image src={imageUrl} alt={title} fill sizes="160px" className="object-cover" />

              {/* Overlay */}
              <Flex
                justify="space-between"
                align="center"
                className="absolute right-0 bottom-0 left-0 bg-black/50 px-2! py-1.5!"
              >
                <span className="text-xs! font-semibold text-white">
                  {formatRelativeTime(listing.createdAt)}
                </span>

                <Space align="center" size={4}>
                  <span className="text-xs! font-semibold text-white">{images.length}</span>
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
                  aria-pressed={isFavorite}
                  icon={
                    <Heart
                      size={18}
                      className={isFavorite ? 'fill-[#f0325e] stroke-[#f0325e]' : ''}
                    />
                  }
                  className="shrink-0 text-sm! text-[#222]! rounded-xl!"
                  onClick={handleToggle}
                >
                  {isFavorite ? 'Đã lưu' : 'Lưu'}
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

                {direction && (
                  <Flex align="center" gap={4}>
                    <House size={16} color="#222" />
                    <span className="text-secondary text-[#222]">{direction}</span>
                  </Flex>
                )}

                <span className="text-secondary text-[#222]">{propertyType}</span>
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

                  <span className="text-secondary text-[#222]">{author.name}</span>
                  {author.role && (
                    <span className="text-secondary text-sm">{USER_ROLE_LABELS[author.role]}</span>
                  )}
                </Flex>
              )}

              {/* Price */}
              <Flex align="center" gap={12}>
                <span className="text-primary text-[#f0325e]">
                  {priceLabel}
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
      href={href}
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
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 240px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Favorite */}
        <button
          type="button"
          aria-label={isFavorite ? 'Bỏ lưu tin' : 'Lưu tin'}
          aria-pressed={isFavorite}
          onClick={handleToggle}
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
          <p className="text-muted">{formatRelativeTime(listing.createdAt)}</p>

          <Space>
            <p className="text-muted">{images.length}</p>
            <ImageIcon size={16} color="#fff" />
          </Space>
        </Flex>
      </div>

      <div className="p-2">
        <p className="text-default line-clamp-2">{title}</p>

        <Flex vertical gap={4} className="mt-1!">
          <Space size={8} wrap>
            {bedrooms != null && <p className="text-secondary">{bedrooms} PN</p>}
            {direction && <p className="text-secondary">{direction}</p>}
            <p className="text-secondary">{propertyType}</p>
          </Space>
          <Space size={8} wrap>
            <p className="text-primary text-[#f0325e]">{priceLabel}</p>
            {area != null && <p className="text-secondary text-[#222]!">{area} m²</p>}
          </Space>
          <Space size={4}>
            <MapPin size={16} color="#bfbfbf" />
            <p className="text-secondary line-clamp-1">{locationLabel}</p>
          </Space>
        </Flex>
      </div>
    </Link>
  );
}
