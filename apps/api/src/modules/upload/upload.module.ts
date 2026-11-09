import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { StorageService } from './storage.service.js';
import { UploadController } from './upload.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [UploadController],
  providers: [StorageService],
})
export class UploadModule {}
