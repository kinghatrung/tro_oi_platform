import type { ExecutionContext } from '@nestjs/common';

import type { TroiApi } from '../adapters/troi-api.js';
import { AdminGuard } from './admin.guard.js';

const contextWith = (authorization?: string) =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ headers: { authorization } }),
    }),
  }) as unknown as ExecutionContext;

/** API giả: token "admin" → role admin, "user" → renter, còn lại → 401. */
const api = {
  get: (_path: string, _params: object, token?: string) =>
    token === 'admin'
      ? Promise.resolve({ role: 'admin' })
      : token === 'user'
        ? Promise.resolve({ role: 'renter' })
        : Promise.reject(new Error('Bạn cần đăng nhập')),
} as unknown as TroiApi;

describe('AdminGuard', () => {
  const guard = new AdminGuard(api);

  it('chỉ cho admin (hỏi API /users/me bằng token người gọi)', async () => {
    await expect(guard.canActivate(contextWith('Bearer admin'))).resolves.toBe(
      true,
    );
    await expect(guard.canActivate(contextWith('Bearer user'))).rejects.toThrow(
      'Chỉ quản trị viên',
    );
    await expect(
      guard.canActivate(contextWith('Bearer het-han')),
    ).rejects.toThrow('Chỉ quản trị viên');
    await expect(guard.canActivate(contextWith())).rejects.toThrow(
      'Bạn cần đăng nhập',
    );
  });
});
