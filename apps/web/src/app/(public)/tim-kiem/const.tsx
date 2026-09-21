import type { PropertyItem } from '@/components/common';

export const authorData = {
  name: 'Minh Huyên',
  posted: 12,
  rank: 'Chuyên gia',
};

export const TOTAL_ITEMS = 120;
export const PAGE_SIZE = 6;

export const mockListings: PropertyItem[] = Array.from({ length: PAGE_SIZE }).map((_, index) => ({
  id: index + 1,
  title: 'Giảm 300tr - 30M2 3 tầng hẻm xe hơi - Emart 2 Sổ mới 2026',
  price: 3350000000,
  countMedia: 5,
  bedrooms: 3,
  propertyType: 'Đã có sổ',
  mainDirection: 'Đông Nam',
  pricePerSquareMeter: 111670000,
  timeAgo: '2026-09-07T09:00:00+07:00',
  area: 30,
  address: 'P. Văn Miếu - Quốc Tử Giám',
  location: 'Hà Nội',
  district: 'Đống Đa',
  street: 'Ngõ xe hơi',
  floorCount: 3,
  furnishing: 'Nội thất cơ bản',
  author: authorData,
}));
