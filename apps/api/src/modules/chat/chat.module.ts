import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { ListingModule } from '../listing/listing.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { ProductModule } from '../product/product.module.js';
import { UploadModule } from '../upload/upload.module.js';
import { ChatController } from './chat.controller.js';
import { ChatGateway } from './chat.gateway.js';
import { ChatService } from './chat.service.js';
import {
  Conversation,
  ConversationSchema,
} from './schemas/conversation.schema.js';
import { Message, MessageSchema } from './schemas/message.schema.js';

/** Chat 1-1 người hỏi ↔ chủ tin / người bán (Trọ ơi và Chợ ơi). */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
    ]),
    AuthModule, // JwtModule, User model, JwtAuthGuard
    ListingModule, // Listing model
    ProductModule, // Product model
    UploadModule, // StorageService: kiểm tra URL ảnh tin nhắn
    NotificationModule, // push tin nhắn khi người nhận không mở web
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [MongooseModule], // Conversation model cho ReviewModule
})
export class ChatModule {}
