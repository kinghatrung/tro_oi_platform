import { jest } from '@jest/globals';
import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  type ArgumentsHost,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { HttpExceptionFilter } from './http-exception.filter.js';
import { ResponseInterceptor } from './response.interceptor.js';

/** Contract ApiResponse { code, message, data } mà FE dựa vào. */
describe('Response format', () => {
  const runFilter = (exception: unknown) => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = {
      getType: () => 'http',
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    } as unknown as ArgumentsHost;
    new HttpExceptionFilter().catch(exception, host);
    return {
      status: status.mock.calls[0],
      body: json.mock.calls[0][0] as {
        code: number;
        message: string;
        data: unknown;
      },
    };
  };

  it('thành công: code = HTTP status, data null khi controller không trả gì', async () => {
    const context = {
      getType: () => 'http',
      switchToHttp: () => ({ getResponse: () => ({ statusCode: 201 }) }),
    } as unknown as ExecutionContext;
    const handle = (value: unknown) =>
      lastValueFrom(
        new ResponseInterceptor().intercept(context, {
          handle: () => of(value),
        } as CallHandler),
      );

    await expect(handle({ id: '1' })).resolves.toEqual({
      code: 201,
      message: 'Thành công',
      data: { id: '1' },
    });
    await expect(handle(undefined)).resolves.toMatchObject({ data: null });
  });

  it('WebSocket (ack của ChatGateway): giữ nguyên, không bọc ApiResponse', async () => {
    const context = { getType: () => 'ws' } as unknown as ExecutionContext;
    const ack = { ok: true };
    await expect(
      lastValueFrom(
        new ResponseInterceptor().intercept(context, {
          handle: () => of(ack),
        } as CallHandler),
      ),
    ).resolves.toBe(ack);
  });

  it('lỗi có message riêng: giữ message, gộp mảng validate', () => {
    const { status, body } = runFilter(
      new BadRequestException(['Tên quá ngắn', 'Email không hợp lệ']),
    );
    expect(status).toEqual([400]);
    expect(body).toEqual({
      code: 400,
      message: 'Tên quá ngắn; Email không hợp lệ',
      data: null,
    });
  });

  it('message mặc định tiếng Anh → tiếng Việt', () => {
    expect(runFilter(new NotFoundException()).body.message).toBe(
      'Không tìm thấy dữ liệu',
    );
    expect(
      runFilter(new NotFoundException('Cannot GET /abc')).body.message,
    ).toBe('Không tìm thấy dữ liệu');
    expect(
      runFilter(new PayloadTooLargeException('File too large')).body.message,
    ).toBe('File quá lớn (tối đa 5MB)');
  });

  it('lỗi không phải HttpException → 500, không lộ chi tiết', () => {
    const { body } = runFilter(new Error('mongo down at 10.0.0.1'));
    expect(body).toEqual({
      code: 500,
      message: 'Lỗi máy chủ, vui lòng thử lại sau',
      data: null,
    });
  });
});
