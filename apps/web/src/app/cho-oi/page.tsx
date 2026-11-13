import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from 'antd';

import { searchProducts } from '@/api/products';
import { EmptyState, EmptyVariant } from '@/components/common';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import {
  CategoryStrip,
  MarketplaceFeed,
  PRODUCT_CATEGORY_ITEMS,
  ProductGrid,
  RecentlyViewedProducts,
} from '@/components/sections';
import { loadSiteSettings } from '@/lib/siteSettings';

export const metadata: Metadata = {
  title: 'Chợ ơi – Pass đồ cũ',
};

const LATEST_SIZE = 20;
const SEARCH_PATH = '/cho-oi/tim-kiem';
const HERO_TITLE = 'Đồ cũ còn tốt, giá hợp lý!';
const SEARCH_CONFIG = {
  basePath: SEARCH_PATH,
  placeholder: 'Bạn muốn tìm gì? VD: tủ lạnh mini, bàn học...',
  submitLabel: 'Tìm đồ',
};

interface MarketplacePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Chợ ơi — cùng bố cục trang chủ Trọ ơi: dải danh mục → "Đồ bạn đã xem" → tab "Dành cho bạn" /
 * "Mới nhất". Tìm / lọc ở trang riêng /cho-oi/tim-kiem (như /tim-kiem của Trọ ơi).
 */
export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  // Link cũ /cho-oi?category=... (trước khi có trang tìm kiếm riêng) → giữ bộ lọc, chuyển sang trang mới
  const params = await searchParams;
  const legacyQuery = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) =>
      (Array.isArray(value) ? value : value ? [value] : []).map((item) => [key, item]),
    ),
  ).toString();
  if (legacyQuery) redirect(`${SEARCH_PATH}?${legacyQuery}`);

  const { enableMarketplace } = await loadSiteSettings();
  const result = enableMarketplace ? await searchProducts({ pageSize: LATEST_SIZE }) : null;

  return (
    <main>
      <Header title={HERO_TITLE} search={SEARCH_CONFIG} heroImage="/images/cho-oi-hero.svg" />
      <section className="w-full bg-page">
        <div className="mx-auto w-full max-w-300 px-4 pt-22 pb-3">
          {result ? (
            <>
              <CategoryStrip
                items={PRODUCT_CATEGORY_ITEMS}
                basePath={SEARCH_PATH}
                className="mb-4"
              />
              <RecentlyViewedProducts />
              <MarketplaceFeed
                latest={
                  <>
                    <ProductGrid items={result.items} emptyText="Chưa có món đồ nào." />
                    {result.total > LATEST_SIZE && (
                      <Link href={SEARCH_PATH} className="mx-auto mt-5 block w-fit">
                        <Button>Xem tất cả đồ cũ</Button>
                      </Link>
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
