import { jest } from '@jest/globals';

import { AuthService } from './auth.service.js';

type Decoded = Record<string, unknown>;

/** AuthService với model / Firebase / JWT giả; `existing` = user đã có theo firebaseUid. */
const setup = (
  decoded: Decoded,
  existing: Record<string, unknown> | null = null,
) => {
  const created: Record<string, unknown>[] = [];
  const asDoc = (values: Record<string, unknown>) => ({
    id: 'user-1',
    role: 'renter',
    isBlocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...values,
  });
  const userModel = {
    findOne: jest.fn(() => ({ exec: async () => existing && asDoc(existing) })),
    create: jest.fn(async (values: Record<string, unknown>) => {
      created.push(values);
      return asDoc(values);
    }),
  };
  const service = new AuthService(
    userModel as never,
    { verifyIdToken: async () => decoded } as never,
    { signAsync: async () => 'jwt' } as never,
    { get: () => '7d', getOrThrow: () => 'secret' } as never,
  );
  return { service, userModel, created };
};

const google = (extra: Decoded = {}) => ({
  uid: 'firebase-uid-1',
  firebase: { sign_in_provider: 'google.com' },
  name: 'Nguyễn Văn A',
  email: 'a@gmail.com',
  email_verified: true,
  picture: 'https://lh3.googleusercontent.com/a.jpg',
  ...extra,
});

describe('AuthService.socialLogin', () => {
  it('token đăng nhập SĐT (không phải Google/Facebook) → 400', async () => {
    const { service } = setup({
      uid: 'x',
      firebase: { sign_in_provider: 'phone' },
    });
    await expect(service.socialLogin('t')).rejects.toThrow(
      'Google hoặc Facebook',
    );
  });

  it('lần đầu → tạo tài khoản theo UID, lấy tên / email đã xác minh / ảnh', async () => {
    const { service, created } = setup(google());
    const result = await service.socialLogin('t');
    expect(result.isNewUser).toBe(true);
    expect(result.accessToken).toBe('jwt');
    expect(created[0]).toMatchObject({
      firebaseUid: 'firebase-uid-1',
      name: 'Nguyễn Văn A',
      email: 'a@gmail.com',
      avatar: 'https://lh3.googleusercontent.com/a.jpg',
      role: 'renter',
    });
    expect(created[0]).not.toHaveProperty('phone');
  });

  it('email chưa xác minh (Facebook) không lưu; tên quá ngắn → tên mặc định', async () => {
    const { service, created } = setup(
      google({
        firebase: { sign_in_provider: 'facebook.com' },
        email_verified: false,
        name: 'A',
      }),
    );
    await service.socialLogin('t');
    expect(created[0].email).toBeUndefined();
    expect(created[0].name).toBe('Người dùng mới');
  });

  it('đã có tài khoản theo UID → đăng nhập, không tạo mới', async () => {
    const { service, userModel } = setup(google(), {
      firebaseUid: 'firebase-uid-1',
      name: 'A',
    });
    const result = await service.socialLogin('t');
    expect(result.isNewUser).toBe(false);
    expect(userModel.create).not.toHaveBeenCalled();
    expect(userModel.findOne).toHaveBeenCalledWith({
      firebaseUid: 'firebase-uid-1',
    });
  });

  it('tài khoản bị khoá → 403', async () => {
    const { service } = setup(google(), {
      firebaseUid: 'firebase-uid-1',
      isBlocked: true,
    });
    await expect(service.socialLogin('t')).rejects.toThrow('bị khoá');
  });
});
