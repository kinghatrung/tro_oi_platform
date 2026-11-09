import { migrateAddress } from './admin-units-migration.js';

const wards = {
  'Hà Nội': ['Phường Cầu Giấy', 'Phường Nghĩa Đô'],
  'Hồ Chí Minh': ['Phường Thủ Dầu Một', 'Phường Dĩ An'],
};

describe('migrateAddress', () => {
  it('quận cũ trùng tên phường mới → đặt phường, bỏ quận', () => {
    expect(
      migrateAddress({ city: 'Hà Nội', district: 'cầu giấy' }, wards),
    ).toEqual({
      city: 'Hà Nội',
      ward: 'Phường Cầu Giấy',
      unmatched: false,
    });
  });

  it('tỉnh đã sáp nhập đổi tên (Bình Dương → Hồ Chí Minh)', () => {
    expect(
      migrateAddress({ city: 'Bình Dương', district: 'Thủ Dầu Một' }, wards),
    ).toMatchObject({ city: 'Hồ Chí Minh', ward: 'Phường Thủ Dầu Một' });
  });

  it('đã có phường hợp lệ → giữ nguyên', () => {
    expect(
      migrateAddress(
        { city: 'Hà Nội', ward: 'Phường Nghĩa Đô', district: 'Cầu Giấy' },
        wards,
      ),
    ).toMatchObject({
      ward: 'Phường Nghĩa Đô',
      district: 'Cầu Giấy',
      unmatched: false,
    });
  });

  it('không khớp được → giữ dữ liệu cũ, đánh dấu để sửa tay', () => {
    expect(
      migrateAddress(
        { city: 'Hà Nội', ward: 'Dịch Vọng', district: 'Quận Lạ' },
        wards,
      ),
    ).toEqual({
      city: 'Hà Nội',
      ward: 'Dịch Vọng',
      district: 'Quận Lạ',
      unmatched: true,
    });
  });
});
