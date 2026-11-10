import type { BaseListRequest, GeoPoint } from './common';
import type { ListingStatus, PropertyCategory, TransactionType } from './housing';
import type { ProductCategory, ProductStatus } from './marketplace';
import type { ReportStatus, ReportTargetType } from './report';
import type { User, UserRole } from './user';

/** Số bản ghi mới trong 1 ngày (giờ Việt Nam) — phần tử của AdminStats.daily. */
export interface AdminDailyActivity {
  /** YYYY-MM-DD. */
  date: string;
  users: number;
  listings: number;
  products: number;
}

/** GET /admin/stats. */
export interface AdminStats {
  users: {
    total: number;
    blocked: number;
    newLast7Days: number;
    byRole: Partial<Record<UserRole, number>>;
  };
  listings: {
    total: number;
    byStatus: Partial<Record<ListingStatus, number>>;
    byCategory: Partial<Record<PropertyCategory, number>>;
    /** Tỉnh có nhiều tin đang hiển thị nhất, nhiều → ít. */
    topCities: { city: string; count: number }[];
    /** Tổng lượt xem mọi tin. */
    views: number;
  };
  products: {
    total: number;
    byStatus: Partial<Record<ProductStatus, number>>;
    byCategory: Partial<Record<ProductCategory, number>>;
    views: number;
  };
  reports: { open: number };
  /** 90 ngày gần nhất, cũ → mới (ngày trống = 0). */
  daily: AdminDailyActivity[];
}

/** Người dùng trong trang quản trị — kèm số tin đã đăng. */
export interface AdminUser extends User {
  listingCount: number;
  productCount: number;
}

export interface AdminUserQuery extends BaseListRequest {
  keyword?: string;
  role?: UserRole;
  isBlocked?: boolean;
}

/** Body PATCH /admin/users/:id. */
export interface AdminUpdateUserRequest {
  role?: UserRole;
  isBlocked?: boolean;
}

export interface AdminListingQuery extends BaseListRequest {
  keyword?: string;
  status?: ListingStatus;
  category?: PropertyCategory;
  /** Tỉnh/thành, khớp chính xác. */
  city?: string;
  authorId?: string;
}

/** Một ghim trên bản đồ quản trị — GET /admin/listings/map. */
export interface ListingMapPoint {
  id: string;
  title: string;
  price: number;
  transaction: TransactionType;
  status: ListingStatus;
  category: PropertyCategory;
  city?: string;
  ward?: string;
  geo: GeoPoint;
}

export interface AdminProductQuery extends BaseListRequest {
  keyword?: string;
  status?: ProductStatus;
  category?: ProductCategory;
  sellerId?: string;
}

export interface AdminReportQuery extends BaseListRequest {
  status?: ReportStatus;
  targetType?: ReportTargetType;
}

/** Đối tượng của một dòng nhật ký admin. Trùng AUDIT_TARGET_TYPES bên api. */
export enum AuditTargetType {
  LISTING = 'listing',
  PRODUCT = 'product',
  USER = 'user',
  REPORT = 'report',
  SETTINGS = 'settings',
  /** targetId = người được đánh giá. */
  REVIEW = 'review',
  /** targetId = slug trang (cũng là URL). */
  PAGE = 'page',
}

export const AUDIT_TARGET_LABELS: Record<AuditTargetType, string> = {
  [AuditTargetType.LISTING]: 'Tin Trọ ơi',
  [AuditTargetType.PRODUCT]: 'Món đồ Chợ ơi',
  [AuditTargetType.USER]: 'Người dùng',
  [AuditTargetType.REPORT]: 'Báo cáo',
  [AuditTargetType.SETTINGS]: 'Thiết lập',
  [AuditTargetType.REVIEW]: 'Đánh giá',
  [AuditTargetType.PAGE]: 'Trang chính sách',
};

/** GET /admin/audit-logs. */
export interface AuditLog {
  id: string;
  /** Nhãn tiếng Việt: "Duyệt", "Khoá tài khoản"... */
  action: string;
  targetType: AuditTargetType;
  targetId?: string;
  /** Tên/tiêu đề lúc thao tác (còn giữ khi đối tượng đã bị xoá). */
  targetTitle?: string;
  actor: Pick<User, 'id' | 'name' | 'avatar' | 'role'> | null;
  /** ISO 8601. */
  createdAt: string;
}

export interface AuditLogQuery extends BaseListRequest {
  targetType?: AuditTargetType;
}
