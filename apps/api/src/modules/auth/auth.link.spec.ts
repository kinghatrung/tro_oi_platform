import { jest } from '@jest/globals';
import { Types } from 'mongoose';

import { AuthService } from './auth.service.js';

const userId = new Types.ObjectId().toString();

/** AuthService với user đang đăng nhập `current`; `taken` = giá trị đã thuộc tài khoản khác. */
const setup = (
  decoded: Record<string, unknown>,
  current: Record<string, unknown>,
  taken = false,
) => {
  const doc: Record<string, unknown> & { save: () => Promise<void> } = {
    id: userId,
    role: 'renter',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...current,
    save: jest.fn(async () => undefined),
  };
  const userModel = {
    findById: () => ({ exec: async () => doc }),
    exists: jest.fn(async () => (taken ? { _id: 'other' } : null)),
  };
  const service = new AuthService(
    userModel as never,
    { verifyIdToken: async () => decoded } as never,
    {} as never,
    {} as never,
  );
  return { service, doc };
};

const google = {
  uid: 'g-1',
  firebase: { sign_in_provider: 'google.com' },
  email: 'a@gmail.com',
  email_verified: true,
};

describe('AuthService — liên kết tài khoản', () => {
  it('tài khoản SĐT gắn Google: lưu UID, nhà cung cấp, email đã xác minh', async () => {
    const { service, doc } = setup(google, { phone: '+84901234567' });
    const user = await service.linkSocial(userId, 't');
    expect(doc).toMatchObject({
      firebaseUid: 'g-1',
      socialProvider: 'google.com',
      email: 'a@gmail.com',
    });
    expect(user.socialProvider).toBe('google.com');
  });

  it('Google đã thuộc tài khoản khác → 409; đã gắn cái khác → 400', async () => {
    await expect(
      setup(google, { phone: '+84901234567' }, true).service.linkSocial(
        userId,
        't',
      ),
    ).rejects.toThrow('tài khoản Trọ ơi khác');
    await expect(
      setup(google, { firebaseUid: 'fb-9' }).service.linkSocial(userId, 't'),
    ).rejects.toThrow('huỷ liên kết cũ');
  });

  it('token SĐT không dùng để gắn Google', async () => {
    await expect(
      setup(
        { uid: 'p', firebase: { sign_in_provider: 'phone' } },
        {},
      ).service.linkSocial(userId, 't'),
    ).rejects.toThrow('Google hoặc Facebook');
  });

  it('tài khoản Google gắn SĐT; SĐT đã có chủ → 409', async () => {
    const phoneToken = { uid: 'p', phone_number: '+84907654321' };
    const { service, doc } = setup(phoneToken, { firebaseUid: 'g-1' });
    await service.linkPhone(userId, 't');
    expect(doc.phone).toBe('+84907654321');
    await expect(
      setup(phoneToken, { firebaseUid: 'g-1' }, true).service.linkPhone(
        userId,
        't',
      ),
    ).rejects.toThrow('Số điện thoại này');
  });

  it('huỷ liên kết chỉ khi còn SĐT để đăng nhập lại', async () => {
    await expect(
      setup({}, { firebaseUid: 'g-1' }).service.unlinkSocial(userId),
    ).rejects.toThrow('Thêm số điện thoại');
    const { service, doc } = setup(
      {},
      { firebaseUid: 'g-1', socialProvider: 'google.com', phone: '+849' },
    );
    const user = await service.unlinkSocial(userId);
    expect(doc.firebaseUid).toBeUndefined();
    expect(user.socialProvider).toBeUndefined();
  });
});
