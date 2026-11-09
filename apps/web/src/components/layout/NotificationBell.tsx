'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Badge, Button, Dropdown, Skeleton } from 'antd';
import { Bell } from 'lucide-react';
import type { AppNotification } from '@tro-oi/shared';

import { EmptyState, EmptyVariant, NotificationList } from '@/components/common';
import { useNotificationStore } from '@/stores/useNotificationStore';

const POLL_MS = 60_000;

/** Chuông thông báo trên Navbar (chỉ render khi đã đăng nhập): số chưa đọc + 6 thông báo mới nhất. */
export function NotificationBell() {
  const router = useRouter();
  const { message } = App.useApp();
  const [open, setOpen] = useState(false);
  const unread = useNotificationStore((state) => state.unread);
  const latest = useNotificationStore((state) => state.latest);

  // shortcut: hỏi số chưa đọc mỗi 60s — khi có WebSocket (chat-plan.md) thì server đẩy realtime
  useEffect(() => {
    const poll = () =>
      // Lỗi mạng tạm thời: bỏ qua, lượt sau hỏi lại (401 đã được axiosClient xử lý)
      void useNotificationStore
        .getState()
        .refreshUnread()
        .catch(() => undefined);
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const showError = (error: unknown) => message.error((error as Error).message);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) useNotificationStore.getState().loadLatest().catch(showError);
  };

  const handleItemClick = (notification: AppNotification) => {
    setOpen(false);
    useNotificationStore.getState().markRead(notification).catch(showError);
    if (notification.link) router.push(notification.link);
  };

  return (
    <Dropdown
      open={open}
      onOpenChange={handleOpenChange}
      trigger={['click']}
      placement="bottomRight"
      popupRender={() => (
        <div className="w-95 overflow-hidden rounded-lg border border-line bg-surface shadow-md">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="text-base font-bold text-ink">Thông báo</span>
            <Button
              type="link"
              size="small"
              disabled={unread === 0}
              onClick={() => useNotificationStore.getState().markAllRead().catch(showError)}
            >
              Đánh dấu đã đọc
            </Button>
          </div>
          <div className="max-h-105 overflow-y-auto p-2">
            {latest === null ? (
              <Skeleton active paragraph={{ rows: 3 }} className="p-2" />
            ) : latest.length === 0 ? (
              <EmptyState
                size="small"
                variant={EmptyVariant.CHAT}
                description="Chưa có thông báo nào"
              />
            ) : (
              <NotificationList items={latest} onItemClick={handleItemClick} />
            )}
          </div>
          <Link
            href="/thong-bao"
            onClick={() => setOpen(false)}
            className="block border-t border-line py-3 text-center font-semibold text-brand!"
          >
            Xem tất cả
          </Link>
        </div>
      )}
    >
      <Badge count={unread} size="small" offset={[-4, 4]}>
        <Button
          aria-label={unread > 0 ? `Thông báo (${unread} chưa đọc)` : 'Thông báo'}
          icon={<Bell size={20} />}
        />
      </Badge>
    </Dropdown>
  );
}
