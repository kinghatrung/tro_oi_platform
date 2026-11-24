import { identityOf, mergeBlocker } from './account-merge.service.js';

describe('AccountMergeService — quy tắc gộp', () => {
  it('token SĐT / Google → định danh cần tìm; nhà cung cấp khác → null', () => {
    expect(
      identityOf({
        uid: 'p',
        phone_number: '+84901234567',
        firebase: { sign_in_provider: 'phone' },
      }),
    ).toEqual({ phone: '+84901234567' });
    expect(
      identityOf({ uid: 'g-1', firebase: { sign_in_provider: 'google.com' } }),
    ).toEqual({ firebaseUid: 'g-1', socialProvider: 'google.com' });
    expect(
      identityOf({ uid: 'x', firebase: { sign_in_provider: 'password' } }),
    ).toBeNull();
    // Token SĐT thiếu số → không gộp mò
    expect(
      identityOf({ uid: 'p', firebase: { sign_in_provider: 'phone' } }),
    ).toBeNull();
  });

  it('không gộp chính mình, tài khoản quản trị, tài khoản bị khoá', () => {
    const me = { id: 'a' };
    const other = { id: 'b', role: 'renter' as const, isBlocked: false };
    expect(mergeBlocker(me, other)).toBeNull();
    expect(mergeBlocker(me, { ...other, id: 'a' })).toMatch('chính là');
    expect(mergeBlocker(me, { ...other, role: 'admin' })).toMatch('quản trị');
    expect(mergeBlocker(me, { ...other, isBlocked: true })).toMatch('bị khoá');
  });
});
