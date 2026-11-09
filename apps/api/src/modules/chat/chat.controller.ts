import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { MessagesQueryDto, StartConversationDto } from './chat.dto.js';
import { toConversation } from './chat.mapper.js';
import { ChatService } from './chat.service.js';

/** REST cho dữ liệu cần tải lại; gửi/nhận realtime qua ChatGateway (Socket.IO /chat). */
@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const docs = await this.chatService.listConversations(user.sub);
    return docs.map((doc) => toConversation(doc, user.sub));
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { count: await this.chatService.unreadCount(user.sub) };
  }

  @Post()
  async start(
    @CurrentUser() user: AuthUser,
    @Body() dto: StartConversationDto,
  ) {
    const doc = await this.chatService.startConversation(user.sub, dto);
    return toConversation(doc, user.sub);
  }

  @Get(':id/messages')
  messages(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: MessagesQueryDto,
  ) {
    return this.chatService.getMessages(user.sub, id, query);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.chatService.markRead(user.sub, id);
  }
}
