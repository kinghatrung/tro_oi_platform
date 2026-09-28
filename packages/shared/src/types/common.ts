/** Tọa độ địa lý (WGS84), dùng cho bản đồ Leaflet và tìm kiếm theo vị trí. */
export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** Địa chỉ hành chính đầy đủ của tin đăng/sản phẩm/công việc. */
export interface AddressInfo {
  /** Số nhà, tên đường. */
  street?: string;
  /** Phường/xã. */
  ward?: string;
  /** Quận/huyện. */
  district?: string;
  /** Tỉnh/thành phố. */
  city?: string;
  /** Địa chỉ đầy đủ đã ghép sẵn để hiển thị. */
  fullAddress?: string;
  geo?: GeoPoint;
}

/** Option cho select/dropdown — thường derive từ enum + label map tương ứng. */
export interface SelectOption<TValue = string> {
  value: TValue;
  label: string;
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}

/** Tham số phân trang/sắp xếp dùng chung cho mọi endpoint danh sách. */
export interface BaseListRequest {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: SortDirection;
}
