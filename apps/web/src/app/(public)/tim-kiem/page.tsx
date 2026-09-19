import { Row, Col } from 'antd';

import { SearchFilters } from '@/components/sections';
import { SearchResultsList, type PropertyItem } from '@/components/common';

interface SearchPageProps {
  searchParams: Promise<{
    keyword?: string;
    city?: string;
    district?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}

const authorData = { name: 'Minh Huyên', posted: 12, rank: 'Chuyên gia' };
// Mock: tổng số tin đăng (thay bằng API thực tế)
const TOTAL_ITEMS = 120;
const PAGE_SIZE = 6;
const mockListings: PropertyItem[] = Array.from({ length: PAGE_SIZE }).map((_, index) => ({
  id: index + 1,
  title: 'Giảm 300tr- 30M2 3 tầng hẻm xe hơi - Emart 2 Sổ mới 2026',
  price: 3350000000,
  countMedia: 5,
  bedrooms: 3,
  propertyType: 'Đã có sổ',
  mainDirection: 'Đông Nam',
  pricePerSquareMeter: 111670000,
  timeAgo: '2026-09-07T09:00:00+07:00',
  area: 30,
  address: 'Q. Đống Đa (P. Văn Miếu - Quốc Tử Giám)',
  location: 'Hà Nội',
  author: authorData,
}));

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <SearchFilters />
      </Col>

      <Col lg={18} md={24} xs={24}>
        <SearchResultsList
          items={mockListings}
          totalItems={TOTAL_ITEMS}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
        />
      </Col>

      <Col lg={6} md={24} xs={24}>
        {/* <CardItemSearch /> */} hello
      </Col>
    </Row>
  );
}
