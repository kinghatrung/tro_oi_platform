'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback } from 'react';
import { Heart, Image as ImageIcon, MapPin } from 'lucide-react';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CONDITION_LABELS,
  type ProductItem,
} from '@tro-oi/shared';

import { NO_IMAGE } from '@/constants';
import { useSaveToggle } from '@/hooks/useSaveToggle';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatRelativeTime, formatVietnameseCurrency } from '@/utils/helpers';

/** Thẻ món đồ Chợ ơi — cùng kiểu thẻ tin Trọ ơi (CardItem): ảnh vuông, thời gian + số ảnh, nút ♡ lưu. */
export function ProductCard({ product }: { product: ProductItem }) {
  const isSaved = useAuthStore((state) =>
    state.favoriteProducts.some((item) => item.id === product.id),
  );
  const toggleFavoriteProduct = useAuthStore((state) => state.toggleFavoriteProduct);
  const handleToggleSave = useSaveToggle(
    useCallback(() => toggleFavoriteProduct(product), [product, toggleFavoriteProduct]),
  );
  const { address } = product;
  // district: món đăng trước 1/7/2025 chưa chuyển sang phường/xã
  const location = [address?.ward ?? address?.district, address?.city].filter(Boolean).join(', ');

  return (
    <Link
      href={`/cho-oi/${product.id}`}
      className="group block overflow-hidden rounded-lg bg-surface transition-all duration-300 ease-in-out hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-soft">
        <Image
          src={product.images[0] || NO_IMAGE}
          alt={product.title}
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
          <p className="text-muted">{formatRelativeTime(product.createdAt)}</p>
          <span className="flex items-center gap-1.5">
            <p className="text-muted">{product.images.length}</p>
            <ImageIcon size={16} color="#fff" />
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-1 p-2">
        <p className="text-default line-clamp-2">{product.title}</p>
        <p className="text-secondary line-clamp-1">
          {PRODUCT_CONDITION_LABELS[product.condition]} ·{' '}
          {PRODUCT_CATEGORY_LABELS[product.category]}
        </p>
        <p className="text-primary text-price truncate">
          {product.price === 0 ? 'Cho tặng' : formatVietnameseCurrency(product.price)}
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
