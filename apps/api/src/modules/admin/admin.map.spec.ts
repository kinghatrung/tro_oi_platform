import { geoFilter } from './admin.service.js';

describe('geoFilter (bản đồ quản trị)', () => {
  it('không có / thiếu cạnh khung nhìn → chỉ cần có toạ độ', () => {
    expect(geoFilter({})).toEqual({
      'address.geo.latitude': { $exists: true },
    });
    expect(geoFilter({ minLat: 20, maxLat: 22, minLng: 105 })).toEqual({
      'address.geo.latitude': { $exists: true },
    });
  });

  it('đủ 4 cạnh → lọc trong khung', () => {
    expect(
      geoFilter({ minLat: 20, maxLat: 22, minLng: 105, maxLng: 106.5 }),
    ).toEqual({
      'address.geo.latitude': { $gte: 20, $lte: 22 },
      'address.geo.longitude': { $gte: 105, $lte: 106.5 },
    });
  });
});
