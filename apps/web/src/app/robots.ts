import type { MetadataRoute } from 'next';

import { getListingSitemap } from '@/api/listings';
import { getProductSitemap } from '@/api/products';
import { SITE_URL } from '@/lib/seo';
import { sitemapIds } from '@/lib/sitemapChunks';
import { loadSiteSettings } from '@/lib/siteSettings';

// Số phần sitemap đổi theo số tin → tạo lại cùng nhịp với sitemap
export const revalidate = 3600;

/** robots.txt — chặn khu cần đăng nhập (các trang đó cũng có noindex) + liệt kê mọi sitemap. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { enableMarketplace } = await loadSiteSettings();
  const [listingParts, productParts] = await Promise.all([
    sitemapIds(getListingSitemap),
    enableMarketplace ? sitemapIds(getProductSitemap) : [],
  ]);
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/quan-tri',
        '/kenh-nguoi-dang',
        '/tin-nhan',
        '/ca-nhan',
        '/dang-tin',
        '/thong-bao',
        '/yeu-thich',
        '/cho-oi/dang-ban',
        '/dang-nhap',
        '/huy-nhan-email',
      ],
    },
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      ...listingParts.map(({ id }) => `${SITE_URL}/phong-tro/sitemap/${id}.xml`),
      ...productParts.map(({ id }) => `${SITE_URL}/cho-oi/sitemap/${id}.xml`),
    ],
  };
}
