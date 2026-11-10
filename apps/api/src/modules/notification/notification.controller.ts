import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  NotificationQueryDto,
  PushTokenDto,
  UpdateNotifyPrefsDto,
} from './notification.dto.js';
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

  /** Cài đặt nhận thông báo + kênh máy chủ đã cấu hình. */
  @Get('preferences')
  preferences(@CurrentUser() user: AuthUser) {
    return this.notificationService.getPreferences(user.sub);
  }

  @Patch('preferences')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateNotifyPrefsDto,
  ) {
    return this.notificationService.updatePreferences(user.sub, dto);
  }

  /** Trình duyệt này bật thông báo đẩy. */
  @Put('push-tokens')
  addPushToken(@CurrentUser() user: AuthUser, @Body() dto: PushTokenDto) {
    return this.notificationService.addPushToken(user.sub, dto.token);
  }

  /** Tắt thông báo đẩy / đăng xuất trên trình duyệt này. */
  @Delete('push-tokens')
  removePushToken(@CurrentUser() user: AuthUser, @Body() dto: PushTokenDto) {
    return this.notificationService.removePushToken(user.sub, dto.token);
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
