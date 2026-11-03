import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

import type { AuthUser } from '../../common/current-user.decorator.js';

/** Chỉ admin. Đặt SAU JwtAuthGuard: @UseGuards(JwtAuthGuard, AdminGuard). */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    if (user?.role !== 'admin') {
      throw new ForbiddenException('Chỉ quản trị viên được truy cập');
    }
    return true;
  }
}
