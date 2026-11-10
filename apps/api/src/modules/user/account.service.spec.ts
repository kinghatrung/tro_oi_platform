import { jest } from '@jest/globals';
import { Types } from 'mongoose';

import { AccountService, DELETED_USER_NAME } from './account.service.js';

const userId = new Types.ObjectId();

/** Model giả: ghi lại filter của deleteMany / update của updateOne. */
const setup = (user: Record<string, unknown> | null) => {
  const deleted: Record<string, unknown> = {};
  const updates: unknown[] = [];
  const model = (name: string) => ({
    deleteMany: (filter: unknown) => {
      deleted[name] = filter;
      return { exec: async () => undefined };
    },
  });
  const userModel = {
    findById: () => ({
      exec: async () => user && { _id: userId, id: userId.toString(), ...user },
    }),
    updateOne: (_filter: unknown, update: unknown) => {
      updates.push(update);
      return { exec: async () => undefined };
    },
  };
  const audit = { log: jest.fn(async () => undefined) };
  const service = new AccountService(
    userModel as never,
    model('listing') as never,
    model('product') as never,
    model('review') as never,
    {} as never,
    {} as never,
    model('notification') as never,
    {} as never,
    audit as never,
  );
  return { service, deleted, updates, audit };
};

describe('AccountService.deleteAccount', () => {
  it('admin không tự xoá được', async () => {
    const { service, deleted } = setup({ role: 'admin' });
    await expect(service.deleteAccount(userId.toString())).rejects.toThrow(
      'Tài khoản quản trị',
    );
    expect(deleted).toEqual({});
  });

  it('xoá tin / món đồ / đánh giá về mình / thông báo; ẩn danh + khoá hồ sơ', async () => {
    const { service, deleted, updates, audit } = setup({
      role: 'landlord',
      phone: '+84901234567',
    });
    await service.deleteAccount(userId.toString());

    expect(deleted).toEqual({
      listing: { author: userId },
      product: { seller: userId },
      review: { target: userId },
      notification: { user: userId },
    });
    expect(updates[0]).toMatchObject({
      $set: {
        name: DELETED_USER_NAME,
        phone: `deleted:${userId.toString()}`,
        isBlocked: true,
        pushTokens: [],
      },
      $unset: { email: 1, avatar: 1 },
    });
    expect(audit.log).toHaveBeenCalledWith(
      userId.toString(),
      expect.objectContaining({ action: 'Tự xoá tài khoản' }),
    );
  });

  it('tài khoản đã xoá / không tồn tại → 404', async () => {
    await expect(
      setup({ role: 'renter', deletedAt: new Date() }).service.exportData(
        userId.toString(),
      ),
    ).rejects.toThrow('Không tìm thấy người dùng');
    await expect(
      setup(null).service.deleteAccount(userId.toString()),
    ).rejects.toThrow('Không tìm thấy người dùng');
  });
});
