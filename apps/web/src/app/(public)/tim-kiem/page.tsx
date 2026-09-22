import { Row, Col } from 'antd';

import { SearchFilters } from '@/components/sections';
import { SearchResultsList } from '@/components/common';

import type { SearchPageProps } from './type';
import { mockListings, PAGE_SIZE } from './const';

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const minPrice = Number(params.minPrice) * 1_000_000;
  const maxPrice = Number(params.maxPrice) * 1_000_000;
  const filteredListings = mockListings.filter(
    (listing) =>
      (!params.transaction || listing.transaction === params.transaction) &&
      (!params.category || listing.category === params.category) &&
      (!minPrice || listing.price >= minPrice) &&
      (!maxPrice || listing.price <= maxPrice),
  );
  const totalItems = filteredListings.length;
  const maxPage = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const requestedPage = params.page && /^\d+$/.test(params.page) ? Number(params.page) : 1;
  const currentPage = Math.min(Math.max(requestedPage, 1), maxPage);
  const pageOffset = (currentPage - 1) * PAGE_SIZE;
  const listings = filteredListings.slice(pageOffset, pageOffset + PAGE_SIZE);

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <SearchFilters />
      </Col>

      <Col span={24}>
        <SearchFilters />
      </Col>

      <Col span={24}>
        <SearchFilters />
      </Col>

      <Col lg={18} md={24} xs={24}>
        <SearchResultsList
          items={listings}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          currentPage={currentPage}
        />
      </Col>
    </Row>
  );
}
