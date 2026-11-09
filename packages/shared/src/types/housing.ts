import type { AddressInfo, BaseListRequest } from './common';
import type { UserRole } from './user';

/** Nhóm loại hình nhà ở/tin đăng. Giá trị trùng với slug route trên FE. */
export enum PropertyCategory {
  ROOM = 'phong-tro',
  APARTMENT = 'can-ho',
  WHOLE_HOUSE = 'nguyen-can',
  ROOMMATE = 'o-ghep',
}

/** Nhãn hiển thị tiếng Việt cho PropertyCategory. */
export const PROPERTY_CATEGORY_LABELS: Record<PropertyCategory, string> = {
  [PropertyCategory.ROOM]: 'Phòng trọ',
  [PropertyCategory.APARTMENT]: 'Căn hộ',
  [PropertyCategory.WHOLE_HOUSE]: 'Nguyên căn',
  [PropertyCategory.ROOMMATE]: 'Tìm người ở ghép',
};

/** Hình thức giao dịch của tin đăng. */
export enum TransactionType {
  RENT = 'rent-room',
  BUY = 'buy-room',
}

/** Nhãn hiển thị tiếng Việt cho TransactionType. */
export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  [TransactionType.RENT]: 'Cho thuê',
  [TransactionType.BUY]: 'Mua bán',
};

/** Trạng thái tin đăng. */
export enum ListingStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CLOSED = 'closed',
}

/** Nhãn hiển thị tiếng Việt cho ListingStatus. */
export const LISTING_STATUS_LABELS: Record<ListingStatus, string> = {
  [ListingStatus.DRAFT]: 'Nháp',
  [ListingStatus.PENDING]: 'Chờ duyệt',
  [ListingStatus.ACTIVE]: 'Đang hiển thị',
  [ListingStatus.EXPIRED]: 'Hết hạn',
  [ListingStatus.CLOSED]: 'Đã ẩn',
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
  SOUTH_WEST = 'south-west',
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
  [Direction.SOUTH_WEST]: 'Tây Nam',
};

/** Tình trạng nội thất. */
export enum FurnishingStatus {
  FULL = 'full',
  BASIC = 'basic',
  EMPTY = 'empty',
}

/** Nhãn hiển thị tiếng Việt cho FurnishingStatus. */
export const FURNISHING_STATUS_LABELS: Record<FurnishingStatus, string> = {
  [FurnishingStatus.FULL]: 'Nội thất đầy đủ',
  [FurnishingStatus.BASIC]: 'Nội thất cơ bản',
  [FurnishingStatus.EMPTY]: 'Không nội thất',
};

/** Tiện ích đi kèm tin đăng. Trùng AMENITIES bên api (listing.schema.ts). */
export enum Amenity {
  WIFI = 'wifi',
  AIR_CONDITIONER = 'air-conditioner',
  WATER_HEATER = 'water-heater',
  WASHING_MACHINE = 'washing-machine',
  FRIDGE = 'fridge',
  KITCHEN = 'kitchen',
  PRIVATE_WC = 'private-wc',
  BALCONY = 'balcony',
  ELEVATOR = 'elevator',
  PARKING = 'parking',
  SECURITY = 'security',
  FREE_HOURS = 'free-hours',
  PETS = 'pets',
}

export const AMENITY_LABELS: Record<Amenity, string> = {
  [Amenity.WIFI]: 'Wifi',
  [Amenity.AIR_CONDITIONER]: 'Điều hoà',
  [Amenity.WATER_HEATER]: 'Nóng lạnh',
  [Amenity.WASHING_MACHINE]: 'Máy giặt',
  [Amenity.FRIDGE]: 'Tủ lạnh',
  [Amenity.KITCHEN]: 'Bếp nấu ăn',
  [Amenity.PRIVATE_WC]: 'WC khép kín',
  [Amenity.BALCONY]: 'Ban công',
  [Amenity.ELEVATOR]: 'Thang máy',
  [Amenity.PARKING]: 'Chỗ để xe',
  [Amenity.SECURITY]: 'Camera / bảo vệ',
  [Amenity.FREE_HOURS]: 'Giờ giấc tự do',
  [Amenity.PETS]: 'Cho nuôi thú cưng',
};

/** Thông tin người đăng tin (chủ nhà, môi giới...). */
export interface ListingAuthor {
  id: string;
  name: string;
  avatar?: string;
  role?: UserRole;
  phone?: string;
  email?: string;
  /** Số tin đang hiển thị — chỉ có ở GET /listings/:id. */
  listingCount?: number;
  /** ISO 8601 — thời điểm tạo tài khoản. */
  joinedAt?: string;
}

/** Tin đăng nhà ở (phòng trọ, căn hộ, nguyên căn, ở ghép). */
export interface Listing {
  id: string;
  title: string;
  description?: string;
  /** Link YouTube. */
  videoUrl?: string;
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
  /** Lượt xem trang chi tiết. */
  viewCount?: number;
  /** Số người đã lưu — chỉ có ở GET /listings/mine (Kênh người đăng). */
  favoriteCount?: number;
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
  /** Tin phải có đủ mọi tiện ích này. Gửi dạng "wifi,parking". */
  amenities?: Amenity[];
  authorId?: string;
  /** Loại 1 tin khỏi kết quả (dùng cho "tin tương tự"). */
  excludeId?: string;
  sortBy?: ListingSortField;
}

/** Field được phép sắp xếp khi tìm kiếm tin. */
export type ListingSortField = 'createdAt' | 'price' | 'area';

/** Một dòng thống kê GET /listings/stats. */
export interface ListingStat {
  transaction: TransactionType;
  category: PropertyCategory;
  city: string;
  count: number;
  /** Ảnh đầu tiên của tin mới nhất trong nhóm. */
  image?: string;
}

/** Payload tạo tin đăng mới. */
export interface CreateListingRequest {
  title: string;
  description?: string;
  /** Link YouTube; "" = gỡ video khi sửa. */
  videoUrl?: string;
  category: PropertyCategory;
  transaction: TransactionType;
  price: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  floorCount?: number;
  direction?: Direction;
  furnishing?: FurnishingStatus;
  amenities?: Amenity[];
  images: string[];
  address: AddressInfo;
}

/** Payload cập nhật tin đăng. */
export type UpdateListingRequest = Partial<CreateListingRequest> & {
  status?: ListingStatus;
};
