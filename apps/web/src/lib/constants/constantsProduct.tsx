import type { ReactNode } from 'react';
import { Armchair, Bike, BookOpen, Laptop, Package, Refrigerator } from 'lucide-react';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CONDITION_LABELS,
  ProductCategory,
  ProductCondition,
  ProductStatus,
} from '@tro-oi/shared';

export const PRODUCT_CATEGORY_ICONS: Record<ProductCategory, ReactNode> = {
  [ProductCategory.FURNITURE]: <Armchair size={22} />,
  [ProductCategory.ELECTRONICS]: <Laptop size={22} />,
  [ProductCategory.APPLIANCE]: <Refrigerator size={22} />,
  [ProductCategory.VEHICLE]: <Bike size={22} />,
  [ProductCategory.STUDY]: <BookOpen size={22} />,
  [ProductCategory.OTHER]: <Package size={22} />,
};

export const PRODUCT_CATEGORY_OPTIONS = (
  Object.entries(PRODUCT_CATEGORY_LABELS) as [ProductCategory, string][]
).map(([value, label]) => ({ value, label, icon: PRODUCT_CATEGORY_ICONS[value] }));

export const PRODUCT_CONDITION_OPTIONS = (
  Object.entries(PRODUCT_CONDITION_LABELS) as [ProductCondition, string][]
).map(([value, label]) => ({ value, label }));

/** Màu Tag (preset AntD) theo tình trạng món đồ. */
export const CONDITION_TAG_COLORS: Record<ProductCondition, string> = {
  [ProductCondition.NEW]: 'green',
  [ProductCondition.LIKE_NEW]: 'lime',
  [ProductCondition.GOOD]: 'blue',
  [ProductCondition.FAIR]: 'default',
};

/** Màu Tag theo trạng thái tin Chợ ơi. */
export const PRODUCT_STATUS_TAG_COLORS: Record<ProductStatus, string> = {
  [ProductStatus.PENDING]: 'processing',
  [ProductStatus.ACTIVE]: 'success',
  [ProductStatus.SOLD]: 'purple',
  [ProductStatus.CLOSED]: 'default',
};

/** Khoảng giá nhanh trên trang Chợ ơi — key lưu ở ?price=. */
export const PRODUCT_PRICE_RANGES = [
  { key: 'duoi-200k', label: 'Dưới 200 nghìn', max: 200_000 },
  { key: '200k-1tr', label: '200 nghìn - 1 triệu', min: 200_000, max: 1_000_000 },
  { key: '1tr-5tr', label: '1 - 5 triệu', min: 1_000_000, max: 5_000_000 },
  { key: 'tren-5tr', label: 'Trên 5 triệu', min: 5_000_000 },
] as const;

export const PRODUCT_SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất', sortBy: 'createdAt', sortDirection: 'desc' },
  { value: 'price-asc', label: 'Giá thấp → cao', sortBy: 'price', sortDirection: 'asc' },
  { value: 'price-desc', label: 'Giá cao → thấp', sortBy: 'price', sortDirection: 'desc' },
] as const;
