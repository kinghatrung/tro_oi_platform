import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { ChatModule } from '../chat/chat.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { ReviewController } from './review.controller.js';
import { Review, ReviewSchema } from './review.schema.js';
import { ReviewService } from './review.service.js';

/** Đánh giá người dùng — chỉ giữa 2 người đã nhắn tin với nhau (Conversation từ ChatModule). */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Review.name, schema: ReviewSchema }]),
    AuthModule, // User model, JwtAuthGuard
    ChatModule, // Conversation model
    NotificationModule,
    AuditModule,
  ],
  controllers: [ReviewController],
  providers: [ReviewService],
})
export class ReviewModule {}
