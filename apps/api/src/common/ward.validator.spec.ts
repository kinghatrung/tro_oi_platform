import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { CreateListingDto } from '../modules/listing/dto/listing.dto.js';
import { isWardOf } from './ward.validator.js';
import { WARDS } from './wards.js';

const wardErrors = (city: string, ward: string) =>
  validateSync(
    plainToInstance(CreateListingDto, {
      title: 'Phòng trọ khép kín đầy đủ',
      category: 'phong-tro',
      transaction: 'rent-room',
      price: 3_000_000,
      images: ['http://localhost:5000/uploads/a.jpg'],
      address: { city, ward, geo: { latitude: 21, longitude: 105 } },
    }),
  )
    .flatMap((error) => error.children ?? [])
    .filter((error) => error.property === 'ward');

describe('IsWardOf', () => {
  it('dữ liệu tự sinh: 34 tỉnh, 3.321 phường/xã', () => {
    expect(Object.keys(WARDS)).toHaveLength(34);
    expect(Object.values(WARDS).flat()).toHaveLength(3321);
  });

  it('phường thuộc đúng tỉnh mới hợp lệ', () => {
    expect(isWardOf('Phường Cầu Giấy', 'Hà Nội')).toBe(true);
    expect(isWardOf('Phường Cầu Giấy', 'Hồ Chí Minh')).toBe(false);
    expect(isWardOf('Cầu Giấy', 'Hà Nội')).toBe(false); // thiếu "Phường"
    expect(isWardOf('Phường Cầu Giấy', 'Tỉnh lạ')).toBe(false);
  });

  it('DTO tin đăng: phường khác tỉnh → lỗi tiếng Việt', () => {
    expect(wardErrors('Hà Nội', 'Phường Cầu Giấy')).toHaveLength(0);
    expect(
      wardErrors('Hồ Chí Minh', 'Phường Cầu Giấy')[0]?.constraints,
    ).toEqual({ isWardOf: 'Phường/xã không thuộc tỉnh/thành đã chọn' });
  });
});
