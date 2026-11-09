import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  Schema as MongooseSchema,
  Types,
  type HydratedDocument,
} from 'mongoose';

/** Giá trị trùng với UserRole bên @tro-oi/shared. */
export const USER_ROLES = ['renter', 'landlord', 'agent', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Bộ lọc /tim-kiem người dùng đã lưu. */
@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class SavedSearch {
  _id: Types.ObjectId;

  /** Query string của /tim-kiem (không có page, key đã sắp xếp) — khoá chống lưu trùng. */
  @Prop({ required: true })
  query: string;

  @Prop({ required: true })
  title: string;

  createdAt: Date;
}

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

  /** Bị admin khoá: không đăng nhập, mọi request có token bị từ chối. */
  @Prop({ default: false, index: true })
  isBlocked: boolean;

  /** Tin đã lưu, thứ tự thêm vào (cũ → mới). */
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Listing' }],
    default: [],
  })
  favoriteListingIds: Types.ObjectId[];

  /** Món đồ Chợ ơi đã lưu, thứ tự thêm vào (cũ → mới). */
  @Prop({
    type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Product' }],
    default: [],
  })
  favoriteProductIds: Types.ObjectId[];

  /** Tìm kiếm đã lưu, thứ tự thêm vào (cũ → mới). */
  @Prop({ type: [SchemaFactory.createForClass(SavedSearch)], default: [] })
  savedSearches: SavedSearch[];

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
    isBlocked: user.isBlocked ?? false,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
