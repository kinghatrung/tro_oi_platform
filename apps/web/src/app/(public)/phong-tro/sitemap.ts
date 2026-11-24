import { getListingSitemap } from '@/api/listings';
import { sitemapEntries, sitemapIds } from '@/lib/sitemapChunks';

// Tạo lại tối đa 1 lần / giờ
export const revalidate = 3600;

/** /phong-tro/sitemap/<id>.xml — mỗi phần 5.000 tin đang hiển thị (robots.txt liệt kê đủ các phần). */
export const generateSitemaps = () => sitemapIds(getListingSitemap);

export default async function sitemap({ id }: { id: Promise<string> }) {
  return sitemapEntries(getListingSitemap, Number(await id), '/phong-tro');
}
