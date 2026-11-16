import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';

import { WriteThrottlerGuard } from './write-throttler.guard.js';

class TestGuard extends WriteThrottlerGuard {
  skip(context: ExecutionContext) {
    return this.shouldSkip(context);
  }
}

const guard = new TestGuard({ throttlers: [] }, {} as never, new Reflector());

const httpContext = (method: string) =>
  ({
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => ({ method }) }),
  }) as unknown as ExecutionContext;

describe('WriteThrottlerGuard', () => {
  it('bỏ qua request đọc (SSR của web gọi GET từ 1 IP)', async () => {
    await expect(guard.skip(httpContext('GET'))).resolves.toBe(true);
    await expect(guard.skip(httpContext('OPTIONS'))).resolves.toBe(true);
  });

  it('giới hạn request ghi', async () => {
    for (const method of ['POST', 'PATCH', 'PUT', 'DELETE']) {
      await expect(guard.skip(httpContext(method))).resolves.toBe(false);
    }
  });

  it('bỏ qua WebSocket', async () => {
    const ws = { getType: () => 'ws' } as unknown as ExecutionContext;
    await expect(guard.skip(ws)).resolves.toBe(true);
  });
});
