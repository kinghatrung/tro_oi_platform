import { Injectable, Logger } from '@nestjs/common';
import { getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

export interface PushMessage {
  title: string;
  body?: string;
  /** Đường dẫn trong web (vd /thong-bao) — bấm thông báo thì mở. */
  link?: string;
  /** Cùng tag → thông báo mới thay thông báo cũ (vd mỗi cuộc trò chuyện 1 thông báo). */
  tag?: string;
}

/** Mã lỗi FCM nghĩa là token không còn dùng được → xoá khỏi tài khoản. */
const DEAD_TOKEN_CODES = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
]);

/**
 * Web push qua Firebase Cloud Messaging (dùng app Firebase Admin do FirebaseService khởi tạo).
 * Gửi dạng data → service worker public/push-sw.js tự hiện thông báo.
 * Firebase chưa cấu hình → tắt.
 */
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  get isEnabled() {
    return getApps().length > 0;
  }

  /** Gửi tới các token; trả token chết để caller xoá. Lỗi khác chỉ ghi log. */
  async send(tokens: string[], message: PushMessage): Promise<string[]> {
    if (!this.isEnabled || tokens.length === 0) return [];
    try {
      const result = await getMessaging().sendEachForMulticast({
        tokens,
        webpush: {
          data: {
            title: message.title,
            body: message.body ?? '',
            link: message.link ?? '/',
            tag: message.tag ?? '',
          },
          headers: { Urgency: 'high', TTL: String(24 * 60 * 60) },
        },
      });
      return result.responses.flatMap((response, index) =>
        !response.success && DEAD_TOKEN_CODES.has(response.error?.code ?? '')
          ? [tokens[index]]
          : [],
      );
    } catch (error) {
      this.logger.warn(`Không gửi được push: ${(error as Error).message}`);
      return [];
    }
  }
}
