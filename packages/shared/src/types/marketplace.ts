import type { AddressInfo, BaseListRequest } from './common';

/** Danh mục đồ cũ trên chợ (pass đồ). */
export enum ProductCategory {
  FURNITURE = 'furniture',
  ELECTRONICS = 'electronics',
  APPLIANCE = 'appliance',
  VEHICLE = 'vehicle',
  STUDY = 'study',
  OTHER = 'other'
}

/** Nhãn hiển thị tiếng Việt cho ProductCategory. */
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  [ProductCategory.FURNITURE]: 'Nội thất',
  [ProductCategory.ELECTRONICS]: 'Đồ điện tử',
  [ProductCategory.APPLIANCE]: 'Đồ gia dụng',
  [ProductCategory.VEHICLE]: 'Xe cộ',
  [ProductCategory.STUDY]: 'Sách & đồ dùng học tập',
  [ProductCategory.OTHER]: 'Khác'
};

/** Tình trạng món đồ. */
export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like-new',
  GOOD = 'good',
  FAIR = 'fair'
}

/** Nhãn hiển thị tiếng Việt cho ProductCondition. */
export const PRODUCT_CONDITION_LABELS: Record<ProductCondition, string> = {
  [ProductCondition.NEW]: 'Mới',
  [ProductCondition.LIKE_NEW]: 'Như mới',
  [ProductCondition.GOOD]: 'Tốt',
  [ProductCondition.FAIR]: 'Trung bình'
};

/** Trạng thái món đồ trên chợ. */
export enum ProductStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  CLOSED = 'closed'
}

/** Người bán trên chợ đồ cũ. */
export interface ProductSeller {
  id: string;
  name: string;
  avatar?: string;
  phone?: string;
  profileUrl?: string;
}

/** Món đồ được đăng bán/pass. */
export interface ProductItem {
  id: string;
  title: string;
  description?: string;
  category: ProductCategory;
  condition: ProductCondition;
  status: ProductStatus;
  /** Giá rao, đơn vị VND. */
  price: number;
  isNegotiable?: boolean;
  images: string[];
  address?: AddressInfo;
  seller?: ProductSeller;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

/** Tham số tìm kiếm/lọc món đồ trên chợ. */
export interface SearchProductRequest extends BaseListRequest {
  keyword?: string;
  category?: ProductCategory;
  condition?: ProductCondition;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
}

/** Payload đăng món đồ mới. */
export interface CreateProductRequest {
  title: string;
  description?: string;
  category: ProductCategory;
  condition: ProductCondition;
  price: number;
  isNegotiable?: boolean;
  images: string[];
  address?: AddressInfo;
}

/** Payload cập nhật món đồ. */
export type UpdateProductRequest = Partial<CreateProductRequest> & {
  status?: ProductStatus;
};
