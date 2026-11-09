import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

// Trùng AuditTargetType bên @tro-oi/shared (admin.ts)
export const AUDIT_TARGET_TYPES = [
  'listing',
  'product',
  'user',
  'report',
  'settings',
  'review',
  'page',
] as const;
export type AuditTargetType = (typeof AUDIT_TARGET_TYPES)[number];

/** Một thao tác của admin (duyệt/ẩn/xoá tin, khoá người dùng, đổi thiết lập...). */
@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'audit_logs',
})
export class AuditLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  actor: Types.ObjectId;

  /** Nhãn tiếng Việt hiển thị thẳng: "Duyệt", "Khoá tài khoản"... */
  @Prop({ required: true })
  action: string;

  @Prop({ type: String, enum: AUDIT_TARGET_TYPES, required: true, index: true })
  targetType: AuditTargetType;

  @Prop()
  targetId?: string;

  /** Tiêu đề/tên đối tượng lúc thao tác (giữ lại kể cả khi đối tượng bị xoá). */
  @Prop()
  targetTitle?: string;

  createdAt: Date;
}

export type AuditLogDocument = HydratedDocument<AuditLog>;
export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ createdAt: -1 });
