import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

// Các mảng dưới trùng giá trị enum tương ứng bên @tro-oi/shared (housing.ts).
export const LISTING_CATEGORIES = [
  'phong-tro',
  'can-ho',
  'nguyen-can',
  'o-ghep',
] as const;
export const TRANSACTION_TYPES = ['rent-room', 'buy-room'] as const;
export const LISTING_STATUSES = [
  'draft',
  'pending',
  'active',
  'expired',
  'closed',
] as const;
export const DIRECTIONS = [
  'east',
  'west',
  'south',
  'north',
  'north-east',
  'north-west',
  'south-east',
  'south-west',
] as const;
export const FURNISHING_STATUSES = ['full', 'basic', 'empty'] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];
export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type ListingStatus = (typeof LISTING_STATUSES)[number];
export type Direction = (typeof DIRECTIONS)[number];
export type FurnishingStatus = (typeof FURNISHING_STATUSES)[number];

@Schema({ _id: false })
export class GeoPoint {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

@Schema({ _id: false })
export class Address {
  @Prop()
  street?: string;

  @Prop()
  ward?: string;

  @Prop({ required: true })
  district: string;

  @Prop({ required: true, index: true })
  city: string;

  @Prop()
  fullAddress?: string;

  @Prop({ type: SchemaFactory.createForClass(GeoPoint) })
  geo?: GeoPoint;
}

@Schema({ timestamps: true, collection: 'listings' })
export class Listing {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ type: String, enum: LISTING_CATEGORIES, required: true })
  category: ListingCategory;

  @Prop({ type: String, enum: TRANSACTION_TYPES, required: true })
  transaction: TransactionType;

  @Prop({ type: String, enum: LISTING_STATUSES, default: 'active' })
  status: ListingStatus;

  /** VND. */
  @Prop({ required: true, min: 0 })
  price: number;

  /** m². */
  @Prop()
  area?: number;

  @Prop()
  bedrooms?: number;

  @Prop()
  bathrooms?: number;

  @Prop()
  floorCount?: number;

  @Prop({ type: String, enum: DIRECTIONS })
  direction?: Direction;

  @Prop({ type: String, enum: FURNISHING_STATUSES })
  furnishing?: FurnishingStatus;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: SchemaFactory.createForClass(Address), required: true })
  address: Address;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  author: Types.ObjectId;

  @Prop({ default: false })
  isFeatured: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export type ListingDocument = HydratedDocument<Listing>;
export const ListingSchema = SchemaFactory.createForClass(Listing);
ListingSchema.index({ status: 1, createdAt: -1 });
