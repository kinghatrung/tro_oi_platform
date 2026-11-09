import type { BaseListRequest } from './common';
import type { ListingStatus, PropertyCategory } from './housing';
import type { ProductCategory, ProductStatus } from './marketplace';
import type { ReportStatus, ReportTargetType } from './report';
import type { User, UserRole } from './user';

/** GET /admin/stats. */
export interface AdminStats {
  users: { total: number; blocked: number; newLast7Days: number };
  listings: { total: number; byStatus: Partial<Record<ListingStatus, number>> };
  products: { total: number; byStatus: Partial<Record<ProductStatus, number>> };
  reports: { open: number };
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
  authorId?: string;
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
}

export const AUDIT_TARGET_LABELS: Record<AuditTargetType, string> = {
  [AuditTargetType.LISTING]: 'Tin Trọ ơi',
  [AuditTargetType.PRODUCT]: 'Món đồ Chợ ơi',
  [AuditTargetType.USER]: 'Người dùng',
  [AuditTargetType.REPORT]: 'Báo cáo',
  [AuditTargetType.SETTINGS]: 'Thiết lập',
  [AuditTargetType.REVIEW]: 'Đánh giá',
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
