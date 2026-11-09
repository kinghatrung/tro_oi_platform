/**
 * Chuyển địa chỉ từ mô hình 3 cấp (trước 1/7/2025) sang 2 cấp: tỉnh/thành → phường/xã.
 * shortcut: chỉ đổi tên các tỉnh web từng cho chọn (5 thành phố cũ); địa chỉ ở tỉnh khác được báo để sửa tay.
 */
export const PROVINCE_RENAMES: Record<string, string> = {
  'Bình Dương': 'Hồ Chí Minh',
};

const PREFIX = /^(Phường|Xã|Đặc khu)\s+/i;
const bare = (name: string) => name.replace(PREFIX, '').trim().toLowerCase();

export interface OldAddress {
  city: string;
  ward?: string;
  district?: string;
}

/**
 * Trả địa chỉ mới, hoặc `unmatched: true` nếu không xác định được phường/xã.
 * Quận cũ trùng tên 1 phường mới (vd "Cầu Giấy" → "Phường Cầu Giấy") → dùng phường đó, bỏ quận.
 */
export function migrateAddress(
  address: OldAddress,
  wardsByProvince: Record<string, string[]>,
): OldAddress & { unmatched: boolean } {
  const city = PROVINCE_RENAMES[address.city] ?? address.city;
  const wards = wardsByProvince[city] ?? [];
  if (address.ward && wards.includes(address.ward)) {
    return { ...address, city, unmatched: false };
  }
  const fromDistrict =
    address.district &&
    wards.find((ward) => bare(ward) === bare(address.district!));
  if (fromDistrict) {
    return { city, ward: fromDistrict, unmatched: false };
  }
  return { ...address, city, unmatched: true };
}
