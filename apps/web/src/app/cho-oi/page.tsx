import Link from 'next/link';
import type { Metadata } from 'next';
import { Button, Col, Row } from 'antd';
import { PackagePlus } from 'lucide-react';
import type { PagedResponse, ProductItem } from '@tro-oi/shared';

import { searchProducts } from '@/api/products';
import { EmptyState, EmptyVariant, PaginationControl, ProductCard } from '@/components/common';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { MarketplaceCategories, MarketplaceFilters, MarketplaceSort } from '@/components/sections';
import { toProductSearchRequest } from '@/lib/searchFilters';
import { loadSiteSettings } from '@/lib/siteSettings';
import { formatNumber } from '@/utils/helpers';

export const metadata: Metadata = {
  title: 'Chợ ơi – Pass đồ cũ',
};

const PAGE_SIZE = 12;
const HERO_TITLE = 'Đồ cũ còn tốt, giá hợp lý!';
const SEARCH_CONFIG = {
  basePath: '/cho-oi',
  placeholder: 'Bạn muốn tìm gì? VD: tủ lạnh mini, bàn học...',
  submitLabel: 'Tìm đồ',
};

interface MarketplacePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** Từ ô tìm kiếm trở xuống: danh mục → lọc + lưới sản phẩm → kêu gọi đăng bán. */
function MarketplaceSections({ items, total, page }: PagedResponse<ProductItem>) {
  return (
    <>
      <MarketplaceCategories />

      <Row gutter={[16, 16]} className="mt-6!">
        <Col xs={24} lg={6}>
          <MarketplaceFilters />
        </Col>
        <Col xs={24} lg={18}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h1 className="text-primary">Đồ mới đăng ({formatNumber(total)})</h1>
            <MarketplaceSort />
          </div>
          {items.length === 0 ? (
            <div className="rounded-lg bg-surface py-10">
              <EmptyState
                variant={EmptyVariant.SEARCH}
                description="Chưa có món đồ phù hợp. Thử bỏ bớt bộ lọc nhé."
              />
            </div>
          ) : (
            <Row gutter={[12, 12]}>
              {items.map((product) => (
                <Col key={product.id} xs={12} md={8} lg={6}>
                  <ProductCard product={product} />
                </Col>
              ))}
            </Row>
          )}
          {total > PAGE_SIZE && (
            <PaginationControl total={total} pageSize={PAGE_SIZE} currentPage={page} />
          )}
        </Col>
      </Row>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-brand px-8 py-6">
        <div>
          <p className="text-xl font-bold text-white">Có đồ không dùng tới?</p>
          <p className="text-white/90">Đăng bán hoặc cho tặng lại người cần, miễn phí.</p>
        </div>
        <Link href="/cho-oi/dang-ban">
          <Button size="large" icon={<PackagePlus size={18} />}>
            Đăng bán ngay
          </Button>
        </Link>
      </div>
    </>
  );
}

/** Chợ ơi: phần đầu giống trang chủ; filter/sort/page lưu trên URL. */
export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const { enableMarketplace } = await loadSiteSettings();
  const result = enableMarketplace
    ? await searchProducts(toProductSearchRequest(await searchParams, PAGE_SIZE))
    : null;

  return (
    <main>
      <Header title={HERO_TITLE} search={SEARCH_CONFIG} heroImage="/images/cho-oi-hero.svg" />
      <section className="mx-auto w-full max-w-300 px-4 pt-16 pb-8">
        {result ? (
          <MarketplaceSections {...result} />
        ) : (
          <div className="rounded-lg bg-surface py-10">
            <EmptyState
              variant={EmptyVariant.SEARCH}
              description="Chợ ơi đang tạm đóng, bạn quay lại sau nhé."
            />
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
