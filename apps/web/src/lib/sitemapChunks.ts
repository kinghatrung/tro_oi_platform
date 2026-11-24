import type { MetadataRoute } from 'next';
import type { SitemapChunk } from '@tro-oi/shared';

import { SITE_URL } from '@/lib/seo';

/**
 * Số phần sitemap của 1 loại (tin / món đồ) — đọc `total` từ phần 0. API lỗi (vd lúc build chưa có
 * API) → 1 phần (rỗng), giờ sau tự tạo lại đủ.
 */
export async function sitemapIds(fetchChunk: (chunk: number) => Promise<SitemapChunk>) {
  try {
    const { total, chunkSize } = await fetchChunk(0);
    return Array.from({ length: Math.max(1, Math.ceil(total / chunkSize)) }, (_, id) => ({ id }));
  } catch (error) {
    console.error('Sitemap: không tải được dữ liệu từ API', error);
    return [{ id: 0 }];
  }
}

/** 1 phần sitemap: URL chi tiết = `<basePath>/<id>`, kèm ngày sửa + ảnh đầu. API lỗi → rỗng. */
export async function sitemapEntries(
  fetchChunk: (chunk: number) => Promise<SitemapChunk>,
  chunk: number,
  basePath: string,
): Promise<MetadataRoute.Sitemap> {
  try {
    const { items } = await fetchChunk(chunk);
    return items.map((item) => ({
      url: `${SITE_URL}${basePath}/${item.id}`,
      lastModified: item.updatedAt,
      changeFrequency: 'weekly',
      images: item.image ? [item.image] : undefined,
    }));
  } catch (error) {
    console.error('Sitemap: không tải được dữ liệu từ API', error);
    return [];
  }
}
