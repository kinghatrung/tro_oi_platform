import { create } from 'zustand';
import type { AppNotification } from '@tro-oi/shared';

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications';

const LATEST_SIZE = 6;

interface NotificationState {
  unread: number;
  /** Thông báo mới nhất cho dropdown chuông (null = chưa tải). */
  latest: AppNotification[] | null;
  refreshUnread: () => Promise<void>;
  loadLatest: () => Promise<void>;
  /** Đánh dấu đã đọc (optimistic, trừ số chưa đọc). Dùng chung cho chuông và trang /thong-bao. */
  markRead: (notification: AppNotification) => Promise<void>;
  markAllRead: () => Promise<void>;
  setUnread: (unread: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unread: 0,
  latest: null,

  refreshUnread: async () => {
    set({ unread: await getUnreadNotificationCount() });
  },

  loadLatest: async () => {
    const page = await getNotifications({ page: 1, pageSize: LATEST_SIZE });
    set({ latest: page.items, unread: page.unread });
  },

  markRead: async (notification) => {
    if (notification.read) return;
    const { unread, latest } = get();
    set({
      unread: Math.max(0, unread - 1),
      latest: latest?.map((item) => (item.id === notification.id ? { ...item, read: true } : item)),
    });
    await markNotificationRead(notification.id);
  },

  markAllRead: async () => {
    const previous = get();
    set({
      unread: 0,
      latest: previous.latest?.map((item) => ({ ...item, read: true })),
    });
    try {
      await markAllNotificationsRead();
    } catch (error) {
      set({ unread: previous.unread, latest: previous.latest });
      throw error;
    }
  },

  setUnread: (unread) => set({ unread }),
}));
