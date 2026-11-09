'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Menu, type MenuProps } from 'antd';

import { useSiteSettings } from '@/app/providers';

interface AdminSidebarProps {
  homeHref: string;
  items: MenuProps['items'];
  selectedKey: string;
  /** Thu gọn: chỉ còn icon, logo thay bằng favicon. */
  collapsed: boolean;
  onNavigate: (key: string) => void;
}

/** Nội dung sidebar quản trị — dùng chung cho Sider (desktop) và Drawer (tablet/mobile). */
export function AdminSidebar({
  homeHref,
  items,
  selectedKey,
  collapsed,
  onNavigate,
}: AdminSidebarProps) {
  const settings = useSiteSettings();

  return (
    <div className="flex h-full flex-col bg-surface">
      <Link
        href={homeHref}
        className={`flex h-14 shrink-0 items-center gap-2 border-b border-line ${collapsed ? 'justify-center' : 'px-5'}`}
      >
        {collapsed ? (
          <Image
            src={settings.faviconUrl}
            alt={settings.siteName}
            width={28}
            height={28}
            loading="eager"
          />
        ) : (
          <>
            <Image
              src={settings.logoUrl}
              alt={settings.siteName}
              width={88}
              height={22}
              loading="eager"
            />
            <span className="rounded bg-brand-soft px-1.5 py-0.5 text-xs font-semibold text-brand">
              Quản trị
            </span>
          </>
        )}
      </Link>
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto py-2">
        <Menu
          // Trong Layout.Sider, Menu tự thu gọn theo `collapsed` của Sider
          mode="inline"
          className="border-e-0! bg-transparent!"
          items={items}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => onNavigate(key)}
        />
      </div>
    </div>
  );
}
