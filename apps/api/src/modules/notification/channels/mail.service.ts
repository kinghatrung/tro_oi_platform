import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

/**
 * Email qua SMTP (Gmail, Zoho, Amazon SES...). Thiếu SMTP_HOST → tắt, không lỗi.
 * Chỉ gửi văn bản thuần: nội dung thông báo do hệ thống soạn, không cần template HTML.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;
  private readonly from?: string;

  constructor(config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    if (!host) return;
    const user = config.get<string>('SMTP_USER');
    this.transporter = createTransport({
      host,
      port: Number(config.get<string>('SMTP_PORT') ?? 587),
      // true cho cổng 465 (TLS ngay), false cho 587 (STARTTLS)
      secure: config.get<string>('SMTP_SECURE') === 'true',
      auth: user
        ? { user, pass: config.getOrThrow<string>('SMTP_PASS') }
        : undefined,
    });
    this.from = config.get<string>('SMTP_FROM') || user;
  }

  get isEnabled() {
    return Boolean(this.transporter);
  }

  async send(message: MailMessage) {
    if (!this.transporter) return;
    try {
      await this.transporter.sendMail({ from: this.from, ...message });
    } catch (error) {
      this.logger.warn(`Không gửi được email: ${(error as Error).message}`);
    }
  }
}
