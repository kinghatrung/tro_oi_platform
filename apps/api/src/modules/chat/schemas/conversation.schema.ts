import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

/** Tên model Mongoose của đối tượng được hỏi (refPath). Map sang ChatTargetType bên shared. */
export const CHAT_TARGET_MODELS = ['Listing', 'Product'] as const;
export type ChatTargetModel = (typeof CHAT_TARGET_MODELS)[number];

@Schema({ _id: false })
export class LastMessage {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  id: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, required: true })
  sender: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  createdAt: Date;
}

/** Chat 1-1 giữa người hỏi (starter) và chủ tin/người bán (owner) về 1 tin hoặc 1 món đồ. */
@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ type: String, enum: CHAT_TARGET_MODELS, required: true })
  targetModel: ChatTargetModel;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    refPath: 'targetModel',
    required: true,
  })
  target: Types.ObjectId;

  /** Người nhắn trước (người tìm trọ / người mua). */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  starter: Types.ObjectId;

  /** Chủ tin / người bán. */
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ type: SchemaFactory.createForClass(LastMessage) })
  lastMessage?: LastMessage;

  @Prop({ default: 0 })
  unreadByStarter: number;

  @Prop({ default: 0 })
  unreadByOwner: number;

  createdAt: Date;
  /** = thời điểm tin nhắn cuối (đọc tin không đổi) → sắp xếp danh sách. */
  updatedAt: Date;
}

export type ConversationDocument = HydratedDocument<Conversation>;
export const ConversationSchema = SchemaFactory.createForClass(Conversation);
// Mỗi người chỉ có 1 cuộc trò chuyện cho 1 tin / món đồ (find-or-create không tạo trùng)
ConversationSchema.index({ target: 1, starter: 1 }, { unique: true });
ConversationSchema.index({ starter: 1, updatedAt: -1 });
ConversationSchema.index({ owner: 1, updatedAt: -1 });
