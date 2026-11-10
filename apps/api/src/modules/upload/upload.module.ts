import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { StorageService } from './storage.service.js';
import { UploadController } from './upload.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
  providers: [StorageService],
  exports: [StorageService], // ChatModule kiểm tra URL ảnh trong tin nhắn
})
export class UploadModule {}
