import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { User, UserSchema } from '../auth/schemas/user.schema.js';
import {
  Conversation,
  ConversationSchema,
} from '../chat/schemas/conversation.schema.js';
import { Message, MessageSchema } from '../chat/schemas/message.schema.js';
import { ListingModule } from '../listing/listing.module.js';
import {
  Notification,
  NotificationSchema,
} from '../notification/notification.schema.js';
import { ProductModule } from '../product/product.module.js';
import { Report, ReportSchema } from '../report/report.schema.js';
import { Review, ReviewSchema } from '../review/review.schema.js';
import { AccountService } from './account.service.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      // Xuất dữ liệu / xoá tài khoản (AccountService) đọc - xoá dữ liệu ở các module khác
      { name: Review.name, schema: ReviewSchema },
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Report.name, schema: ReportSchema },
    ]),
    AuthModule,
    AuditModule,
    ListingModule,
    ProductModule,
  ],
  controllers: [UserController],
  providers: [UserService, AccountService],
})
export class UserModule {}
