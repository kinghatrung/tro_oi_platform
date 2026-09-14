import { Row, Col } from 'antd';

import { SearchFilters } from '@/components/sections';

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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;

  console.log(params);

  return (
    <Row gutter={[16, 16]}>
      <Col lg={24} md={24} xs={24}>
        <SearchFilters />
      </Col>

      <Col lg={17} md={24} xs={24}>
        hhello
      </Col>

      <Col lg={7} md={24} xs={24}>
        hhello
      </Col>
    </Row>
  );
}
