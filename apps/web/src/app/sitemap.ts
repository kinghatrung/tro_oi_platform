import type { MetadataRoute } from 'next';
import type { PagedResponse } from '@tro-oi/shared';

import { searchListings } from '@/api/listings';
import { getPublishedPages } from '@/api/pages';
import { searchProducts } from '@/api/products';
import { SITE_URL } from '@/lib/seo';
import { loadSiteSettings } from '@/lib/siteSettings';

// Tạo lại tối đa 1 lần / giờ (build lúc API chưa chạy → chỉ có trang tĩnh, giờ sau tự đủ)
export const revalidate = 3600;

const PAGE_SIZE = 50; // tối đa API cho phép
// shortcut: chỉ lấy 500 tin + 500 món mới nhất; vượt mức đó → tách bằng generateSitemaps
const MAX_PAGES = 10;

/** Gom các trang kết quả; API lỗi → trả phần đã lấy được (sitemap không được làm hỏng build). */
async function collect<T>(fetchPage: (page: number) => Promise<PagedResponse<T>>): Promise<T[]> {
  const items: T[] = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page++) {
      const result = await fetchPage(page);
      items.push(...result.items);
      if (result.items.length < PAGE_SIZE || items.length >= result.total) break;
    }
  } catch (error) {
    console.error('Sitemap: không tải được dữ liệu từ API', error);
  }
  return items;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await loadSiteSettings();
  const [listings, products, pages] = await Promise.all([
    collect((page) => searchListings({ page, pageSize: PAGE_SIZE })),
    settings.enableMarketplace
      ? collect((page) => searchProducts({ page, pageSize: PAGE_SIZE }))
      : [],
    getPublishedPages().catch(() => []),
  ]);

  const url = (path: string) => `${SITE_URL}${path}`;
  return [
    { url: url('/'), changeFrequency: 'daily', priority: 1 },
    { url: url('/tim-kiem'), changeFrequency: 'daily', priority: 0.8 },
    ...(settings.enableMarketplace
      ? [
          { url: url('/cho-oi'), changeFrequency: 'daily' as const, priority: 0.8 },
          { url: url('/cho-oi/tim-kiem'), changeFrequency: 'daily' as const, priority: 0.6 },
        ]
      : []),
    ...pages.map((page) => ({ url: url(`/${page.slug}`), changeFrequency: 'yearly' as const })),
    ...listings.map((listing) => ({
      url: url(`/phong-tro/${listing.id}`),
      lastModified: listing.updatedAt,
      changeFrequency: 'weekly' as const,
      images: listing.images.slice(0, 1),
    })),
    ...products.map((product) => ({
      url: url(`/cho-oi/${product.id}`),
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      images: product.images.slice(0, 1),
    })),
  ];
}
