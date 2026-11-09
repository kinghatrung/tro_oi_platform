import {
  matchesSavedSearch,
  type MatchableListing,
} from './saved-search-match.js';

const listing: MatchableListing = {
  title: 'Phòng trọ khép kín gần ĐH Quốc gia',
  transaction: 'rent-room',
  category: 'phong-tro',
  price: 3_200_000,
  area: 25,
  bedrooms: 1,
  amenities: ['wifi', 'parking'],
  address: {
    city: 'Hà Nội',
    ward: 'Phường Cầu Giấy',
    fullAddress: 'Số 10 Xuân Thuỷ, Cầu Giấy, Hà Nội',
  },
};

const match = (query: string) => matchesSavedSearch(listing, query);

describe('matchesSavedSearch', () => {
  it('tìm kiếm rỗng khớp mọi tin', () => {
    expect(match('')).toBe(true);
  });

  it('khu vực, loại hình, giá (triệu), diện tích, tiện ích', () => {
    expect(
      match(
        'transaction=rent-room&category=phong-tro&city=H%C3%A0+N%E1%BB%99i&ward=Ph%C6%B0%E1%BB%9Dng+C%E1%BA%A7u+Gi%E1%BA%A5y&minPrice=3&maxPrice=4&minArea=20&amenities=wifi',
      ),
    ).toBe(true);
    expect(match('city=H%E1%BB%93+Ch%C3%AD+Minh')).toBe(false);
    expect(match('ward=Ph%C6%B0%E1%BB%9Dng+Ngh%C4%A9a+%C4%90%C3%B4')).toBe(false); // phường khác
    expect(match('maxPrice=3')).toBe(false);
    expect(match('category=can-ho')).toBe(false);
    expect(match('amenities=wifi,elevator')).toBe(false);
    expect(match('bedrooms=2')).toBe(false);
  });

  it('keyword tìm trong tiêu đề hoặc địa chỉ, không phân biệt hoa thường', () => {
    expect(match('keyword=xu%C3%A2n+thu%E1%BB%B7')).toBe(true);
    expect(match('keyword=KH%C3%89P+K%C3%8DN')).toBe(true);
    expect(match('keyword=penthouse')).toBe(false);
  });

  it('giá trị sai định dạng → bỏ qua bộ lọc đó', () => {
    expect(match('minPrice=abc&sort=newest&page=3')).toBe(true);
  });
});
