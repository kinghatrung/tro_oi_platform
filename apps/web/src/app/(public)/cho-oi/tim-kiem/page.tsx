import type { Metadata } from 'next';
import { Card, Col, Row } from 'antd';

import { searchProducts } from '@/api/products';
import { EmptyState, EmptyVariant } from '@/components/common';
import { ProductResultsList, ProductSearchFilters } from '@/components/sections';
import { toProductSearchRequest } from '@/lib/searchFilters';
import { loadSiteSettings } from '@/lib/siteSettings';

export const metadata: Metadata = {
  title: 'Tìm đồ cũ – Chợ ơi',
};

const PAGE_SIZE = 24;

interface ProductSearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Trang tìm kiếm Chợ ơi (bố cục như /tim-kiem): bộ lọc / sắp xếp / trang đọc từ URL → GET /products. */
export default async function ProductSearchPage({ searchParams }: ProductSearchPageProps) {
  const { enableMarketplace } = await loadSiteSettings();
  if (!enableMarketplace) {
    return (
      <Card variant="borderless">
        <EmptyState
          variant={EmptyVariant.SEARCH}
          description="Chợ ơi đang tạm đóng, bạn quay lại sau nhé."
        />
      </Card>
    );
  }
  const { items, total, page } = await searchProducts(
    toProductSearchRequest(await searchParams, PAGE_SIZE),
  );

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <ProductSearchFilters />
      </Col>
      <Col span={24}>
        <ProductResultsList items={items} total={total} pageSize={PAGE_SIZE} currentPage={page} />
      </Col>
    </Row>
  );
}
