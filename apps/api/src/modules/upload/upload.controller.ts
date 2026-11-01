import { randomBytes } from 'node:crypto';
import { join } from 'node:path';

import {
  BadRequestException,
  Controller,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

export const UPLOAD_DIR = join(process.cwd(), 'uploads');

/** Đuôi file lấy theo MIME (không tin tên file client gửi lên). */
const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Controller('uploads')
export class UploadController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, callback) =>
          callback(
            null,
            `${Date.now()}-${randomBytes(6).toString('hex')}${EXTENSION_BY_MIME[file.mimetype]}`,
          ),
      }),
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
  upload(@UploadedFiles() files: Express.Multer.File[] | undefined) {
    if (!files?.length) throw new BadRequestException('Chưa chọn ảnh');

    const baseUrl = this.configService.get<string>(
      'API_PUBLIC_URL',
      'http://localhost:5000',
    );
    return { urls: files.map((file) => `${baseUrl}/uploads/${file.filename}`) };
  }
}
