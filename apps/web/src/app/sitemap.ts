import type { MetadataRoute } from 'next';

import { getPublishedPages } from '@/api/pages';
import { SITE_URL } from '@/lib/seo';
import { loadSiteSettings } from '@/lib/siteSettings';

// Tạo lại tối đa 1 lần / giờ (build lúc API chưa chạy → chỉ có trang tĩnh, giờ sau tự đủ)
export const revalidate = 3600;

/**
 * /sitemap.xml — trang tĩnh + trang chính sách. Tin / món đồ nằm ở sitemap chia phần
 * /phong-tro/sitemap/<n>.xml, /cho-oi/sitemap/<n>.xml (robots.txt liệt kê đủ).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await loadSiteSettings();
  const pages = await getPublishedPages().catch(() => []);

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
  ];
}
