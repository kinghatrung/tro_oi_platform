import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import type { UserRole } from '../modules/auth/schemas/user.schema.js';

/** Payload JWT do JwtAuthGuard gắn vào request.user. */
export interface AuthUser {
  sub: string;
  /** Không có với tài khoản Google/Facebook. */
  phone?: string;
  role: UserRole;
}

/** Lấy user đang đăng nhập — chỉ dùng trên route có JwtAuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) =>
    context.switchToHttp().getRequest<Request & { user: AuthUser }>().user,
);
