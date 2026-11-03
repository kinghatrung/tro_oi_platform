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
