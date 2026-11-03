import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

// Trùng ReportTargetType / ReportReason / ReportStatus bên @tro-oi/shared (report.ts)
export const REPORT_TARGET_TYPES = ['listing', 'product'] as const;
export const REPORT_REASONS = [
  'scam',
  'wrong-info',
  'duplicate',
  'unavailable',
  'inappropriate',
  'other',
] as const;
export const REPORT_STATUSES = ['open', 'resolved', 'dismissed'] as const;

export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

/** Báo cáo vi phạm một tin Trọ ơi / Chợ ơi. */
@Schema({ timestamps: true, collection: 'reports' })
export class Report {
  @Prop({ type: String, enum: REPORT_TARGET_TYPES, required: true })
  targetType: ReportTargetType;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  targetId: Types.ObjectId;

  @Prop({ type: String, enum: REPORT_REASONS, required: true })
  reason: (typeof REPORT_REASONS)[number];

  @Prop()
  note?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  reporter: Types.ObjectId;

  @Prop({
    type: String,
    enum: REPORT_STATUSES,
    default: 'open',
    index: true,
  })
  status: (typeof REPORT_STATUSES)[number];

  createdAt: Date;
}

export type ReportDocument = HydratedDocument<Report>;
export const ReportSchema = SchemaFactory.createForClass(Report);
// Mỗi người chỉ có 1 báo cáo đang mở cho 1 tin (chống spam)
ReportSchema.index(
  { targetId: 1, reporter: 1 },
  { unique: true, partialFilterExpression: { status: 'open' } },
);
