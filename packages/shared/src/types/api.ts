/**
 * Response contract cho các endpoint sử dụng ApiResponse.
 * Cách xử lý `data` phụ thuộc vào từng client.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
}

/** Response phân trang chuẩn từ API. */
export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
