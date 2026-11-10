import type { PagedResponse } from './api';

/** Kiểu thông báo → icon/màu. Trùng NOTIFICATION_KINDS bên api. */
export enum NotificationKind {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message?: string;
  /** Đường dẫn nội bộ của web. */
  link?: string;
  read: boolean;
  /** ISO 8601. */
  createdAt: string;
}

/** GET /notifications: trang thông báo + số chưa đọc. */
export interface NotificationPage extends PagedResponse<AppNotification> {
  unread: number;
}

/** Kênh nhận thông báo của tài khoản — GET/PATCH /notifications/preferences. */
export interface NotificationPreferences {
  /** Thông báo đẩy (trình duyệt nào nhận do người dùng bật trên từng trình duyệt). */
  push: boolean;
  email: boolean;
  /** Mặc định tắt (tốn phí). */
  sms: boolean;
  /** Tài khoản đã có email (cần cho kênh email). */
  hasEmail: boolean;
  /** Kênh máy chủ đã cấu hình — false thì web ẩn công tắc. */
  channels: { push: boolean; email: boolean; sms: boolean };
}

export type UpdateNotificationPreferencesRequest = Partial<
  Pick<NotificationPreferences, 'push' | 'email' | 'sms'>
>;
