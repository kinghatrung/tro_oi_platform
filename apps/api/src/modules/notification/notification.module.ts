import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { MailService } from './channels/mail.service.js';
import { PushService } from './channels/push.service.js';
import { SmsService } from './channels/sms.service.js';
import { NotificationController } from './notification.controller.js';
import { Notification, NotificationSchema } from './notification.schema.js';
import { NotificationService } from './notification.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    AuthModule, // User model (kênh nhận, token push)
  ],
  controllers: [NotificationController],
  providers: [NotificationService, PushService, MailService, SmsService],
  exports: [NotificationService],
})
export class NotificationModule {}
