import type { AddressInfo, BaseListRequest } from './common';
import type { UserRole } from './user';

/** Nhóm loại hình nhà ở/tin đăng. Giá trị trùng với slug route trên FE. */
export enum PropertyCategory {
  ROOM = 'phong-tro',
  APARTMENT = 'can-ho',
  WHOLE_HOUSE = 'nguyen-can',
  ROOMMATE = 'o-ghep'
}

/** Nhãn hiển thị tiếng Việt cho PropertyCategory. */
export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  [PropertyCategory.ROOM]: 'Phòng trọ',
  [PropertyCategory.APARTMENT]: 'Căn hộ',
  [PropertyCategory.WHOLE_HOUSE]: 'Nguyên căn',
  [PropertyCategory.ROOMMATE]: 'Tìm người ở ghép'
};

/** Hình thức giao dịch của tin đăng. */
export enum TransactionType {
  RENT = 'rent-room',
  BUY = 'buy-room'
}

/** Nhãn hiển thị tiếng Việt cho TransactionType. */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.RENT]: 'Cho thuê',
  [TransactionType.BUY]: 'Mua bán'
};

/** Trạng thái tin đăng. */
export enum ListingStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CLOSED = 'closed'
}

/** Nhãn hiển thị tiếng Việt cho ListingStatus. */
export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  [ListingStatus.DRAFT]: 'Nháp',
  [ListingStatus.PENDING]: 'Chờ duyệt',
  [ListingStatus.ACTIVE]: 'Đang hiển thị',
  [ListingStatus.EXPIRED]: 'Hết hạn',
  [ListingStatus.CLOSED]: 'Đã đóng'
};

/** Hướng nhà/phòng. */
export enum Direction {
  EAST = 'east',
  WEST = 'west',
  SOUTH = 'south',
  NORTH = 'north',
  NORTH_EAST = 'north-east',
  NORTH_WEST = 'north-west',
  SOUTH_EAST = 'south-east',
  SOUTH_WEST = 'south-west'
}

/** Nhãn hiển thị tiếng Việt cho Direction. */
export const DIRECTION_LABELS: Record<Direction, string> = {
  [Direction.EAST]: 'Đông',
  [Direction.WEST]: 'Tây',
  [Direction.SOUTH]: 'Nam',
  [Direction.NORTH]: 'Bắc',
  [Direction.NORTH_EAST]: 'Đông Bắc',
  [Direction.NORTH_WEST]: 'Tây Bắc',
  [Direction.SOUTH_EAST]: 'Đông Nam',
  [Direction.SOUTH_WEST]: 'Tây Nam'
};

/** Tình trạng nội thất. */
export enum FurnishingStatus {
  FULL = 'full',
  BASIC = 'basic',
  EMPTY = 'empty'
}

/** Nhãn hiển thị tiếng Việt cho FurnishingStatus. */
export const FURNISHING_STATUS_LABELS: Record<FurnishingStatus, string> = {
  [FurnishingStatus.FULL]: 'Nội thất đầy đủ',
  [FurnishingStatus.BASIC]: 'Nội thất cơ bản',
  [FurnishingStatus.EMPTY]: 'Không nội thất'
};

/** Tiện ích đi kèm tin đăng (điều hòa, nóng lạnh, thang máy...). */
export interface Amenity {
  id: string;
  name: string;
  icon?: string;
}

/** Thông tin người đăng tin (chủ nhà, môi giới...). */
export interface ListingAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  phone?: string;
  email?: string;
  /** Số tin đã đăng. */
  listingCount?: number;
  /** ISO 8601 — thời điểm hoạt động gần nhất, vd để hiển thị "Hoạt động 4 ngày trước". */
  lastActiveAt?: string;
  profileUrl?: string;
}

/** Tin đăng nhà ở (phòng trọ, căn hộ, nguyên căn, ở ghép). */
export interface Listing {
  id: string;
  title: string;
  description?: string;
  category: PropertyCategory;
  transaction: TransactionType;
  status: ListingStatus;
  /** Giá rao, đơn vị VND. */
  price: number;
  pricePerSquareMeter?: number;
  /** Diện tích, đơn vị m². */
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  floorCount?: number;
  direction?: Direction;
  furnishing?: FurnishingStatus;
  amenities?: Amenity[];
  images: string[];
  address?: AddressInfo;
  author?: ListingAuthor;
  tags?: string[];
  isFeatured?: boolean;
  /** ISO 8601 — thời điểm tin tự hết hạn. */
  expiresAt?: string;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

/** Tham số tìm kiếm/lọc tin đăng nhà ở. */
export interface SearchListingRequest extends BaseListRequest {
  keyword?: string;
  transaction?: TransactionType;
  category?: PropertyCategory;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
}

/** Payload tạo tin đăng mới. */
export interface CreateListingRequest {
  title: string;
  description?: string;
  category: PropertyCategory;
  transaction: TransactionType;
  price: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  floorCount?: number;
  direction?: Direction;
  furnishing?: FurnishingStatus;
  amenityIds?: string[];
  images: string[];
  address?: AddressInfo;
  expiresAt?: string;
}

/** Payload cập nhật tin đăng. */
export type UpdateListingRequest = Partial<CreateListingRequest> & {
  status?: ListingStatus;
};
