import { Types } from 'mongoose';

import type { AuthUser } from './current-user.decorator.js';

import { describeModeration, nextModerationNote } from './moderation.js';

const item = { id: 'abc', title: 'Phòng đẹp' };

describe('describeModeration', () => {
  it('chỉ sửa nội dung (không đổi trạng thái) → không ghi gì', () => {
    expect(describeModeration('listing', item, 'active', 'active')).toBeNull();
  });

  it('duyệt tin chờ → thông báo thành công, link trang công khai', () => {
    const result = describeModeration('listing', item, 'pending', 'active');
    expect(result?.action).toBe('Duyệt');
    expect(result?.notice).toMatchObject({
      kind: 'success',
      link: '/phong-tro/abc',
    });
  });

  it('từ chối tin chờ → lỗi, link về trang quản lý', () => {
    const result = describeModeration('product', item, 'pending', 'closed');
    expect(result?.action).toBe('Từ chối');
    expect(result?.notice).toMatchObject({
      kind: 'error',
      link: '/kenh-nguoi-dang/do-ban',
    });
    expect(result?.notice.title).toContain('Món đồ');
  });

  it('ẩn tin đang hiển thị / hiện lại / xoá', () => {
    expect(
      describeModeration('listing', item, 'active', 'closed')?.action,
    ).toBe('Ẩn');
    expect(
      describeModeration('listing', item, 'expired', 'active')?.action,
    ).toBe('Hiển thị lại');
    expect(describeModeration('listing', item, 'active', null)?.action).toBe(
      'Xoá',
    );
  });
});

describe('Lý do từ chối / ẩn', () => {
  const owner = new Types.ObjectId();
  const admin: AuthUser = {
    sub: new Types.ObjectId().toString(),
    phone: '+84900000000',
    role: 'admin',
  };
  const self: AuthUser = {
    sub: owner.toString(),
    phone: '+84900000001',
    role: 'landlord',
  };

  it('nối lý do vào thông báo khi từ chối / ẩn, không nối khi duyệt', () => {
    const reject = describeModeration(
      'listing',
      item,
      'pending',
      'closed',
      'Ảnh mờ',
    );
    expect(reject?.notice.message).toContain('Lý do: Ảnh mờ');
    const approve = describeModeration(
      'listing',
      item,
      'pending',
      'active',
      'x',
    );
    expect(approve?.notice.message).not.toContain('Lý do');
  });

  it('nextModerationNote: admin ẩn → lưu; hiển thị lại → xoá; chủ tin tự đổi → giữ', () => {
    expect(
      nextModerationNote(
        admin,
        owner,
        'pending',
        'closed',
        ' Ảnh mờ ',
        undefined,
      ),
    ).toBe('Ảnh mờ');
    expect(
      nextModerationNote(admin, owner, 'pending', 'closed', '  ', 'cũ'),
    ).toBeUndefined();
    expect(
      nextModerationNote(admin, owner, 'closed', 'active', undefined, 'cũ'),
    ).toBeUndefined();
    expect(
      nextModerationNote(self, owner, 'active', 'closed', 'tự đặt', 'cũ'),
    ).toBe('cũ');
    expect(
      nextModerationNote(admin, owner, 'closed', 'closed', 'mới', 'cũ'),
    ).toBe('cũ');
  });
});
