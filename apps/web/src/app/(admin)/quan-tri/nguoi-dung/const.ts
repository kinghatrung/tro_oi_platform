import { USER_ROLE_LABELS, type UserRole } from '@tro-oi/shared';

export const ROLE_OPTIONS = (Object.entries(USER_ROLE_LABELS) as [UserRole, string][]).map(
  ([value, label]) => ({ value, label }),
);

export const BLOCK_OPTIONS = [
  { value: 'false', label: 'Đang hoạt động' },
  { value: 'true', label: 'Đã khoá' },
];
