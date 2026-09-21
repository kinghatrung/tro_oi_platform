'use client';

import { useCallback, useState } from 'react';
import { Row, Col, Flex } from 'antd';

import { HeaderToolbar } from './HeaderToolbar';
import { CardItem } from './CardItem';
import { PaginationControl } from './PaginationControl';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PropertyItem {
  id: number;
  title: string;
  price: number;
  countMedia?: number;
  bedrooms?: number;
  propertyType?: string;
  mainDirection?: string;
  pricePerSquareMeter?: number;
  timeAgo?: string;
  area?: number;
  address?: string;
  location?: string;
  imageUrl?: string;
  author?: {
    name?: string;
    posted?: number;
    rank?: string;
  };
}

interface SearchResultsListProps {
  items: PropertyItem[];
  totalItems: number;
  pageSize: number;
  currentPage: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchResultsList({
  items,
  totalItems,
  pageSize,
  currentPage,
}: SearchResultsListProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // ── Callbacks ──
  const handleViewModeChange = useCallback((mode: 'list' | 'grid') => {
    setViewMode(mode);
  }, []);

  // ── Render ──
  return (
    <Flex vertical gap={4}>
      <HeaderToolbar viewMode={viewMode} onViewModeChange={handleViewModeChange} />

      {viewMode === 'list' ? (
        <Flex vertical gap={4}>
          {items.map((item) => (
            <CardItem key={item.id} column {...item} />
          ))}
        </Flex>
      ) : (
        <Row gutter={[16, 16]}>
          {items.map((item) => (
            <Col key={item.id} xs={24} sm={12} md={12} lg={8}>
              <CardItem {...item} />
            </Col>
          ))}
        </Row>
      )}

      <PaginationControl total={totalItems} pageSize={pageSize} currentPage={currentPage} />
    </Flex>
  );
}
