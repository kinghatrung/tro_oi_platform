import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { UploadModule } from '../upload/upload.module.js';
import { ListingController } from './listing.controller.js';
import { ListingService } from './listing.service.js';
import { User, UserSchema } from '../auth/schemas/user.schema.js';
import { Listing, ListingSchema } from './schemas/listing.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    SettingsModule,
    AuditModule,
    NotificationModule,
    UploadModule, // kiểm tra / dọn file video, ảnh của tin
  ],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [MongooseModule],
})
export class ListingModule {}
