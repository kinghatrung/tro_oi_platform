import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { STATUS_CODES } from 'node:http';

import type { Response } from 'express';

/** Message tiếng Việt thay cho message mặc định tiếng Anh của Nest/multer. */
const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'Dữ liệu không hợp lệ',
  401: 'Bạn cần đăng nhập',
  403: 'Bạn không có quyền thực hiện thao tác này',
  404: 'Không tìm thấy dữ liệu',
  413: 'File quá lớn (tối đa 5MB)',
  429: 'Bạn thao tác quá nhanh, vui lòng thử lại sau',
  500: 'Lỗi máy chủ, vui lòng thử lại sau',
};

interface NestErrorBody {
  message?: string | string[];
}

/** Trả mọi lỗi theo ApiResponse: { code, message, data: null }. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    // WebSocket: gateway tự trả lỗi trong ack, ở đây chỉ ghi log
    if (host.getType() !== 'http') {
      this.logger.error(exception);
      return;
    }
    const response = host.switchToHttp().getResponse<Response>();
    const code =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    if (!(exception instanceof HttpException)) this.logger.error(exception);

    response.status(code).json({
      code,
      message: this.toMessage(exception, code),
      data: null,
    });
  }

  private toMessage(exception: unknown, code: number) {
    const fallback = DEFAULT_MESSAGES[code] ?? DEFAULT_MESSAGES[500];
    if (!(exception instanceof HttpException) || code === 413) return fallback;

    const body = exception.getResponse();
    if (typeof body === 'string') return body;

    const { message } = body as NestErrorBody;
    const text = Array.isArray(message) ? message.join('; ') : message;
    // Exception ném không kèm message (vd new NotFoundException()) hoặc route không tồn tại
    const isNestDefault =
      !text || text === STATUS_CODES[code] || /^Cannot \w+ \//.test(text);
    return isNestDefault ? fallback : text;
  }
}
