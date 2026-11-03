import Link from 'next/link';
import Image from 'next/image';
import { Tag } from 'antd';
import { MapPin } from 'lucide-react';
import { PRODUCT_CONDITION_LABELS, type ProductItem } from '@tro-oi/shared';

import { NO_IMAGE } from '@/constants';
import { CONDITION_TAG_COLORS } from '@/lib/constants/constantsProduct';
import { formatRelativeTime, formatVietnameseCurrency } from '@/utils/helpers';

/** Thẻ món đồ trên Chợ ơi. */
export function ProductCard({ product }: { product: ProductItem }) {
  return (
    <Link
      href={`/cho-oi/${product.id}`}
      className="group block h-full overflow-hidden rounded-lg bg-surface! transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-soft">
        <Image
          src={product.images[0] || NO_IMAGE}
          alt={product.title}
          fill
          sizes="(max-width: 768px) 50vw, 240px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Tag
          color={CONDITION_TAG_COLORS[product.condition]}
          className="absolute! top-2 left-2 m-0!"
        >
          {PRODUCT_CONDITION_LABELS[product.condition]}
        </Tag>
      </div>
      <div className="p-3">
        <p className="text-default line-clamp-2 min-h-12 leading-6">{product.title}</p>
        <p className="mt-1 font-bold text-price">
          {product.price === 0 ? 'Cho tặng' : formatVietnameseCurrency(product.price)}
          {product.isNegotiable && (
            <span className="ml-1 text-xs font-normal text-subtle">· Thương lượng</span>
          )}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2 text-xs text-subtle">
          <span className="flex min-w-0 items-center gap-1">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">{product.address?.city}</span>
          </span>
          <span className="shrink-0">{formatRelativeTime(product.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
