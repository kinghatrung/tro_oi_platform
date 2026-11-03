import { assertOwnerStatusChange } from './status-rules.js';

const OWNER = ['active', 'closed'] as const;

describe('assertOwnerStatusChange', () => {
  it('chủ tin được ẩn/hiện tin đang hiển thị', () => {
    expect(() =>
      assertOwnerStatusChange('active', 'closed', OWNER, false),
    ).not.toThrow();
    expect(() =>
      assertOwnerStatusChange('closed', 'active', OWNER, false),
    ).not.toThrow();
  });

  it('không đổi status hoặc giữ nguyên → luôn hợp lệ', () => {
    expect(() =>
      assertOwnerStatusChange('pending', undefined, OWNER, false),
    ).not.toThrow();
    expect(() =>
      assertOwnerStatusChange('pending', 'pending', OWNER, false),
    ).not.toThrow();
  });

  it('chủ tin không tự duyệt tin đang chờ', () => {
    expect(() =>
      assertOwnerStatusChange('pending', 'active', OWNER, false),
    ).toThrow('Tin đang chờ duyệt');
  });

  it('chủ tin không chuyển sang trạng thái ngoài danh sách', () => {
    expect(() =>
      assertOwnerStatusChange('active', 'pending', OWNER, false),
    ).toThrow('Không thể chuyển');
  });

  it('admin được đổi mọi trạng thái', () => {
    expect(() =>
      assertOwnerStatusChange('pending', 'active', OWNER, true),
    ).not.toThrow();
  });
});
