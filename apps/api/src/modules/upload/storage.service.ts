import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * Nơi lưu file upload. Có S3_BUCKET → dịch vụ tương thích S3 (R2, MinIO, AWS) để nhiều instance
 * API dùng chung; không có → ổ đĩa apps/api/uploads (1 instance, phục vụ qua static /uploads).
 */
@Injectable()
export class StorageService {
  private readonly s3?: S3Client;
  private readonly bucket?: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService) {
    this.bucket = config.get<string>('S3_BUCKET') || undefined;
    if (this.bucket) {
      // Thiếu cấu hình → lỗi ngay lúc khởi động thay vì lỗi khi người dùng upload
      this.s3 = new S3Client({
        region: config.get<string>('S3_REGION') || 'auto',
        endpoint: config.get<string>('S3_ENDPOINT') || undefined,
        forcePathStyle: config.get<string>('S3_FORCE_PATH_STYLE') === 'true',
        credentials: {
          accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
          secretAccessKey: config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
        },
      });
      this.publicUrl = config.getOrThrow<string>('S3_PUBLIC_URL');
    } else {
      this.publicUrl = config.get<string>(
        'API_PUBLIC_URL',
        'http://localhost:5000',
      );
    }
  }

  /**
   * URL do chính hệ thống upload tạo ra. Chat chỉ nhận ảnh loại này: ảnh từ site ngoài
   * (pixel theo dõi) sẽ lộ IP người xem cho bên thứ ba.
   */
  isStoredUrl(url: string) {
    const prefix = `${this.publicUrl.replace(/\/$/, '')}/uploads/`;
    return url.startsWith(prefix) && /^[\w.-]+$/.test(url.slice(prefix.length));
  }

  /** Lưu file (tên đã sinh ở server) → URL công khai: `<publicUrl>/uploads/<name>`. */
  async save(name: string, body: Buffer, contentType: string) {
    const key = `uploads/${name}`;
    if (this.s3) {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          // Tên file ngẫu nhiên, không bao giờ ghi đè → cache lâu được
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
    } else {
      await mkdir(UPLOAD_DIR, { recursive: true });
      await writeFile(join(UPLOAD_DIR, name), body);
    }
    return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
  }
}
