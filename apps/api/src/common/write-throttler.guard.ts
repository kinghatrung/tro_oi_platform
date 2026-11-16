import { Injectable, type ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

const READ_METHODS = ['GET', 'HEAD', 'OPTIONS'];

/**
 * Rate limit theo IP chỉ cho request ghi qua HTTP (POST/PATCH/PUT/DELETE).
 * Bỏ qua GET: SSR của web gọi API từ cùng 1 IP máy chủ — giới hạn GET sẽ chặn chính web.
 * Bỏ qua WebSocket (chat): guard toàn cục cũng chạy cho gateway.
 */
@Injectable()
export class WriteThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const { method } = context.switchToHttp().getRequest<Request>();
    return READ_METHODS.includes(method);
  }
}
