import { createReadStream } from 'node:fs';
import {
  copyFile,
  mkdir,
  readdir,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

/**
 * Nơi lưu file upload. Có S3_BUCKET → dịch vụ tương thích S3 (R2, MinIO, AWS) để nhiều instance
 * API dùng chung; không có → ổ đĩa apps/api/uploads (1 instance, phục vụ qua static /uploads).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
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

  /**
   * Lưu file đã nằm trên đĩa (video nhận qua file tạm, không giữ cả file trong RAM) rồi xoá file tạm.
   * Ổ đĩa → chuyển thẳng vào uploads; S3 → stream từ file lên bucket.
   */
  async saveFile(name: string, tempPath: string, contentType: string) {
    const key = `uploads/${name}`;
    try {
      if (this.s3) {
        const { size } = await stat(tempPath);
        await this.s3.send(
          new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: createReadStream(tempPath),
            ContentLength: size,
            ContentType: contentType,
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        );
      } else {
        await mkdir(UPLOAD_DIR, { recursive: true });
        const target = join(UPLOAD_DIR, name);
        // Thư mục tạm khác ổ đĩa (EXDEV) → không rename được, chép rồi xoá ở finally
        await rename(tempPath, target).catch(() => copyFile(tempPath, target));
      }
    } finally {
      await rm(tempPath, { force: true });
    }
    return `${this.publicUrl.replace(/\/$/, '')}/${key}`;
  }

  /** Tên mọi file đã upload (ổ đĩa: thư mục uploads; S3: key prefix uploads/, đọc theo trang). */
  async listNames() {
    if (!this.s3) {
      return readdir(UPLOAD_DIR).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return [];
        throw error;
      });
    }
    const names: string[] = [];
    let token: string | undefined;
    do {
      const page = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: 'uploads/',
          ContinuationToken: token,
        }),
      );
      for (const item of page.Contents ?? []) {
        if (item.Key) names.push(item.Key.slice('uploads/'.length));
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);
    return names;
  }

  /** Xoá theo tên file trong uploads (tên lạ / có "../" bị isStoredUrl bỏ qua). */
  removeNames(names: string[]) {
    const base = `${this.publicUrl.replace(/\/$/, '')}/uploads/`;
    return this.remove(names.map((name) => base + name));
  }

  /**
   * Xoá file đã upload. Bỏ qua URL không phải của hệ thống (isStoredUrl cũng chặn "../").
   * Cố gắng hết sức: file lỗi chỉ ghi log, không làm hỏng thao tác gọi tới. Trả số file đã xoá.
   */
  async remove(urls: (string | null | undefined)[]) {
    const names = [
      ...new Set(
        urls
          .filter((url): url is string => !!url && this.isStoredUrl(url))
          .map((url) => url.slice(url.lastIndexOf('/') + 1)),
      ),
    ];
    const results = await Promise.allSettled(
      names.map((name) =>
        this.s3
          ? this.s3.send(
              new DeleteObjectCommand({
                Bucket: this.bucket,
                Key: `uploads/${name}`,
              }),
            )
          : unlink(join(UPLOAD_DIR, name)),
      ),
    );
    // File đã không còn trên đĩa (ENOENT) coi như xoá xong
    const failed = results.filter(
      (result) =>
        result.status === 'rejected' &&
        (result.reason as NodeJS.ErrnoException)?.code !== 'ENOENT',
    ).length;
    if (failed > 0) {
      this.logger.warn(`Không xoá được ${failed}/${names.length} file upload`);
    }
    return names.length - failed;
  }
}
