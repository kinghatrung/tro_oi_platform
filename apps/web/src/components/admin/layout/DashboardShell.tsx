'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Drawer, Grid, Layout, type BreadcrumbProps, type MenuProps } from 'antd';

import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';

const SIDER_WIDTH = 256;
const SIDER_COLLAPSED_WIDTH = 72;

export interface DashboardMenuItem {
  /** URL của trang. */
  key: string;
  label: string;
  icon: ReactNode;
}

interface DashboardShellProps {
  /** URL trang gốc của khu (logo + breadcrumb trỏ về đây). */
  base: string;
  /** Tên khu: nhãn cạnh logo + mục đầu breadcrumb. */
  title: string;
  menu: DashboardMenuItem[];
  /** Nội dung giữa logo và menu, vd thẻ người dùng. */
  sidebarExtra?: ReactNode;
  children: ReactNode;
}

/**
 * Khung toàn màn hình (Quản trị, Kênh người đăng): sidebar thu gọn/mở rộng ở desktop (≥ xl),
 * tablet/mobile thành Drawer; header có breadcrumb, sáng/tối, tài khoản.
 */
export function DashboardShell({ base, title, menu, sidebarExtra, children }: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  // useBreakpoint trả {} lúc SSR → coi là desktop cho tới khi đo được
  const isCompact = Grid.useBreakpoint().xl === false;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Mục đang mở: khớp dài nhất (vd /quan-tri/nguoi-dung thắng /quan-tri)
  const active =
    menu
      .filter(({ key }) => pathname === key || pathname.startsWith(`${key}/`))
      .sort((a, b) => b.key.length - a.key.length)[0] ?? menu[0];
  const menuItems = useMemo<MenuProps['items']>(
    () => menu.map(({ key, label, icon }) => ({ key, label, icon })),
    [menu],
  );
  const breadcrumb = useMemo<BreadcrumbProps['items']>(
    () =>
      active.key === base
        ? [{ title: active.label }]
        : [{ title: <Link href={base}>{title}</Link> }, { title: active.label }],
    [active, base, title],
  );

  const handleToggle = useCallback(() => {
    if (isCompact) setDrawerOpen(true);
    else setSidebarOpen((open) => !open);
  }, [isCompact]);

  const handleNavigate = useCallback(
    (key: string) => {
      setDrawerOpen(false);
      router.push(key);
    },
    [router],
  );

  const sidebar = (collapsed: boolean) => (
    <AdminSidebar
      homeHref={base}
      badge={title}
      extra={sidebarExtra}
      items={menuItems}
      selectedKey={active.key}
      collapsed={collapsed}
      onNavigate={handleNavigate}
    />
  );

  return (
    // fixed inset-0: chiếm trọn màn hình, che luôn thanh thông báo công khai của layout gốc
    <Layout className="fixed! inset-0 z-10 flex-row! overflow-hidden">
      {isCompact ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          size={SIDER_WIDTH}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          {sidebar(false)}
        </Drawer>
      ) : (
        <Layout.Sider
          width={SIDER_WIDTH}
          collapsedWidth={SIDER_COLLAPSED_WIDTH}
          collapsed={!sidebarOpen}
          trigger={null}
          collapsible
          theme="light"
          className="h-full border-e border-line"
        >
          {sidebar(!sidebarOpen)}
        </Layout.Sider>
      )}
      <Layout className="min-w-0 flex-1">
        <AdminTopBar
          isCompact={isCompact}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggle}
          breadcrumb={breadcrumb}
        />
        <Layout.Content className="min-h-0 flex-1 overflow-y-auto bg-page p-3 sm:p-4">
          {children}
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
