import {
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { NotificationQueryDto } from './notification.dto.js';
import { NotificationService } from './notification.service.js';

/** Thông báo của người đang đăng nhập. */
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: NotificationQueryDto) {
    return this.notificationService.list(user.sub, query.page, query.pageSize);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { count: await this.notificationService.unreadCount(user.sub) };
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationService.markAllRead(user.sub);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notificationService.markRead(user.sub, id);
  }
}
