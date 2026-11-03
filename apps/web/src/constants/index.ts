import { PropertyCategory, SortDirection, type ListingSortField } from '@tro-oi/shared';

export const CATEGORIES = [
  {
    category: PropertyCategory.ROOM,
    title: 'Phòng trọ',
    unit: 'phòng',
    image: '/logo/03_phong_tro.png',
    icon: '/images/01-duplex.svg',
  },
  {
    category: PropertyCategory.APARTMENT,
    title: 'Căn hộ',
    unit: 'căn',
    image: '/logo/04_can_ho.png',
    icon: '/images/02-apartment.svg',
  },
  {
    category: PropertyCategory.WHOLE_HOUSE,
    title: 'Nguyên căn',
    unit: 'nguyên căn',
    image: '/logo/05_nguyen_can.png',
    icon: '/images/03-house.svg',
  },
  {
    category: PropertyCategory.ROOMMATE,
    title: 'Tìm người ở ghép',
    unit: 'tin',
    image: '/logo/07_tim_nguoi_o_ghep.png',
    icon: '/images/04-family-roof.svg',
  },
] as const;

/** Ảnh hiển thị khi tin không có ảnh. */
export const NO_IMAGE = '/images/no-image.svg';

/** Tỉnh/thành hỗ trợ. Giá trị lưu nguyên văn vào address.city (khớp seed bên API). */
export const CITIES = ['Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Cần Thơ', 'Bình Dương'] as const;

/** Lựa chọn sắp xếp trên trang tìm kiếm — key lưu ở ?sort=. */
export const SORT_OPTIONS = [
  { key: 'newest', label: 'Tin mới nhất', sortBy: 'createdAt', sortDirection: SortDirection.DESC },
  {
    key: 'price-asc',
    label: 'Giá thấp đến cao',
    sortBy: 'price',
    sortDirection: SortDirection.ASC,
  },
  {
    key: 'price-desc',
    label: 'Giá cao đến thấp',
    sortBy: 'price',
    sortDirection: SortDirection.DESC,
  },
  {
    key: 'area-desc',
    label: 'Diện tích lớn nhất',
    sortBy: 'area',
    sortDirection: SortDirection.DESC,
  },
] as const satisfies readonly {
  key: string;
  label: string;
  sortBy: ListingSortField;
  sortDirection: SortDirection;
}[];

export const DEFAULT_SORT = SORT_OPTIONS[0].key;
