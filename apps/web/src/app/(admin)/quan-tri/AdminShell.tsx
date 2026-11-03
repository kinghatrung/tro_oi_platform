'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { App, Avatar, Button, Flex, Layout, Menu, Spin, type MenuProps } from 'antd';
import { ArrowLeft, UserRound } from 'lucide-react';
import { UserRole } from '@tro-oi/shared';

import { useSiteSettings } from '@/app/providers';
import { ThemeToggle } from '@/components/common';
import { useRequireUser } from '@/stores/useAuthStore';

import { ADMIN_BASE, ADMIN_MENU } from './const';

/** Mục menu đang mở: khớp dài nhất (vd /quan-tri/nguoi-dung thắng /quan-tri). */
const activeKey = (pathname: string) =>
  ADMIN_MENU.map(({ key }) => key)
    .filter((key) => pathname === key || pathname.startsWith(`${key}/`))
    .sort((a, b) => b.length - a.length)[0] ?? ADMIN_BASE;

/**
 * Khung trang quản trị: sidebar + header. Chỉ admin — người khác bị đưa về trang chủ.
 * API /admin/* vẫn tự chặn bằng AdminGuard, kiểm tra ở đây chỉ để điều hướng.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const settings = useSiteSettings();
  const user = useRequireUser();
  const isAdmin = user?.role === UserRole.ADMIN;
  const menuItems = useMemo<MenuProps['items']>(
    () => ADMIN_MENU.map(({ key, label, icon }) => ({ key, label, icon })),
    [],
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

  return (
    <Layout className="min-h-dvh">
      <Layout.Sider
        breakpoint="lg"
        collapsedWidth={0}
        width={240}
        theme="light"
        className="border-r border-line"
      >
        <Link href={ADMIN_BASE} className="flex items-center gap-2 px-5 py-4">
          <Image
            src={settings.logoUrl}
            alt={settings.siteName}
            width={80}
            height={20}
          />
          <span className="text-sm font-bold text-ink">Quản trị</span>
        </Link>
        <Menu
          mode="inline"
          className="border-e-0!"
          items={menuItems}
          selectedKeys={[activeKey(pathname)]}
          onClick={({ key }) => router.push(key)}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header className="flex! items-center justify-between border-b border-line bg-surface! px-6!">
          <Link href="/">
            <Button type="text" icon={<ArrowLeft size={16} />}>
              Về {settings.siteName}
            </Button>
          </Link>
          <Flex align="center" gap={12}>
            <ThemeToggle />
            <Avatar size={32} src={user.avatar} icon={<UserRound size={16} />} />
            <span className="font-semibold text-ink">{user.name}</span>
          </Flex>
        </Layout.Header>
        <Layout.Content className="bg-page p-6">{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
