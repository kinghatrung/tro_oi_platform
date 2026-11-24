import { getProductSitemap } from '@/api/products';
import { sitemapEntries, sitemapIds } from '@/lib/sitemapChunks';
import { loadSiteSettings } from '@/lib/siteSettings';

// Tạo lại tối đa 1 lần / giờ
export const revalidate = 3600;

/** /cho-oi/sitemap/<id>.xml — mỗi phần 5.000 món đang bán; Chợ ơi tắt → rỗng. */
export const generateSitemaps = () => sitemapIds(getProductSitemap);

export default async function sitemap({ id }: { id: Promise<string> }) {
  const { enableMarketplace } = await loadSiteSettings();
  if (!enableMarketplace) return [];
  return sitemapEntries(getProductSitemap, Number(await id), '/cho-oi');
}
