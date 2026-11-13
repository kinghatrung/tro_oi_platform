'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback } from 'react';
import { Button, Card, Flex, Space } from 'antd';
import {
  CircleUserRound,
  Heart,
  Image as ImageIcon,
  MapPin,
  PackageCheck,
  Tag,
} from 'lucide-react';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CONDITION_LABELS,
  type ProductItem,
} from '@tro-oi/shared';

import { NO_IMAGE } from '@/constants';
import { useSaveToggle } from '@/hooks/useSaveToggle';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatVietnameseCurrency } from '@/utils/helpers';

import { RelativeTime } from './RelativeTime';

interface ProductCardProps {
  product: ProductItem;
  /** Dạng hàng ngang (trang tìm kiếm, chế độ danh sách); mặc định dạng thẻ dọc. */
  column?: boolean;
}

/**
 * Thẻ món đồ Chợ ơi — cùng bố cục thẻ tin Trọ ơi (CardItem) ở cả dạng thẻ dọc lẫn hàng ngang:
 * ảnh + thời gian / số ảnh, nút lưu, tình trạng · danh mục, giá, địa chỉ (hàng ngang thêm người bán).
 */
export function ProductCard({ product, column }: ProductCardProps) {
  const isSaved = useAuthStore((state) =>
    state.favoriteProducts.some((item) => item.id === product.id),
  );
  const toggleFavoriteProduct = useAuthStore((state) => state.toggleFavoriteProduct);
  const handleToggleSave = useSaveToggle(
    useCallback(() => toggleFavoriteProduct(product), [product, toggleFavoriteProduct]),
  );
  const { address, title, images, seller } = product;
  const href = `/cho-oi/${product.id}`;
  const imageUrl = images[0] || NO_IMAGE;
  const category = PRODUCT_CATEGORY_LABELS[product.category];
  const condition = PRODUCT_CONDITION_LABELS[product.condition];
  // district: món đăng trước 1/7/2025 chưa chuyển sang phường/xã
  const wardLabel = address?.ward ?? address?.district;
  const location = [wardLabel, address?.city].filter(Boolean).join(', ');
  const priceLabel = product.price === 0 ? 'Cho tặng' : formatVietnameseCurrency(product.price);

  if (column) {
    // Dòng tóm tắt như CardItem: "Đồ điện tử Phường Cầu Giấy - Tốt - Thương lượng"
    const summary = [
      wardLabel ? `${category} ${wardLabel}` : category,
      condition,
      product.isNegotiable && 'Thương lượng',
    ]
      .filter(Boolean)
      .join(' - ');

    return (
      <Card
        variant="borderless"
        className="rounded-none! transition-shadow! duration-200! hover:shadow-[0_4px_20px_rgba(0,0,0,0.16)]!"
        classNames={{ body: 'pt-3! pb-4! px-6!' }}
      >
        <p className="text-secondary mb-2 text-xs!">{summary}</p>

        <Link href={href} className="block">
          <Flex gap={16}>
            <div className="relative h-40 w-40 min-w-40 overflow-hidden rounded-lg bg-soft">
              <Image src={imageUrl} alt={title} fill sizes="160px" className="object-cover" />
              <Flex
                justify="space-between"
                align="center"
                className="absolute right-0 bottom-0 left-0 bg-black/50 px-2! py-1.5!"
              >
                <span className="text-xs! font-semibold text-white">
                  <RelativeTime date={product.createdAt} />
                </span>
                <Space align="center" size={4}>
                  <span className="text-xs! font-semibold text-white">{images.length}</span>
                  <ImageIcon size={13} className="text-white" />
                </Space>
              </Flex>
            </div>

            <Flex vertical gap={7} className="min-w-0! flex-1">
              <Flex justify="space-between" align="start" gap={12}>
                <h3 className="text-default text-ink m-0! line-clamp-2 min-w-0 flex-1 font-semibold leading-5!">
                  {title}
                </h3>
                <Button
                  size="small"
                  aria-pressed={isSaved}
                  icon={<Heart size={18} className={isSaved ? 'fill-price stroke-price' : ''} />}
                  className="shrink-0 rounded-xl! text-sm! text-ink!"
                  onClick={handleToggleSave}
                >
                  {isSaved ? 'Đã lưu' : 'Lưu'}
                </Button>
              </Flex>

              <Flex align="center" gap={12} wrap>
                <Flex align="center" gap={4}>
                  <PackageCheck size={16} />
                  <span className="text-secondary text-ink">{condition}</span>
                </Flex>
                <Flex align="center" gap={4}>
                  <Tag size={16} />
                  <span className="text-secondary text-ink">{category}</span>
                </Flex>
              </Flex>

              {location && (
                <Flex align="center" gap={4}>
                  <MapPin size={16} />
                  <span className="text-secondary text-ink">{location}</span>
                </Flex>
              )}

              {seller && (
                <Flex align="center" gap={8}>
                  <div className="flex size-5 items-center justify-center rounded-full bg-yellow-400">
                    <CircleUserRound size={15} className="text-white" />
                  </div>
                  <span className="text-secondary text-ink">{seller.name}</span>
                </Flex>
              )}

              <Flex align="center" gap={12}>
                <span className="text-primary text-price">{priceLabel}</span>
                {product.isNegotiable && (
                  <span className="text-default font-semibold">Thương lượng</span>
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
      className="group block overflow-hidden rounded-lg bg-surface transition-all duration-300 ease-in-out hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-soft">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 768px) 50vw, 200px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <button
          type="button"
          aria-label={isSaved ? 'Bỏ lưu món đồ' : 'Lưu món đồ'}
          aria-pressed={isSaved}
          onClick={handleToggleSave}
          className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full bg-black/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-black/40 active:scale-95"
        >
          <Heart size={20} className={isSaved ? 'fill-price stroke-price' : 'stroke-white'} />
        </button>
        <div className="absolute right-0 bottom-0 left-0 flex items-center justify-between bg-[linear-gradient(#2220_0%,#222222bf_100%)] px-3 py-1.5">
          <p className="text-muted">
            <RelativeTime date={product.createdAt} />
          </p>
          <span className="flex items-center gap-1.5">
            <p className="text-muted">{images.length}</p>
            <ImageIcon size={16} color="#fff" />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-2">
        <p className="text-default line-clamp-2">{title}</p>
        <p className="text-secondary line-clamp-1">
          {condition} · {category}
        </p>
        <p className="text-primary text-price truncate">
          {priceLabel}
          {product.isNegotiable && (
            <span className="ml-1 text-xs font-normal text-subtle">· Thương lượng</span>
          )}
        </p>
        {location && (
          <span className="flex items-center gap-1">
            <MapPin size={16} className="shrink-0 text-subtle" />
            <p className="text-secondary line-clamp-1">{location}</p>
          </span>
        )}
      </div>
    </Link>
  );
}
