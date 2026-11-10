'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { App, Button, Card, Pagination, Skeleton } from 'antd';
import type { AppNotification, NotificationPage } from '@tro-oi/shared';

import { getNotifications } from '@/api/notifications';
import { EmptyState, EmptyVariant, NotificationList } from '@/components/common';
import { getChatSocket } from '@/lib/socket';
import { useRequireUser } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';

import { NotificationSettings } from './NotificationSettings';

const PAGE_SIZE = 20;

/** Tất cả thông báo của tôi (giữ 90 ngày), phân trang phía server. */
export default function NotificationsPage() {
  const user = useRequireUser();
  const router = useRouter();
  const { message } = App.useApp();
  const unread = useNotificationStore((state) => state.unread);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<NotificationPage | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getNotifications({ page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        useNotificationStore.getState().setUnread(result.unread);
      })
      .catch((error: Error) => message.error(error.message));
    return () => {
      cancelled = true;
    };
  }, [message, page, user]);

  // Thông báo mới qua socket → chèn đầu danh sách khi đang xem trang 1
  useEffect(() => {
    if (page !== 1) return;
    const socket = getChatSocket();
    const onNew = (item: AppNotification) =>
      setData(
        (current) =>
          current && {
            ...current,
            total: current.total + 1,
            items: [item, ...current.items.filter((old) => old.id !== item.id)].slice(0, PAGE_SIZE),
          },
      );
    socket.on('notification:new', onNew);
    return () => {
      socket.off('notification:new', onNew);
    };
  }, [page]);

  const markLocal = (read: (item: AppNotification) => boolean) =>
    setData(
      (current) =>
        current && {
          ...current,
          items: current.items.map((item) => (read(item) ? { ...item, read: true } : item)),
        },
    );

  const handleItemClick = (notification: AppNotification) => {
    markLocal((item) => item.id === notification.id);
    useNotificationStore
      .getState()
      .markRead(notification)
      .catch((error: Error) => message.error(error.message));
    if (notification.link) router.push(notification.link);
  };

  const handleMarkAll = async () => {
    try {
      await useNotificationStore.getState().markAllRead();
      markLocal(() => true);
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  return (
    <Card variant="borderless">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-primary">Thông báo</h1>
        <Button disabled={unread === 0} onClick={handleMarkAll}>
          Đánh dấu tất cả đã đọc
        </Button>
      </div>

      <NotificationSettings />

      {!data ? (
        <Skeleton active />
      ) : data.items.length === 0 ? (
        <EmptyState
          variant={EmptyVariant.CHAT}
          description="Chưa có thông báo nào. Khi tin của bạn được duyệt, sắp hết hạn... bạn sẽ nhận thông báo ở đây."
        />
      ) : (
        <>
          <NotificationList items={data.items} onItemClick={handleItemClick} />
          {data.total > PAGE_SIZE && (
            <Pagination
              className="mt-4! justify-center!"
              current={page}
              pageSize={PAGE_SIZE}
              total={data.total}
              showSizeChanger={false}
              onChange={setPage}
            />
          )}
        </>
      )}
    </Card>
  );
}
