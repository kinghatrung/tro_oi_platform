import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, type Types } from 'mongoose';

import { User, type UserDocument } from '../auth/schemas/user.schema.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import { MailService } from './channels/mail.service.js';
import { PushService, type PushMessage } from './channels/push.service.js';
import { SmsService } from './channels/sms.service.js';
import type { UpdateNotifyPrefsDto } from './notification.dto.js';
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

/** Số trình duyệt / thiết bị nhận push tối đa mỗi tài khoản (cũ nhất bị bỏ). */
export const PUSH_TOKEN_LIMIT = 10;

const toNotification = (doc: NotificationDocument) => ({
  id: doc.id as string,
  kind: doc.kind,
  title: doc.title,
  message: doc.message,
  link: doc.link,
  read: doc.read,
  createdAt: doc.createdAt.toISOString(),
});

/** Mặc định: bật push + email (khi có email), tắt SMS (tốn phí). */
export const prefsOf = (user?: Pick<UserDocument, 'notifyPrefs'> | null) => ({
  push: user?.notifyPrefs?.push ?? true,
  email: user?.notifyPrefs?.email ?? true,
  sms: user?.notifyPrefs?.sms ?? false,
});

type Recipient = Pick<
  UserDocument,
  'id' | 'phone' | 'email' | 'pushTokens' | 'notifyPrefs'
>;
const RECIPIENT_FIELDS = 'phone email pushTokens notifyPrefs';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  /** Gốc link trong email (origin đầu tiên của WEB_ORIGIN). */
  private readonly webUrl: string;

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly realtime: RealtimeService,
    private readonly pushService: PushService,
    private readonly mailService: MailService,
    private readonly smsService: SmsService,
    config: ConfigService,
  ) {
    this.webUrl = (config.get<string>('WEB_ORIGIN') ?? 'http://localhost:3001')
      .split(',')[0]
      .trim()
      .replace(/\/$/, '');
  }

  /**
   * Lưu thông báo rồi gửi qua các kênh (realtime, push, email, SMS) ở nền.
   * Lỗi chỉ ghi log — không làm hỏng thao tác chính (duyệt tin, hết hạn...).
   */
  async notify(
    items: { user: Types.ObjectId | string; input: NotificationInput }[],
  ) {
    if (items.length === 0) return;
    try {
      const docs = await this.notificationModel.insertMany(
        items.map(({ user, input }) => ({ user, ...input })),
      );
      // insertMany giữ kiểu đầu vào của `user` (string | ObjectId); Mongoose đã ép về ObjectId khi lưu
      void this.deliver(docs as unknown as NotificationDocument[]).catch(
        (error: Error) =>
          this.logger.warn(`Không gửi được thông báo: ${error.message}`),
      );
    } catch (error) {
      this.logger.warn(`Không lưu được thông báo: ${(error as Error).message}`);
    }
  }

  /**
   * Đang mở web → chỉ realtime (chuông cập nhật ngay); không mở → push.
   * Email / SMS theo cài đặt của người nhận, không phụ thuộc đang mở web hay không.
   */
  private async deliver(docs: NotificationDocument[]) {
    const ids = [...new Set(docs.map((doc) => String(doc.user)))];
    const users = await this.userModel
      .find({ _id: { $in: ids } })
      .select(RECIPIENT_FIELDS)
      .exec();
    const byId = new Map(users.map((user) => [user.id as string, user]));

    for (const doc of docs) {
      const userId = String(doc.user);
      const notification = toNotification(doc);
      this.realtime.emitToUser(userId, 'notification:new', notification);
      const user = byId.get(userId);
      if (!user) continue;
      const prefs = prefsOf(user);
      const link = doc.link ?? '/thong-bao';

      if (prefs.push && !(await this.realtime.isOnline(userId))) {
        await this.pushTo(user, {
          title: doc.title,
          body: doc.message,
          link,
          tag: `notification-${notification.id}`,
        });
      }
      if (prefs.email && user.email && this.mailService.isEnabled) {
        await this.mailService.send({
          to: user.email,
          subject: `[Trọ ơi] ${doc.title}`,
          text: [
            doc.message,
            `Xem chi tiết: ${this.webUrl}${link}`,
            'Tắt email thông báo tại trang Thông báo trên Trọ ơi.',
          ]
            .filter(Boolean)
            .join('\n\n'),
        });
      }
      if (prefs.sms && this.smsService.isEnabled) {
        await this.smsService.send(
          user.phone,
          doc.message ? `${doc.title}: ${doc.message}` : doc.title,
        );
      }
    }
  }

  /** Push riêng (tin nhắn chat) khi người nhận không mở web và bật push. */
  async pushIfOffline(userId: string, message: PushMessage) {
    try {
      if (await this.realtime.isOnline(userId)) return;
      const user = await this.userModel
        .findById(userId)
        .select(RECIPIENT_FIELDS)
        .exec();
      if (user && prefsOf(user).push) await this.pushTo(user, message);
    } catch (error) {
      this.logger.warn(`Không gửi được push: ${(error as Error).message}`);
    }
  }

  private async pushTo(user: Recipient, message: PushMessage) {
    const dead = await this.pushService.send(user.pushTokens ?? [], message);
    if (dead.length > 0) {
      await this.userModel
        .updateOne({ _id: user.id }, { $pullAll: { pushTokens: dead } })
        .exec();
    }
  }

  /** Cài đặt nhận thông báo + kênh nào máy chủ đã cấu hình (kênh tắt thì web ẩn công tắc). */
  async getPreferences(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .select('email notifyPrefs')
      .exec();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return {
      ...prefsOf(user),
      hasEmail: Boolean(user.email),
      channels: {
        push: this.pushService.isEnabled,
        email: this.mailService.isEnabled,
        sms: this.smsService.isEnabled,
      },
    };
  }

  async updatePreferences(userId: string, dto: UpdateNotifyPrefsDto) {
    const changes = Object.fromEntries(
      (['push', 'email', 'sms'] as const)
        .filter((key) => dto[key] !== undefined)
        .map((key) => [`notifyPrefs.${key}`, dto[key]]),
    );
    if (Object.keys(changes).length > 0) {
      await this.userModel.updateOne({ _id: userId }, { $set: changes }).exec();
    }
    return this.getPreferences(userId);
  }

  /** Trình duyệt này bật push: thêm token (đưa lên cuối nếu đã có), giữ tối đa PUSH_TOKEN_LIMIT. */
  async addPushToken(userId: string, token: string) {
    await this.userModel
      .updateOne({ _id: userId }, { $pull: { pushTokens: token } })
      .exec();
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $push: { pushTokens: { $each: [token], $slice: -PUSH_TOKEN_LIMIT } },
        },
      )
      .exec();
    return null;
  }

  /** Tắt push / đăng xuất trên trình duyệt này. */
  async removePushToken(userId: string, token: string) {
    await this.userModel
      .updateOne({ _id: userId }, { $pull: { pushTokens: token } })
      .exec();
    return null;
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
