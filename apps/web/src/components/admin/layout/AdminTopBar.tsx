'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Avatar,
  Breadcrumb,
  Button,
  Dropdown,
  Tooltip,
  type BreadcrumbProps,
  type MenuProps,
} from 'antd';
import {
  ExternalLink,
  LogOut,
  Menu as MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  UserRound,
} from 'lucide-react';

import { ThemeToggle } from '@/components/common';
import { useAuthStore } from '@/stores/useAuthStore';

interface AdminTopBarProps {
  /** Màn nhỏ: sidebar là Drawer → nút mở drawer thay cho nút thu gọn. */
  isCompact: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  breadcrumb: BreadcrumbProps['items'];
}

const USER_MENU: MenuProps['items'] = [
  { key: '/ca-nhan', label: 'Trang cá nhân', icon: <UserRound size={16} /> },
  { type: 'divider' },
  { key: 'logout', label: 'Đăng xuất', icon: <LogOut size={16} />, danger: true },
];

/** Header quản trị: nút thu gọn/mở sidebar + breadcrumb | xem website, sáng/tối, tài khoản. */
export function AdminTopBar({
  isCompact,
  sidebarOpen,
  onToggleSidebar,
  breadcrumb,
}: AdminTopBarProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const toggleLabel = isCompact ? 'Mở menu' : sidebarOpen ? 'Thu gọn menu' : 'Mở rộng menu';
  const ToggleIcon = isCompact ? MenuIcon : sidebarOpen ? PanelLeftClose : PanelLeftOpen;

  const handleUserMenu: MenuProps['onClick'] = ({ key }) => {
    if (key !== 'logout') return router.push(key);
    useAuthStore.getState().logout();
    // reload toàn trang: xoá state client (giống Navbar)
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- cố ý tải lại toàn trang
    window.location.assign('/');
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-surface px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="text"
          icon={<ToggleIcon size={20} />}
          aria-label={toggleLabel}
          title={toggleLabel}
          onClick={onToggleSidebar}
          className="h-10! w-10!"
        />
        <Breadcrumb items={breadcrumb} className="truncate" />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Tooltip title="Xem website">
          <Link href="/" target="_blank">
            <Button type="text" icon={<ExternalLink size={18} />} aria-label="Xem website" />
          </Link>
        </Tooltip>
        <ThemeToggle />
        <div className="mx-1 h-6 w-px bg-line" />
        <Dropdown
          menu={{ items: USER_MENU, onClick: handleUserMenu }}
          trigger={['click']}
          placement="bottomRight"
        >
          <button
            type="button"
            className="flex cursor-pointer items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-soft"
          >
            <Avatar size={32} src={user?.avatar} icon={<UserRound size={16} />} />
            <span className="hidden max-w-40 truncate font-semibold text-ink md:inline">
              {user?.name}
            </span>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}
