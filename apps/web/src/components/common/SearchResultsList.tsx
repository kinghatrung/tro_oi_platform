'use client';

import { useCallback, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Row, Col, Flex, Empty } from 'antd';
import type { Listing } from '@tro-oi/shared';

import { DEFAULT_SORT } from '@/constants';
import { formatNumber } from '@/utils/helpers';

import { HeaderToolbar, type ViewMode } from './HeaderToolbar';
import { CardItem } from './CardItem';
import { PaginationControl } from './PaginationControl';

interface SearchResultsListProps {
  items: Listing[];
  totalItems: number;
  pageSize: number;
  currentPage: number;
}

/** Danh sách kết quả tìm kiếm: sort lưu trên URL (?sort=), view mode lưu cục bộ. */
export function SearchResultsList({
  items,
  totalItems,
  pageSize,
  currentPage,
}: SearchResultsListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const sortKey = searchParams.get('sort') ?? DEFAULT_SORT;

  const handleSortChange = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (key === DEFAULT_SORT) params.delete('sort');
      else params.set('sort', key);
      params.delete('page');
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );

  return (
    <Flex vertical gap={4}>
      <HeaderToolbar
        sortKey={sortKey}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        extra={`${formatNumber(totalItems)} tin đăng`}
      />

      {items.length === 0 ? (
        <div className="bg-white py-12">
          <Empty description="Không có tin phù hợp" />
        </div>
      ) : viewMode === 'list' ? (
        <Flex vertical gap={4}>
          {items.map((item) => (
            <CardItem key={item.id} column listing={item} />
          ))}
        </Flex>
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item) => (
            <Col key={item.id} xs={24} sm={12} md={12} lg={8}>
              <CardItem listing={item} />
            </Col>
          ))}
        </Row>
      )}

      {totalItems > pageSize && (
        <PaginationControl total={totalItems} pageSize={pageSize} currentPage={currentPage} />
      )}
    </Flex>
  );
}
