import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map } from 'rxjs';

export const DEFAULT_SUCCESS_MESSAGE = 'Thành công';

/** Bọc mọi response HTTP thành công theo ApiResponse: { code, message, data }. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    // Ack Socket.IO (ChatGateway) có format riêng { ok, ... }
    if (context.getType() !== 'http') return next.handle();
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((data: unknown) => ({
        code: response.statusCode,
        message: DEFAULT_SUCCESS_MESSAGE,
        data: data ?? null,
      })),
    );
  }
}
