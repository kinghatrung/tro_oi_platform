'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Badge, Button, Dropdown, Skeleton } from 'antd';
import { Bell } from 'lucide-react';
import type { AppNotification } from '@tro-oi/shared';

import { EmptyState, EmptyVariant, NotificationList } from '@/components/common';
import { getChatSocket } from '@/lib/socket';
import { useNotificationStore } from '@/stores/useNotificationStore';

/** Dự phòng khi socket mất kết nối lâu (thông báo chính đi qua "notification:new"). */
const POLL_MS = 5 * 60_000;

/** Chuông thông báo trên Navbar (chỉ render khi đã đăng nhập): số chưa đọc + 6 thông báo mới nhất. */
export function NotificationBell() {
  const router = useRouter();
  const { message, notification: toast } = App.useApp();
  const [open, setOpen] = useState(false);
  const unread = useNotificationStore((state) => state.unread);
  const latest = useNotificationStore((state) => state.latest);

  // Realtime qua socket /chat (MessagesButton mở kết nối); kết nối lại → hỏi lại số chưa đọc
  useEffect(() => {
    const refresh = () =>
      // Lỗi mạng tạm thời: bỏ qua, lượt sau hỏi lại (401 đã được axiosClient xử lý)
      void useNotificationStore
        .getState()
        .refreshUnread()
        .catch(() => undefined);
    const onNew = (item: AppNotification) => {
      useNotificationStore.getState().receive(item);
      toast.info({
        title: item.title,
        description: item.message,
        placement: 'bottomRight',
        onClick: () => {
          useNotificationStore
            .getState()
            .markRead(item)
            .catch(() => undefined);
          if (item.link) router.push(item.link);
        },
        className: item.link ? 'cursor-pointer' : undefined,
      });
    };
    const socket = getChatSocket();
    refresh();
    socket.on('notification:new', onNew);
    socket.on('connect', refresh);
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      socket.off('notification:new', onNew);
      socket.off('connect', refresh);
      clearInterval(timer);
    };
  }, [router, toast]);

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
