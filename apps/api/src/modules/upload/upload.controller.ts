import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';

import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { StorageService } from './storage.service.js';

/** Đuôi file lấy theo MIME (không tin tên file client gửi lên). */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const VIDEO_EXTENSION_BY_MIME: Record<string, string> = {
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
};
export const VIDEO_MAX_MB = 50;

const fileName = (extension: string) =>
  `${Date.now()}-${randomBytes(6).toString('hex')}${extension}`;

@Controller('uploads')
export class UploadController {
  constructor(private readonly storageService: StorageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // Giữ trong bộ nhớ (tối đa 10 × 5MB) rồi StorageService ghi ra ổ đĩa hoặc S3
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, callback) =>
        file.mimetype in EXTENSION_BY_MIME
          ? callback(null, true)
          : callback(
              new BadRequestException('Chỉ chấp nhận ảnh JPG, PNG, WEBP, GIF'),
              false,
            ),
    }),
  )
  async upload(@UploadedFiles() files: Express.Multer.File[] | undefined) {
    if (!files?.length) throw new BadRequestException('Chưa chọn ảnh');

    const urls = await Promise.all(
      files.map((file) =>
        this.storageService.save(
          fileName(EXTENSION_BY_MIME[file.mimetype]),
          file.buffer,
          file.mimetype,
        ),
      ),
    );
    return { urls };
  }

  /** 1 video tin đăng (MP4 / WEBM / MOV). Nginx production phải cho body ≥ VIDEO_MAX_MB. */
  @Post('video')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      // Ghi ra file tạm (không giữ cả video trong RAM); quá giới hạn → multer tự xoá file dở.
      // shortcut: video vẫn đi qua API (tốn băng thông) — cần giảm tải thì upload thẳng S3 bằng
      // presigned URL (thêm @aws-sdk/s3-request-presigner)
      storage: diskStorage({
        destination: tmpdir(),
        filename: (_req, file, callback) =>
          callback(null, fileName(VIDEO_EXTENSION_BY_MIME[file.mimetype])),
      }),
      limits: { fileSize: VIDEO_MAX_MB * 1024 * 1024 },
      fileFilter: (_req, file, callback) =>
        file.mimetype in VIDEO_EXTENSION_BY_MIME
          ? callback(null, true)
          : callback(
              new BadRequestException('Chỉ chấp nhận video MP4, WEBM, MOV'),
              false,
            ),
    }),
  )
  async uploadVideo(@UploadedFile() file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('Chưa chọn video');
    const url = await this.storageService.saveFile(
      file.filename,
      file.path,
      file.mimetype,
    );
    return { url };
  }
}
