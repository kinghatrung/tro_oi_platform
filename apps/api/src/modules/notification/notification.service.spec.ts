import { jest } from '@jest/globals';
import { Types } from 'mongoose';

import { maskPhone } from './channels/sms.service.js';
import { NotificationService, prefsOf } from './notification.service.js';

const userId = new Types.ObjectId();

/** Dựng service với model / kênh giả; `online` = người nhận đang mở web. */
const setup = (
  user: Record<string, unknown>,
  { online = false, deadTokens = [] as string[] } = {},
) => {
  const doc = {
    id: new Types.ObjectId().toString(),
    user: userId,
    kind: 'info',
    title: 'Tin đã được duyệt',
    message: '"Phòng đẹp" đang hiển thị.',
    link: '/phong-tro/1',
    read: false,
    createdAt: new Date(),
  };
  const notificationModel = {
    insertMany: jest.fn(async () => [doc]),
  };
  const userUpdates: unknown[] = [];
  const userModel = {
    find: () => ({
      select: () => ({
        exec: async () => [{ id: userId.toString(), ...user }],
      }),
    }),
    updateOne: (_filter: unknown, update: unknown) => {
      userUpdates.push(update);
      return { exec: async () => undefined };
    },
  };
  const realtime = {
    emitToUser: jest.fn(),
    isOnline: jest.fn(async () => online),
  };
  const push = {
    isEnabled: true,
    send: jest.fn(async () => deadTokens),
  };
  const mail = { isEnabled: true, send: jest.fn(async () => undefined) };
  const sms = { isEnabled: true, send: jest.fn(async () => undefined) };
  const service = new NotificationService(
    notificationModel as never,
    userModel as never,
    realtime as never,
    push as never,
    mail as never,
    sms as never,
    { get: () => 'https://troi.vn,http://localhost:3001' } as never,
  );
  /** notify chạy gửi ở nền → chờ microtask xong. */
  const notify = async () => {
    await service.notify([
      { user: userId, input: { kind: 'info', title: doc.title } },
    ]);
    await new Promise((resolve) => setImmediate(resolve));
  };
  return { notify, realtime, push, mail, sms, userUpdates };
};

const base = { phone: '+84901234567', pushTokens: ['t1', 't2'] };

describe('NotificationService — kênh gửi', () => {
  it('luôn đẩy realtime; đang mở web → không push', async () => {
    const { notify, realtime, push } = setup(base, { online: true });
    await notify();
    expect(realtime.emitToUser).toHaveBeenCalledWith(
      userId.toString(),
      'notification:new',
      expect.objectContaining({ title: 'Tin đã được duyệt' }),
    );
    expect(push.send).not.toHaveBeenCalled();
  });

  it('không mở web → push tới mọi token, token chết bị xoá', async () => {
    const { notify, push, userUpdates } = setup(base, { deadTokens: ['t2'] });
    await notify();
    expect(push.send).toHaveBeenCalledWith(
      ['t1', 't2'],
      expect.objectContaining({ link: '/phong-tro/1' }),
    );
    expect(userUpdates).toContainEqual({ $pullAll: { pushTokens: ['t2'] } });
  });

  it('email chỉ khi có email và bật; link theo origin đầu tiên của WEB_ORIGIN', async () => {
    const noEmail = setup(base);
    await noEmail.notify();
    expect(noEmail.mail.send).not.toHaveBeenCalled();

    const withEmail = setup({ ...base, email: 'a@b.vn' });
    await withEmail.notify();
    expect(withEmail.mail.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.vn',
        text: expect.stringContaining('https://troi.vn/phong-tro/1'),
      }),
    );

    const optedOut = setup({
      ...base,
      email: 'a@b.vn',
      notifyPrefs: { email: false },
    });
    await optedOut.notify();
    expect(optedOut.mail.send).not.toHaveBeenCalled();
  });

  it('SMS mặc định tắt, chỉ gửi khi người dùng bật', async () => {
    const off = setup(base);
    await off.notify();
    expect(off.sms.send).not.toHaveBeenCalled();

    const on = setup({ ...base, notifyPrefs: { sms: true } });
    await on.notify();
    expect(on.sms.send).toHaveBeenCalledWith(
      '+84901234567',
      expect.stringContaining('Tin đã được duyệt'),
    );
  });

  it('prefsOf: mặc định push + email bật, SMS tắt', () => {
    expect(prefsOf(null)).toEqual({ push: true, email: true, sms: false });
    expect(prefsOf({ notifyPrefs: { push: false } } as never)).toEqual({
      push: false,
      email: true,
      sms: false,
    });
  });

  it('maskPhone che giữa số khi ghi log', () => {
    expect(maskPhone('+84901234567')).toBe('+849*****567');
  });
});
