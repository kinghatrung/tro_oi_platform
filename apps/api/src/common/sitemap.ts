import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import type { Model } from 'mongoose';

/** Số URL mỗi file sitemap (Google cho tối đa 50.000; nhỏ hơn để mỗi lần đọc DB nhẹ). */
export const SITEMAP_CHUNK = 5000;

export class SitemapQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10_000)
  chunk: number = 0;
}

interface SitemapDoc {
  _id: unknown;
  updatedAt: Date;
  images?: string[];
}

/** Model có `status`, `images`, timestamps (tin đăng, món đồ). */
type SitemapModel = Pick<Model<SitemapDoc>, 'find' | 'countDocuments'>;

/** 1 phần sitemap: id + ngày sửa + ảnh đầu (sắp theo _id cho thứ tự ổn định giữa các phần). */
export async function sitemapChunk(model: unknown, chunk: number) {
  const source = model as SitemapModel;
  const filter = { status: 'active' };
  const [docs, total] = await Promise.all([
    source
      .find(filter, { updatedAt: 1, images: { $slice: 1 } })
      .sort({ _id: 1 })
      .skip(chunk * SITEMAP_CHUNK)
      .limit(SITEMAP_CHUNK)
      .lean<SitemapDoc[]>()
      .exec(),
    source.countDocuments(filter).exec(),
  ]);
  return {
    total,
    chunkSize: SITEMAP_CHUNK,
    items: docs.map((doc) => ({
      id: String(doc._id),
      updatedAt: doc.updatedAt.toISOString(),
      image: doc.images?.[0],
    })),
  };
}
