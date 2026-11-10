import type { Metadata } from 'next';

import { searchProducts } from '@/api/products';
import { EmptyState, EmptyVariant, PaginationControl } from '@/components/common';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import {
  MarketplaceCategories,
  MarketplaceFeed,
  MarketplaceFilters,
  ProductGrid,
  RecentlyViewedProducts,
} from '@/components/sections';
import { toProductSearchRequest } from '@/lib/searchFilters';
import { loadSiteSettings } from '@/lib/siteSettings';
import { formatNumber } from '@/utils/helpers';

export const metadata: Metadata = {
  title: 'Chợ ơi – Pass đồ cũ',
};

const PAGE_SIZE = 24;
const HERO_TITLE = 'Đồ cũ còn tốt, giá hợp lý!';
const SEARCH_CONFIG = {
  basePath: '/cho-oi',
  placeholder: 'Bạn muốn tìm gì? VD: tủ lạnh mini, bàn học...',
  submitLabel: 'Tìm đồ',
};

interface MarketplacePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Chợ ơi — cùng bố cục trang chủ Trọ ơi: dải danh mục → "Đồ bạn đã xem" → tab "Dành cho bạn" /
 * "Mới nhất". Tìm/lọc/sang trang (có query) → mở sẵn tab "Mới nhất" theo bộ lọc trên URL.
 */
export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const { enableMarketplace } = await loadSiteSettings();
  const params = await searchParams;
  const isBrowsing = Object.keys(params).length > 0;
  const result = enableMarketplace
    ? await searchProducts(toProductSearchRequest(params, PAGE_SIZE))
    : null;

  return (
    <main>
      <Header title={HERO_TITLE} search={SEARCH_CONFIG} heroImage="/images/cho-oi-hero.svg" />
      <section className="w-full bg-page">
        <div className="mx-auto w-full max-w-300 px-4 pt-16 pb-3">
          {result ? (
            <>
              <MarketplaceCategories />
              <RecentlyViewedProducts />
              <MarketplaceFeed
                // Đổi bộ lọc từ dải danh mục → mở lại đúng tab
                key={String(isBrowsing)}
                initialTab={isBrowsing ? 'latest' : 'for-you'}
                latest={
                  <>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-secondary">{formatNumber(result.total)} món đồ</p>
                      <MarketplaceFilters />
                    </div>
                    <ProductGrid
                      items={result.items}
                      emptyText="Chưa có món đồ phù hợp. Thử bỏ bớt bộ lọc nhé."
                    />
                    {result.total > PAGE_SIZE && (
                      <PaginationControl
                        total={result.total}
                        pageSize={PAGE_SIZE}
                        currentPage={result.page}
                      />
                    )}
                  </>
                }
              />
            </>
          ) : (
            <div className="mb-4 rounded-lg bg-surface py-10">
              <EmptyState
                variant={EmptyVariant.SEARCH}
                description="Chợ ơi đang tạm đóng, bạn quay lại sau nhé."
              />
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}
