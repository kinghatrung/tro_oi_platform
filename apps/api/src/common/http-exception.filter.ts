import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/** Trả mọi lỗi theo ApiResponse: { success: false, message, statusCode }. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      this.logger.error(exception);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Lỗi máy chủ, vui lòng thử lại sau',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
      return;
    }

    const statusCode = exception.getStatus();
    const body = exception.getResponse();
    const raw =
      typeof body === 'string'
        ? body
        : (body as { message?: string | string[] }).message;
    const message = Array.isArray(raw)
      ? raw.join('; ')
      : (raw ?? exception.message);

    response.status(statusCode).json({ success: false, message, statusCode });
  }
}
