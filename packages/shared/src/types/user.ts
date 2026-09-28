/** Vai trò của người dùng trong hệ thống. */
export enum UserRole {
  RENTER = 'renter',
  LANDLORD = 'landlord',
  AGENT = 'agent',
  ADMIN = 'admin'
}

/** Nhãn hiển thị tiếng Việt cho UserRole. */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.RENTER]: 'Người thuê',
  [UserRole.LANDLORD]: 'Chủ nhà',
  [UserRole.AGENT]: 'Môi giới',
  [UserRole.ADMIN]: 'Quản trị viên'
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  role: UserRole;
  /** ISO 8601 — luôn là string, không dùng Date. */
  createdAt: string;
  /** ISO 8601 — luôn là string, không dùng Date. */
  updatedAt: string;
}
