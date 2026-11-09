import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { StorageService } from './storage.service.js';

/** Đuôi file lấy theo MIME (không tin tên file client gửi lên). */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

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
          `${Date.now()}-${randomBytes(6).toString('hex')}${EXTENSION_BY_MIME[file.mimetype]}`,
          file.buffer,
          file.mimetype,
        ),
      ),
    );
    return { urls };
  }
}
