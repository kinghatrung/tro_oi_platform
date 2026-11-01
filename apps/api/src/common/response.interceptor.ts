import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map } from 'rxjs';

/** Bọc mọi response thành công theo ApiResponse: { success: true, data }. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next
      .handle()
      .pipe(map((data: unknown) => ({ success: true, data: data ?? null })));
  }
}
