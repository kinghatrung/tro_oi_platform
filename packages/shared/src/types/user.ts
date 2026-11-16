/** Vai trò của người dùng trong hệ thống. */
export enum UserRole {
  RENTER = 'renter',
  LANDLORD = 'landlord',
  AGENT = 'agent',
  ADMIN = 'admin',
}

/** Nhãn hiển thị tiếng Việt cho UserRole. */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.RENTER]: 'Người thuê',
  [UserRole.LANDLORD]: 'Chủ nhà',
  [UserRole.AGENT]: 'Môi giới',
  [UserRole.ADMIN]: 'Quản trị viên',
};

export interface User {
  id: string;
  name: string;
  email?: string;
  /** Ẩn ở hồ sơ công khai (GET /users/:id). */
  phone?: string;
  /**
   * Google / Facebook đã liên kết (đăng nhập được bằng cách đó). 'social' = tài khoản cũ chưa ghi
   * nhà cung cấp. Chỉ có ở /users/me, /auth/*, admin.
   */
  socialProvider?: 'google.com' | 'facebook.com' | 'social';
  bio?: string;
  avatar?: string;
  /** Ảnh bìa hồ sơ (không có → dải màu mặc định). */
  coverImage?: string;
  role: UserRole;
  /** Bị admin khoá: không đăng nhập/thao tác được. */
  isBlocked?: boolean;
  /** ISO 8601 — luôn là string, không dùng Date. */
  createdAt: string;
  /** ISO 8601 — luôn là string, không dùng Date. */
  updatedAt: string;
}

/** Body PATCH /users/me. */
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  /** "" = gỡ ảnh bìa. */
  coverImage?: string;
}

/** Bộ lọc /tim-kiem đã lưu (GET /users/me/saved-searches). */
export interface SavedSearch {
  id: string;
  /** Query string của /tim-kiem, không có page. Link: `/tim-kiem?${query}`. */
  query: string;
  title: string;
  /** ISO 8601. */
  createdAt: string;
}

export interface CreateSavedSearchRequest {
  query: string;
  title: string;
}
