'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { App, Drawer, Flex, Grid, Layout, Spin, type BreadcrumbProps, type MenuProps } from 'antd';
import { UserRole } from '@tro-oi/shared';

import { AdminSidebar, AdminTopBar } from '@/components/admin';
import { useRequireUser } from '@/stores/useAuthStore';

import { ADMIN_BASE, ADMIN_MENU } from './const';

const SIDER_WIDTH = 256;
const SIDER_COLLAPSED_WIDTH = 72;

/** Mục menu đang mở: khớp dài nhất (vd /quan-tri/nguoi-dung thắng /quan-tri). */
const findActive = (pathname: string) =>
  ADMIN_MENU.filter(({ key }) => pathname === key || pathname.startsWith(`${key}/`)).sort(
    (a, b) => b.key.length - a.key.length,
  )[0] ?? ADMIN_MENU[0];

const MENU_ITEMS: MenuProps['items'] = ADMIN_MENU.map(({ key, label, icon }) => ({
  key,
  label,
  icon,
}));

/**
 * Khung quản trị toàn màn hình (theo cbs-fe): sidebar thu gọn/mở rộng ở desktop (≥ xl),
 * tablet/mobile thành Drawer. Chỉ admin — người khác bị đưa về trang chủ
 * (API /admin/* vẫn tự chặn bằng AdminGuard, kiểm tra ở đây chỉ để điều hướng).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const user = useRequireUser();
  const isAdmin = user?.role === UserRole.ADMIN;
  // useBreakpoint trả {} lúc SSR → coi là desktop cho tới khi đo được
  const isCompact = Grid.useBreakpoint().xl === false;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const active = findActive(pathname);

  const breadcrumb = useMemo<BreadcrumbProps['items']>(
    () =>
      active.key === ADMIN_BASE
        ? [{ title: active.label }]
        : [{ title: <Link href={ADMIN_BASE}>Quản trị</Link> }, { title: active.label }],
    [active],
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

  useEffect(() => {
    if (user && !isAdmin) {
      message.error('Bạn không có quyền truy cập trang quản trị');
      router.replace('/');
    }
  }, [isAdmin, message, router, user]);

  if (!isAdmin) {
    return (
      <Flex align="center" justify="center" className="h-dvh">
        <Spin size="large" />
      </Flex>
    );
  }

  const sidebar = (collapsed: boolean) => (
    <AdminSidebar
      homeHref={ADMIN_BASE}
      items={MENU_ITEMS}
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
