import type { ApiResponse, BaseListRequest, NotificationPage } from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function getNotifications(params: BaseListRequest) {
  const res = (await axiosClient.get('/notifications', {
    params,
  })) as ApiResponse<NotificationPage>;
  return res.data;
}

export async function getUnreadNotificationCount() {
  const res = (await axiosClient.get('/notifications/unread-count')) as ApiResponse<{
    count: number;
  }>;
  return res.data.count;
}

export async function markNotificationRead(id: string) {
  await axiosClient.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await axiosClient.patch('/notifications/read-all');
}
