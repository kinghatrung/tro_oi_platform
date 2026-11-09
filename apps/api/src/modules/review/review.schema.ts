import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

export const REVIEW_COMMENT_MAX = 1000;

/** Đánh giá 1 người dùng (chủ tin / người bán / người thuê). Mỗi cặp người viết → người được đánh giá 1 bản. */
@Schema({ timestamps: true, collection: 'reviews' })
export class Review {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  reviewer: Types.ObjectId;

  /** Người được đánh giá. */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  target: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ maxlength: REVIEW_COMMENT_MAX })
  comment?: string;

  createdAt: Date;
  updatedAt: Date;
}

export type ReviewDocument = HydratedDocument<Review>;
export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ target: 1, reviewer: 1 }, { unique: true });
ReviewSchema.index({ target: 1, createdAt: -1 });
