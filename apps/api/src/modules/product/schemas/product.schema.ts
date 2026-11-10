import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

import { GeoPoint } from '../../listing/schemas/listing.schema.js';

// Các mảng dưới trùng enum tương ứng bên @tro-oi/shared (marketplace.ts).
export const PRODUCT_CATEGORIES = [
  'furniture',
  'electronics',
  'appliance',
  'vehicle',
  'study',
  'kitchen',
  'fashion',
  'decor',
  'sport',
  'hobby',
  'toy',
  'baby',
  'beauty',
  'pet',
  'other',
] as const;
export const PRODUCT_CONDITIONS = ['new', 'like-new', 'good', 'fair'] as const;
export const PRODUCT_STATUSES = [
  'pending',
  'active',
  'sold',
  'closed',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

@Schema({ _id: false })
export class ProductAddress {
  /** Phường/xã (mô hình 2 cấp từ 1/7/2025). */
  @Prop()
  ward?: string;

  /** Quận/huyện — chỉ còn ở dữ liệu trước 1/7/2025 (mô hình 3 cấp), form mới không gửi. */
  @Prop()
  district?: string;

  @Prop({ required: true, index: true })
  city: string;

  /** Vị trí gần đúng do người bán ghim (không bắt buộc) — hiện chỉ dùng cho bản đồ quản trị. */
  @Prop({ type: SchemaFactory.createForClass(GeoPoint) })
  geo?: GeoPoint;
}

/** Món đồ đăng bán/pass trên Chợ ơi. */
@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: String, enum: PRODUCT_CATEGORIES, required: true })
  category: ProductCategory;

  @Prop({ type: String, enum: PRODUCT_CONDITIONS, required: true })
  condition: ProductCondition;

  @Prop({ type: String, enum: PRODUCT_STATUSES, default: 'active' })
  status: ProductStatus;

  /** VND. */
  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ default: false })
  isNegotiable: boolean;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: SchemaFactory.createForClass(ProductAddress), required: true })
  address: ProductAddress;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  seller: Types.ObjectId;

  @Prop({ default: 0 })
  viewCount: number;

  /** Lý do admin từ chối / ẩn gần nhất — chủ tin xem ở Kênh người đăng; xoá khi hiển thị lại. */
  @Prop()
  moderationNote?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<Product>;
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ status: 1, createdAt: -1 });
