/**
 * Format DUY NHẤT mọi endpoint API trả về (cả thành công lẫn lỗi).
 * Backend bắt buộc trả đúng shape này; FE đọc qua src/api/axiosClient.ts.
 *
 * - `code`: trùng HTTP status (200, 201, 400, 401, 403, 404, 500...). `code < 400` = thành công.
 * - `message`: luôn có, tiếng Việt — FE hiển thị trực tiếp cho người dùng khi lỗi.
 * - `data`: payload khi thành công; `null` khi lỗi hoặc thao tác không trả dữ liệu.
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** Response phân trang chuẩn từ API. */
export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
