import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

export const MESSAGE_MAX_LENGTH = 1000;
/** Ảnh tối đa trong 1 tin nhắn. */
export const MESSAGE_MAX_IMAGES = 4;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'messages',
})
export class Message {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  })
  conversation: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  /** Có thể rỗng khi tin chỉ có ảnh. */
  @Prop({ default: '', maxlength: MESSAGE_MAX_LENGTH })
  content: string;

  /** URL ảnh đã upload qua /uploads (kiểm tra ở ChatService). */
  @Prop({ type: [String], default: [] })
  images: string[];

  createdAt: Date;
}

export type MessageDocument = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ conversation: 1, createdAt: -1 });
