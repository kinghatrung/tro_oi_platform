'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App, Flex, Spin } from 'antd';
import { UserRole } from '@tro-oi/shared';

import { DashboardShell } from '@/components/admin';
import { useRequireUser } from '@/stores/useAuthStore';

import { ADMIN_BASE, ADMIN_MENU } from './const';

/**
 * Khung quản trị toàn màn hình (DashboardShell). Chỉ admin — người khác bị đưa về trang chủ
 * (API /admin/* vẫn tự chặn bằng AdminGuard, kiểm tra ở đây chỉ để điều hướng).
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { message } = App.useApp();
  const user = useRequireUser();
  const isAdmin = user?.role === UserRole.ADMIN;

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
    <DashboardShell base={ADMIN_BASE} title="Quản trị" menu={ADMIN_MENU}>
      {children}
    </DashboardShell>
  );
}
