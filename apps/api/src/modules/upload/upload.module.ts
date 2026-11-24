import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { Message, MessageSchema } from '../chat/schemas/message.schema.js';
import { Listing, ListingSchema } from '../listing/schemas/listing.schema.js';
import { Page, PageSchema } from '../page/page.schema.js';
import { Product, ProductSchema } from '../product/schemas/product.schema.js';
import { Setting, SettingSchema } from '../settings/settings.schema.js';
import { StorageService } from './storage.service.js';
import { UploadCleanupService } from './upload-cleanup.service.js';
import { UploadController } from './upload.controller.js';

@Module({
  imports: [
    AuthModule, // JwtAuthGuard, User model
    // Dọn file mồ côi: đọc mọi nơi lưu URL upload (chỉ đọc, không phụ thuộc module của chúng)
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Setting.name, schema: SettingSchema },
      { name: Page.name, schema: PageSchema },
    ]),
  ],
  controllers: [UploadController],
  providers: [StorageService, UploadCleanupService],
  exports: [StorageService], // ChatModule kiểm tra URL ảnh trong tin nhắn
})
export class UploadModule {}
