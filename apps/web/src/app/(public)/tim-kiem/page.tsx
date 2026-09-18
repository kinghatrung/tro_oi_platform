import { Row, Col, Flex } from 'antd';

import { SearchFilters } from '@/components/sections';
import { CardItemSearch } from '@/components/common';

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
      <Col span={24}>
        <SearchFilters />
      </Col>

      <Col lg={18} md={24} xs={24}>
        <Flex gap={4} vertical>
          <CardItemSearch />
          <CardItemSearch />
          <CardItemSearch />
          <CardItemSearch />
          <CardItemSearch />
          <CardItemSearch />
          <CardItemSearch />
        </Flex>
      </Col>

      <Col lg={6} md={24} xs={24}>
        {/* <CardItemSearch /> */}
        hello
      </Col>
    </Row>
  );
}
