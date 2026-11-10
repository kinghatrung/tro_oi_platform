import type {
  ApiResponse,
  BaseListRequest,
  NotificationPage,
  NotificationPreferences,
  UpdateNotificationPreferencesRequest,
} from '@tro-oi/shared';

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

export async function getNotificationPreferences() {
  const res = (await axiosClient.get(
    '/notifications/preferences',
  )) as ApiResponse<NotificationPreferences>;
  return res.data;
}

export async function updateNotificationPreferences(body: UpdateNotificationPreferencesRequest) {
  const res = (await axiosClient.patch(
    '/notifications/preferences',
    body,
  )) as ApiResponse<NotificationPreferences>;
  return res.data;
}

/** Trình duyệt này bật thông báo đẩy (token FCM). */
export async function addPushToken(token: string) {
  await axiosClient.put('/notifications/push-tokens', { token });
}

export async function removePushToken(token: string) {
  await axiosClient.delete('/notifications/push-tokens', { data: { token } });
}
