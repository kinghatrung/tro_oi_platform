import { Flag, LayoutDashboard, Settings, ShoppingBag, House, Users } from 'lucide-react';

export const ADMIN_BASE = '/quan-tri';

/** Menu sidebar quản trị — key = URL. */
export const ADMIN_MENU = [
  { key: ADMIN_BASE, label: 'Tổng quan', icon: <LayoutDashboard size={18} /> },
  { key: `${ADMIN_BASE}/nguoi-dung`, label: 'Người dùng', icon: <Users size={18} /> },
  { key: `${ADMIN_BASE}/tin-tro`, label: 'Tin Trọ ơi', icon: <House size={18} /> },
  { key: `${ADMIN_BASE}/tin-cho`, label: 'Tin Chợ ơi', icon: <ShoppingBag size={18} /> },
  { key: `${ADMIN_BASE}/bao-cao`, label: 'Báo cáo vi phạm', icon: <Flag size={18} /> },
  { key: `${ADMIN_BASE}/thiet-lap`, label: 'Thiết lập website', icon: <Settings size={18} /> },
];

export const ADMIN_PAGE_SIZE = 20;
