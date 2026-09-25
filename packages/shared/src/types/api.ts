/**
 * Response contract chung cho toàn bộ API.
 * Backend luôn trả về shape này; tầng middleware phía client tự unwrap `data`.
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
