import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
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
import {
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from './unsubscribe-token.js';

export interface NotificationInput {
  kind: NotificationKind;
  title: string;
  message?: string;
  link?: string;
  /** Loại gửi nhiều (tin mới khớp tìm kiếm): email gom vào bản tin ngày thay vì gửi ngay. */
  digest?: boolean;
}

/** Số trình duyệt / thiết bị nhận push tối đa mỗi tài khoản (cũ nhất bị bỏ). */
export const PUSH_TOKEN_LIMIT = 10;
/** Giờ gửi email bản tin ngày (giờ Việt Nam). */
export const DIGEST_HOUR_VN = 8;
const DIGEST_CHECK_MS = 60 * 60 * 1000;
const DIGEST_MAX_ITEMS = 20;

/** Nội dung email bản tin ngày từ các thông báo chờ gom (mới trước). */
export function buildDigest(
  docs: Pick<NotificationDocument, 'title' | 'message' | 'link'>[],
  webUrl: string,
) {
  const lines = docs
    .slice(0, DIGEST_MAX_ITEMS)
    .map(
      (doc) =>
        `• ${doc.message ?? doc.title}\n  ${webUrl}${doc.link ?? '/thong-bao'}`,
    );
  if (docs.length > DIGEST_MAX_ITEMS) {
    lines.push(
      `…và ${docs.length - DIGEST_MAX_ITEMS} tin khác: ${webUrl}/thong-bao`,
    );
  }
  return {
    subject:
      docs.length === 1
        ? docs[0].title
        : `${docs.length} thông báo mới hôm nay`,
    body: lines,
  };
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
export class NotificationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationService.name);
  /** Gốc link trong email (origin đầu tiên của WEB_ORIGIN). */
  private readonly webUrl: string;
  /** Gốc URL API cho header List-Unsubscribe (mail client POST thẳng, không qua web). */
  private readonly apiUrl: string;
  private readonly secret: string;
  private digestTimer?: NodeJS.Timeout;
  /** Ngày (giờ VN) đã chạy bản tin — mỗi instance chạy tối đa 1 lần / ngày. */
  private lastDigestDay?: string;

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
    this.apiUrl = (
      config.get<string>('API_PUBLIC_URL') ?? 'http://localhost:5000'
    ).replace(/\/$/, '');
    this.secret = config.getOrThrow<string>('JWT_SECRET');
  }

  onModuleInit() {
    this.digestTimer = setInterval(
      () => void this.runDigestIfDue(),
      DIGEST_CHECK_MS,
    );
  }

  onModuleDestroy() {
    clearInterval(this.digestTimer);
  }

  /** Mỗi giờ kiểm tra; từ DIGEST_HOUR_VN trở đi, chưa chạy hôm nay → gửi bản tin. */
  async runDigestIfDue(now = new Date()) {
    const vietnam = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    const day = vietnam.toISOString().slice(0, 10);
    if (vietnam.getUTCHours() < DIGEST_HOUR_VN || this.lastDigestDay === day) {
      return;
    }
    this.lastDigestDay = day;
    try {
      await this.sendDigests();
    } catch (error) {
      this.logger.warn(
        `Không gửi được email bản tin: ${(error as Error).message}`,
      );
    }
  }

  /** Mỗi người 1 email gom các thông báo chờ gom; xoá cờ trước khi gửi để không gửi lặp. */
  private async sendDigests() {
    const pending = { emailDigest: true };
    if (!this.mailService.isEnabled) {
      await this.notificationModel
        .updateMany(pending, { $unset: { emailDigest: 1 } })
        .exec();
      return;
    }
    const userIds = await this.notificationModel
      .distinct('user', pending)
      .exec();
    for (const userId of userIds) {
      const docs = await this.notificationModel
        .find({ user: userId, ...pending })
        .sort({ createdAt: -1 })
        .exec();
      // Nhiều instance cùng chạy: chỉ bên xoá được cờ mới gửi
      const { modifiedCount } = await this.notificationModel
        .updateMany(
          { _id: { $in: docs.map((doc) => doc._id) }, ...pending },
          { $unset: { emailDigest: 1 } },
        )
        .exec();
      if (modifiedCount === 0) continue;
      const user = await this.userModel
        .findById(userId)
        .select(RECIPIENT_FIELDS)
        .exec();
      if (!user?.email || !prefsOf(user).email) continue;
      const { subject, body } = buildDigest(docs, this.webUrl);
      await this.sendMail(user, subject, body);
    }
  }

  /** Email kèm link huỷ nhận (web, bấm xác nhận) + header List-Unsubscribe (1 chạm trong Gmail). */
  private async sendMail(user: Recipient, subject: string, body: string[]) {
    const token = signUnsubscribeToken(user.id as string, this.secret);
    await this.mailService.send({
      to: user.email!,
      subject: `[Trọ ơi] ${subject}`,
      text: [
        ...body,
        `Không muốn nhận email thông báo nữa? Huỷ tại: ${this.webUrl}/huy-nhan-email?token=${token}`,
      ].join('\n\n'),
      headers: {
        'List-Unsubscribe': `<${this.apiUrl}/notifications/unsubscribe?token=${token}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
  }

  /** Link huỷ nhận email (không cần đăng nhập): tắt kênh email của tài khoản trong token. */
  async unsubscribeEmail(token: string) {
    const userId = verifyUnsubscribeToken(token, this.secret);
    if (!userId) {
      throw new BadRequestException('Link huỷ nhận email không hợp lệ');
    }
    await this.userModel
      .updateOne({ _id: userId }, { $set: { 'notifyPrefs.email': false } })
      .exec();
    return null;
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
        items.map(({ user, input: { digest, ...input } }) => ({
          user,
          ...input,
          ...(digest && { emailDigest: true }),
        })),
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
      // Thông báo gom (emailDigest) gửi trong bản tin ngày, không gửi email riêng
      if (
        prefs.email &&
        user.email &&
        this.mailService.isEnabled &&
        !doc.emailDigest
      ) {
        await this.sendMail(
          user,
          doc.title,
          [doc.message, `Xem chi tiết: ${this.webUrl}${link}`].filter(
            (line): line is string => Boolean(line),
          ),
        );
      }
      if (prefs.sms && this.smsService.isEnabled && user.phone) {
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
