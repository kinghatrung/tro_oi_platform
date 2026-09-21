import { Row, Col } from 'antd';

import { SearchFilters } from '@/components/sections';
import { SearchResultsList } from '@/components/common';

import { SearchPageProps } from './type';
import { mockListings, TOTAL_ITEMS, PAGE_SIZE } from './const';

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
    </Row>
  );
}
