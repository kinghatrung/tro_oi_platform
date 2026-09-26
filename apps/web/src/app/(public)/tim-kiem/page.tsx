import { Row, Col } from 'antd';
import { firstQueryValue, parsePriceRange } from '@/lib/searchFilters';

import { SearchFilters } from '@/components/sections';
import { SearchResultsList } from '@/components/common';

import type { SearchPageProps } from './type';
import { mockListings, PAGE_SIZE } from './const';

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const { minPrice, maxPrice, valid } = parsePriceRange(params.minPrice, params.maxPrice);
  const transaction = firstQueryValue(params.transaction);
  const category = firstQueryValue(params.category);
  const filteredListings = mockListings.filter(
    (listing) =>
      valid &&
      (!transaction || listing.transaction === transaction) &&
      (!category || listing.category === category) &&
      (minPrice === undefined || listing.price >= minPrice) &&
      (maxPrice === undefined || listing.price <= maxPrice),
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

      <Col lg={18} md={24} xs={24}>
        {!valid && (
          <p role="alert" className="mb-4 text-red-600">
            Khoảng giá không hợp lệ. Vui lòng nhập số không âm và giá tối đa không nhỏ hơn giá tối
            thiểu.
          </p>
        )}
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
