import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map } from 'rxjs';

export const DEFAULT_SUCCESS_MESSAGE = 'Thành công';

/** Bọc mọi response thành công theo ApiResponse: { code, message, data }. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
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
