import { Row, Col, Flex } from 'antd';

import { SearchFilters, SearchResults, type SearchListing } from '@/components/sections';

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

const authorData = {
  name: 'Minh Huyên',
  posted: 12,
  rank: 'Chuyên gia',
};

// Mock: tổng số tin đăng (thay bằng API thực tế)
const TOTAL_ITEMS = 120;
const PAGE_SIZE = 5;

const districts = ['Quận Đống Đa', 'Quận Cầu Giấy', 'Quận Ba Đình', 'Quận Thanh Xuân'];
const streets = ['Phố Tôn Đức Thắng', 'Đường Nguyễn Khang', 'Phố Kim Mã', 'Đường Nguyễn Trãi'];
const categories = ['phong-tro', 'can-ho', 'nguyen-can', 'o-ghep'];
const propertyTypes = ['Phòng trọ', 'Căn hộ', 'Nhà nguyên căn', 'Ở ghép'];
const furnishings = ['Nội thất đầy đủ', 'Nội thất cơ bản', 'Không nội thất'];

const createListing = (id: number): SearchListing => {
  const categoryIndex = id % categories.length;
  const area = 24 + (id % 7) * 3;
  const price = 2_800_000_000 + (id % 10) * 110_000_000;

  return {
    id,
    title: 'Giảm 300tr- 30M2 3 tầng hẻm xe hơi - Emart 2 Sổ mới 2026',
    price,
    countMedia: 5 + (id % 4),
    bedrooms: 1 + (id % 4),
    propertyType: propertyTypes[categoryIndex],
    mainDirection: id % 2 === 0 ? 'Đông Nam' : 'Tây Bắc',
    pricePerSquareMeter: Math.round(price / area),
    timeAgo: `2026-09-${String(7 + (id % 10)).padStart(2, '0')}T09:00:00+07:00`,
    area,
    district: districts[categoryIndex],
    street: streets[categoryIndex],
    floorCount: 2 + (id % 5),
    furnishing: furnishings[id % furnishings.length],
    address: `${districts[categoryIndex]} (${streets[categoryIndex]})`,
    author: authorData,
    authorType: id % 2 === 0 ? 'personal' : 'broker',
    hasVideo: id % 3 === 0,
    transaction: id % 3 === 0 ? 'buy-room' : 'rent-room',
    category: categories[categoryIndex],
  };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const maxPage = Math.ceil(TOTAL_ITEMS / PAGE_SIZE);
  const parsedPage = params.page && /^\d+$/.test(params.page) ? Number(params.page) : Number.NaN;
  const currentPage =
    Number.isInteger(parsedPage) && parsedPage > 0 ? Math.min(parsedPage, maxPage) : 1;
  const pageOffset = (currentPage - 1) * PAGE_SIZE;
  const listings = Array.from(
    { length: Math.min(PAGE_SIZE, TOTAL_ITEMS - pageOffset) },
    (_, index) => createListing(pageOffset + index),
  );

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <SearchFilters />
      </Col>

      <Col lg={18} md={24} xs={24}>
        <Flex gap={4} vertical>
          <SearchResults
            listings={listings}
            total={TOTAL_ITEMS}
            pageSize={PAGE_SIZE}
            currentPage={currentPage}
          />
        </Flex>
      </Col>

      <Col lg={6} md={24} xs={24}>
        {/* <CardItemSearch /> */}
        hello
      </Col>
    </Row>
  );
}
