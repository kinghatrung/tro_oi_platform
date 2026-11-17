import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';

import { TroiApi } from '../adapters/troi-api.js';

/**
 * Chỉ admin Trọ ơi: hỏi API chính "token này là ai" (GET /users/me) — apps/ai không đọc DB,
 * nên khoá tài khoản / gỡ quyền bên web có hiệu lực ngay ở đây.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly api: TroiApi) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = /^Bearer (.+)$/.exec(
      request.headers.authorization ?? '',
    )?.[1];
    if (!token) throw new UnauthorizedException('Bạn cần đăng nhập');

    const me = await this.api
      .get<{ role?: string }>('/users/me', {}, token)
      .catch(() => null);
    if (me?.role !== 'admin') {
      throw new ForbiddenException(
        'Chỉ quản trị viên xem được nhật ký trợ lý AI',
      );
    }
    return true;
  }
}
