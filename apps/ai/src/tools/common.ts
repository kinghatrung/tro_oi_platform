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

/** Số kết quả trả về cho 1 lần tìm (thẻ trong khung chat). */
export const limitField = z
  .number()
  .int()
  .min(1)
  .max(6)
  .optional()
  .describe('Số kết quả muốn lấy, mặc định 3');
