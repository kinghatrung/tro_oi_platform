import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

// Trùng NotificationKind bên @tro-oi/shared (notification.ts) — quyết định icon/màu ở web
export const NOTIFICATION_KINDS = [
  'info',
  'success',
  'warning',
  'error',
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

const KEEP_DAYS = 90;

/** Thông báo gửi tới 1 người dùng (duyệt/ẩn/xoá tin, tin sắp hết hạn...). */
@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'notifications',
})
export class Notification {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: NOTIFICATION_KINDS, default: 'info' })
  kind: NotificationKind;

  @Prop({ required: true })
  title: string;

  @Prop()
  message?: string;

  /** Đường dẫn nội bộ của web khi bấm vào thông báo. */
  @Prop()
  link?: string;

  @Prop({ default: false })
  read: boolean;

  createdAt: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.index({ user: 1, createdAt: -1 });
// Mongo tự xoá thông báo cũ, collection không phình mãi
NotificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: KEEP_DAYS * 24 * 60 * 60 },
);
