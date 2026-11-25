import { z } from 'zod';

/** Phần dữ liệu tin / món đồ mà công cụ cần (API trả nhiều hơn). */
export interface PublicItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  address?: { ward?: string; city?: string; fullAddress?: string };
}

export interface Paged<T> {
  items: T[];
  total: number;
}

export const MILLION = 1_000_000;

export const areaFields = {
  city: z
    .string()
    .max(60)
    .optional()
    .describe(
      'Tỉnh/thành, tên đầy đủ không viết tắt, vd "Hà Nội", "Hồ Chí Minh", "Đà Nẵng"',
    ),
  ward: z
    .string()
    .max(80)
    .optional()
    .describe(
      'Phường/xã/đặc khu (đơn vị mới, không còn quận), vd "Phường Cầu Giấy"',
    ),
};

/** Model hay bỏ chữ "Phường" ("Cầu Giấy") — API so khớp chính xác tên phường nên thêm lại. */
export const normalizeWard = (ward?: string) =>
  ward && !/^(phường|xã|đặc khu)\s/i.test(ward.trim())
    ? `Phường ${ward.trim()}`
    : ward?.trim();

export const shortAddress = (item: PublicItem) =>
  [item.address?.ward, item.address?.city].filter(Boolean).join(', ') ||
  undefined;

/** Agent mở trang kết quả trên web (mặc định có). */
export const openPageField = z
  .boolean()
  .optional()
  .describe(
    'Mở trang kết quả trên web cho người dùng xem (mặc định true). Đặt false khi người dùng chỉ hỏi nhanh / hỏi số lượng / đang so sánh, không cần chuyển trang',
  );

/** Đường dẫn trang tìm kiếm của web: bỏ giá trị trống, mảng nối bằng dấu phẩy (như bộ lọc web). */
export function searchPath(
  base: string,
  params: Record<string, string | number | string[] | undefined>,
) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const text = Array.isArray(value) ? value.join(',') : value;
    if (text !== undefined && text !== '') query.set(key, String(text));
  }
  const search = query.toString();
  return search ? `${base}?${search}` : base;
}

/** Đồng → "5 triệu" / "200 nghìn". */
export const formatVnd = (value: number) =>
  value >= MILLION ? `${value / MILLION} triệu` : `${value / 1000} nghìn`;

/** "3 triệu – 5 triệu", "dưới 5 triệu", "từ 3 triệu"; không có giá → undefined. */
export function priceLabel(
  min: number | undefined,
  max: number | undefined,
  format: (value: number) => string,
) {
  if (min !== undefined && max !== undefined)
    return `${format(min)} – ${format(max)}`;
  if (max !== undefined) return `dưới ${format(max)}`;
  if (min !== undefined) return `từ ${format(min)}`;
  return undefined;
}

/** Số kết quả trả về cho 1 lần tìm (thẻ trong khung chat). */
export const limitField = z
  .number()
  .int()
  .min(1)
  .max(6)
  .optional()
  .describe('Số kết quả muốn lấy, mặc định 3');
