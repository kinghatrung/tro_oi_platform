import { describeModeration } from './moderation.js';

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
