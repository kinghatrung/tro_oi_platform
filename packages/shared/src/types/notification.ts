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
