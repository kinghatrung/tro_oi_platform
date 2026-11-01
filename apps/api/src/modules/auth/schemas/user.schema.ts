import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

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

  /** Tin đã lưu, thứ tự thêm vào (cũ → mới). */
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Listing' }],
    default: [],
  })
  favoriteListingIds: Types.ObjectId[];

  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

/** Document → User (shape của @tro-oi/shared). */
export function toUser(user: UserDocument) {
  return {
    id: user.id as string,
    phone: user.phone,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
