import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Che số khi ghi log: +84901234567 → +849*****567. */
export const maskPhone = (phone: string) =>
  phone.length > 7
    ? `${phone.slice(0, 4)}${'*'.repeat(phone.length - 7)}${phone.slice(-3)}`
    : '***';

/**
 * Chỗ cắm SMS. SMS_PROVIDER:
 * - bỏ trống: tắt (người dùng không bật được kênh SMS)
 * - "log": không gửi thật, chỉ ghi log (số đã che) — để thử luồng
 * Thêm nhà cung cấp (eSMS, SpeedSMS, Twilio...): thêm 1 nhánh trong `send` gọi HTTP API của họ.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider?: string;

  constructor(config: ConfigService) {
    this.provider = config.get<string>('SMS_PROVIDER') || undefined;
  }

  get isEnabled() {
    return Boolean(this.provider);
  }

  /** Trả Promise để nhánh nhà cung cấp thật (gọi HTTP) cắm vào không phải đổi chỗ gọi. */
  send(phone: string, text: string): Promise<void> {
    if (this.provider === 'log') {
      this.logger.log(`[SMS → ${maskPhone(phone)}] ${text}`);
    } else if (this.provider) {
      this.logger.warn(`SMS_PROVIDER "${this.provider}" chưa được hỗ trợ`);
    }
    return Promise.resolve();
  }
}
