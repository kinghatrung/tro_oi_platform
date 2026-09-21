import type { PropertyItem } from '@/components/common';

interface SearchListing extends PropertyItem {
  transaction: string;
  category: string;
}

export const authorData = {
  name: 'Minh Huyên',
  posted: 12,
  rank: 'Chuyên gia',
};

export const TOTAL_ITEMS = 120;
export const PAGE_SIZE = 6;

const categories = ['phong-tro', 'can-ho', 'nguyen-can', 'o-ghep'] as const;
const propertyTypes = ['Phòng trọ', 'Căn hộ', 'Nhà nguyên căn', 'Ở ghép'] as const;
const districts = ['Đống Đa', 'Cầu Giấy', 'Ba Đình', 'Thanh Xuân'] as const;

export const mockListings: SearchListing[] = Array.from({ length: TOTAL_ITEMS }, (_, index) => {
  const id = index + 1;
  const categoryIndex = index % categories.length;
  const area = 24 + (index % 7) * 3;
  const price = 2_800_000_000 + (index % 10) * 110_000_000;

  return {
    id,
    title: 'Giảm 300tr - 30M2 3 tầng hẻm xe hơi - Emart 2 Sổ mới 2026',
    price,
    countMedia: 5 + (index % 4),
    bedrooms: 1 + (index % 4),
    propertyType: propertyTypes[categoryIndex],
    mainDirection: index % 2 === 0 ? 'Đông Nam' : 'Tây Bắc',
    pricePerSquareMeter: Math.round(price / area),
    timeAgo: `2026-09-${String(7 + (index % 10)).padStart(2, '0')}T09:00:00+07:00`,
    area,
    address: `P. ${districts[categoryIndex]} - Hà Nội`,
    location: 'Hà Nội',
    district: districts[categoryIndex],
    street: 'Ngõ xe hơi',
    floorCount: 2 + (index % 5),
    furnishing: 'Nội thất cơ bản',
    author: authorData,
    transaction: index % 3 === 0 ? 'buy-room' : 'rent-room',
    category: categories[categoryIndex],
  };
});
