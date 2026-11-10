'use client';

import { Avatar, Flex, Spin } from 'antd';
import { UserRound } from 'lucide-react';
import { USER_ROLE_LABELS } from '@tro-oi/shared';

import { DashboardShell } from '@/components/admin';
import { useRequireUser } from '@/stores/useAuthStore';

import { SELLER_BASE, SELLER_MENU } from './const';

/** Khung Kênh người đăng (DashboardShell) + thẻ người dùng đầu sidebar. Chưa đăng nhập → trang đăng nhập. */
export function SellerShell({ children }: { children: React.ReactNode }) {
  const user = useRequireUser();

  if (!user) {
    return (
      <Flex align="center" justify="center" className="h-dvh">
        <Spin size="large" />
      </Flex>
    );
  }

  return (
    <DashboardShell
      base={SELLER_BASE}
      title="Kênh người đăng"
      menu={SELLER_MENU}
      sidebarExtra={
        <div className="mx-3 mt-3 flex items-center gap-3 rounded-lg bg-brand-soft p-3">
          <Avatar size={40} src={user.avatar} icon={<UserRound size={20} />} className="shrink-0" />
          <div className="min-w-0">
            <p className="line-clamp-1 font-bold text-ink">{user.name}</p>
            <p className="text-xs text-body">{USER_ROLE_LABELS[user.role]}</p>
          </div>
        </div>
      }
    >
      {children}
    </DashboardShell>
  );
}
