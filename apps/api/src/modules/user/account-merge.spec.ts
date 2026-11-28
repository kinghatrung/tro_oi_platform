import { Types } from 'mongoose';

import type { SavedSearch } from '../auth/schemas/user.schema.js';
import {
  identityOf,
  mergeBlocker,
  mergedConversation,
  mergeSavedSearches,
} from './account-merge.service.js';

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

describe('AccountMergeService — đồng bộ dữ liệu khi gộp', () => {
  const search = (query: string) =>
    ({ query, title: query, createdAt: new Date() }) as SavedSearch;

  it('tìm kiếm đã lưu: bỏ bản trùng bộ lọc của tài khoản kia', () => {
    expect(
      mergeSavedSearches(
        [search('city=Hà+Nội')],
        [search('city=Hà+Nội'), search('city=Đà+Nẵng')],
      ).map((item) => item.query),
    ).toEqual(['city=Hà+Nội', 'city=Đà+Nẵng']);
  });

  it('2 cuộc trò chuyện cùng tin: cộng số chưa đọc, lấy tin cuối mới hơn', () => {
    const at = (iso: string) => new Date(iso);
    const message = (content: string, iso: string) => ({
      id: new Types.ObjectId(),
      sender: new Types.ObjectId(),
      content,
      createdAt: at(iso),
    });
    const kept = {
      lastMessage: message('cũ', '2026-11-01'),
      unreadByStarter: 1,
      unreadByOwner: 0,
      updatedAt: at('2026-11-01'),
    };
    const duplicate = {
      lastMessage: message('mới', '2026-11-20'),
      unreadByStarter: 0,
      unreadByOwner: 2,
      updatedAt: at('2026-11-20'),
    };
    expect(mergedConversation(kept, duplicate)).toEqual({
      $inc: { unreadByStarter: 0, unreadByOwner: 2 },
      $set: {
        lastMessage: duplicate.lastMessage,
        updatedAt: duplicate.updatedAt,
      },
    });
    // Cuộc giữ lại có tin mới hơn → chỉ cộng số chưa đọc
    expect(mergedConversation(duplicate, kept)).toEqual({
      $inc: { unreadByStarter: 1, unreadByOwner: 0 },
    });
  });
});
