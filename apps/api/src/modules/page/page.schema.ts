import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

// Trùng PageSlug bên @tro-oi/shared (page.ts) — cũng là URL trang trên web
export const PAGE_SLUGS = ['dieu-khoan-su-dung', 'chinh-sach-bao-mat'] as const;
export type PageSlug = (typeof PAGE_SLUGS)[number];

export const DEFAULT_PAGE_TITLES: Record<PageSlug, string> = {
  'dieu-khoan-su-dung': 'Điều khoản sử dụng',
  'chinh-sach-bao-mat': 'Chính sách bảo mật',
};

/** Trang nội dung tĩnh do admin soạn. content rỗng = chưa đăng (web 404, ẩn link). */
@Schema({ timestamps: true, collection: 'pages' })
export class Page {
  @Prop({ type: String, enum: PAGE_SLUGS, required: true, unique: true })
  slug: PageSlug;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  content: string;

  updatedAt: Date;
}

export type PageDocument = HydratedDocument<Page>;
export const PageSchema = SchemaFactory.createForClass(Page);
