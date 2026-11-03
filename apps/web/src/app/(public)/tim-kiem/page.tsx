import type { Metadata } from 'next';
import { Row, Col } from 'antd';

import { searchListings } from '@/api/listings';
import { SearchResultsList } from '@/components/common';
import { SearchFilters } from '@/components/sections';
import { toSearchRequest } from '@/lib/searchFilters';

import { PAGE_SIZE } from './const';
import type { SearchPageProps } from './type';

export const metadata: Metadata = {
  title: 'Tìm phòng trọ, căn hộ, nhà nguyên căn',
};

/** Trang tìm kiếm: filter/sort/page đọc từ URL, dữ liệu lấy từ GET /listings. */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { request, isPriceValid } = toSearchRequest(await searchParams, PAGE_SIZE);
  const { items, total, page } = await searchListings(request);

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <SearchFilters />
      </Col>

      <Col lg={18} md={24} xs={24}>
        {!isPriceValid && (
          <p role="alert" className="mb-4 text-red-600">
            Khoảng giá không hợp lệ. Vui lòng nhập số không âm và giá tối đa không nhỏ hơn giá tối
            thiểu.
          </p>
        )}
        <SearchResultsList
          items={items}
          totalItems={total}
          pageSize={PAGE_SIZE}
          currentPage={page}
        />
      </Col>
    </Row>
  );
}
