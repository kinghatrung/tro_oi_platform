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

@Schema({ _id: false })
export class NotifyPrefs {
  @Prop()
  push?: boolean;

  @Prop()
  email?: boolean;

  @Prop()
  sms?: boolean;
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

  /** Ảnh bìa hồ sơ (rỗng = dải màu mặc định). */
  @Prop()
  coverImage?: string;

  @Prop({ type: String, enum: USER_ROLES, default: 'renter' })
  role: UserRole;

  /** Bị admin khoá: không đăng nhập, mọi request có token bị từ chối. */
  @Prop({ default: false, index: true })
  isBlocked: boolean;

  /** Người dùng tự xoá tài khoản (đã ẩn danh hoá, khoá) — hồ sơ công khai trả 404. */
  @Prop()
  deletedAt?: Date;

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

  /** Token FCM của các trình duyệt đã bật thông báo đẩy (mới nhất cuối). Nội bộ, không trả ra API. */
  @Prop({ type: [String], default: [] })
  pushTokens: string[];

  /** Kênh nhận thông báo; thiếu trường → mặc định ở prefsOf (NotificationService). */
  @Prop({
    type: SchemaFactory.createForClass(NotifyPrefs),
    default: () => ({}),
  })
  notifyPrefs?: NotifyPrefs;

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
    coverImage: user.coverImage || undefined,
    role: user.role,
    isBlocked: user.isBlocked ?? false,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
