import { FilePlus2, LayoutDashboard, ListChecks, UserRound } from 'lucide-react';
import { ListingStatus } from '@tro-oi/shared';

export const SELLER_BASE = '/kenh-nguoi-dang';

/** Menu sidebar Kênh người đăng — key = URL. */
export const SELLER_MENU = [
  { key: SELLER_BASE, label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
  { key: `${SELLER_BASE}/tin-dang`, label: 'Quản lý tin', icon: <ListChecks size={18} /> },
  { key: '/dang-tin', label: 'Đăng tin mới', icon: <FilePlus2 size={18} /> },
  { key: '/ca-nhan', label: 'Trang cá nhân', icon: <UserRound size={18} /> },
];

/** Màu Tag (preset AntD) theo trạng thái tin. */
export const STATUS_TAG_COLORS: Record<ListingStatus, string> = {
  [ListingStatus.ACTIVE]: 'success',
  [ListingStatus.PENDING]: 'processing',
  [ListingStatus.DRAFT]: 'default',
  [ListingStatus.EXPIRED]: 'warning',
  [ListingStatus.CLOSED]: 'default',
};
