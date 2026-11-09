import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, type Types } from 'mongoose';

import {
  Notification,
  type NotificationDocument,
  type NotificationKind,
} from './notification.schema.js';

export interface NotificationInput {
  kind: NotificationKind;
  title: string;
  message?: string;
  link?: string;
}

const toNotification = (doc: NotificationDocument) => ({
  id: doc.id as string,
  kind: doc.kind,
  title: doc.title,
  message: doc.message,
  link: doc.link,
  read: doc.read,
  createdAt: doc.createdAt.toISOString(),
});

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
  ) {}

  /** Gửi thông báo; lỗi chỉ ghi log — không làm hỏng thao tác chính (duyệt tin, hết hạn...). */
  async notify(
    items: { user: Types.ObjectId | string; input: NotificationInput }[],
  ) {
    if (items.length === 0) return;
    try {
      await this.notificationModel.insertMany(
        items.map(({ user, input }) => ({ user, ...input })),
      );
    } catch (error) {
      this.logger.warn(`Không gửi được thông báo: ${(error as Error).message}`);
    }
  }

  async list(userId: string, page: number, pageSize: number) {
    const [docs, total, unread] = await Promise.all([
      this.notificationModel
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .exec(),
      this.notificationModel.countDocuments({ user: userId }).exec(),
      this.unreadCount(userId),
    ]);
    return { items: docs.map(toNotification), total, page, pageSize, unread };
  }

  unreadCount(userId: string) {
    return this.notificationModel
      .countDocuments({ user: userId, read: false })
      .exec();
  }

  /** Chỉ đánh dấu được thông báo của chính mình; id lạ → bỏ qua. */
  async markRead(userId: string, id: string) {
    if (isValidObjectId(id)) {
      await this.notificationModel
        .updateOne({ _id: id, user: userId }, { read: true })
        .exec();
    }
    return null;
  }

  async markAllRead(userId: string) {
    await this.notificationModel
      .updateMany({ user: userId, read: false }, { read: true })
      .exec();
    return null;
  }
}
