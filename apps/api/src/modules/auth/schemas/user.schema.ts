import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { HydratedDocument } from 'mongoose';

/** Giá trị trùng với UserRole bên @tro-oi/shared. */
export const USER_ROLES = ['renter', 'landlord', 'agent', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, index: true })
  phone: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  email?: string;

  @Prop()
  bio?: string;

  @Prop()
  avatar?: string;

  @Prop({ type: String, enum: USER_ROLES, default: 'renter' })
  role: UserRole;

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
