import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';

import { DEFAULT_SUCCESS_MESSAGE } from '../../common/response.interceptor.js';
import { AuditService } from '../audit/audit.service.js';
import {
  User,
  toUser,
  type UserDocument,
} from '../auth/schemas/user.schema.js';
import {
  Conversation,
  type ConversationDocument,
} from '../chat/schemas/conversation.schema.js';
import {
  Message,
  type MessageDocument,
} from '../chat/schemas/message.schema.js';
import { toListing } from '../listing/listing.mapper.js';
import {
  Listing,
  type ListingDocument,
} from '../listing/schemas/listing.schema.js';
import {
  Notification,
  type NotificationDocument,
} from '../notification/notification.schema.js';
import { toProduct } from '../product/product.mapper.js';
import {
  Product,
  type ProductDocument,
} from '../product/schemas/product.schema.js';
import { Report, type ReportDocument } from '../report/report.schema.js';
import { Review, type ReviewDocument } from '../review/review.schema.js';
import { StorageService } from '../upload/storage.service.js';

/** Tên hiển thị thay thế sau khi người dùng tự xoá tài khoản. */
export const DELETED_USER_NAME = 'Người dùng đã xoá';

/**
 * Ẩn danh hoá + khoá 1 tài khoản (xoá / gộp vào tài khoản khác): SĐT thay bằng giá trị nội bộ,
 * bỏ Firebase UID → SĐT / Google đó đăng ký hoặc gắn lại được; khoá để token cũ hết hiệu lực.
 */
export const anonymizedUserUpdate = (userId: string) => ({
  $set: {
    name: DELETED_USER_NAME,
    phone: `deleted:${userId}`,
    isBlocked: true,
    deletedAt: new Date(),
    favoriteListingIds: [],
    favoriteProductIds: [],
    viewedListingIds: [],
    viewedProductIds: [],
    savedSearches: [],
    pushTokens: [],
  },
  $unset: {
    email: 1,
    bio: 1,
    avatar: 1,
    coverImage: 1,
    notifyPrefs: 1,
    firebaseUid: 1,
    socialProvider: 1,
  },
});

/**
 * Quyền của người dùng với dữ liệu cá nhân: tải về (xuất JSON) và tự xoá tài khoản (ẩn danh hoá).
 * Ẩn danh hoá thay vì xoá hẳn: tin nhắn / đánh giá đã viết còn giữ để cuộc trò chuyện và điểm
 * đánh giá của người khác không bị hỏng, nhưng không còn gắn với danh tính.
 */
@Injectable()
export class AccountService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    private readonly auditService: AuditService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Toàn bộ dữ liệu gắn với tài khoản, dạng JSON đọc được. Kiểm tra tài khoản trước (lỗi → HTTP lỗi
   * bình thường), rồi trả bộ sinh từng đoạn JSON `{ code, message, data }` để controller ghi dần ra
   * response — tin nhắn đọc bằng cursor theo từng cuộc trò chuyện, không gom hết vào RAM.
   */
  async exportData(userId: string) {
    const user = await this.findActive(userId);
    return this.exportChunks(user);
  }

  private async *exportChunks(user: UserDocument) {
    const [
      listings,
      products,
      written,
      received,
      conversations,
      notifications,
      reports,
    ] = await Promise.all([
      this.listingModel
        .find({ author: user._id })
        .sort({ createdAt: -1 })
        .exec(),
      this.productModel
        .find({ seller: user._id })
        .sort({ createdAt: -1 })
        .exec(),
      this.reviewModel.find({ reviewer: user._id }).lean().exec(),
      this.reviewModel.find({ target: user._id }).lean().exec(),
      this.conversationModel
        .find({ $or: [{ starter: user._id }, { owner: user._id }] })
        .lean()
        .exec(),
      this.notificationModel.find({ user: user._id }).lean().exec(),
      this.reportModel.find({ reporter: user._id }).lean().exec(),
    ]);

    const review = (doc: (typeof written)[number]) => ({
      rating: doc.rating,
      comment: doc.comment,
      createdAt: doc.createdAt,
    });
    const data = {
      exportedAt: new Date().toISOString(),
      profile: toUser(user),
      favoriteListingIds: user.favoriteListingIds.map(String),
      favoriteProductIds: user.favoriteProductIds.map(String),
      viewedListingIds: user.viewedListingIds.map(String),
      viewedProductIds: user.viewedProductIds.map(String),
      savedSearches: user.savedSearches.map(({ query, title, createdAt }) => ({
        query,
        title,
        createdAt,
      })),
      notificationPreferences: user.notifyPrefs ?? {},
      listings: listings.map((doc) => toListing(doc)),
      products: products.map((doc) => toProduct(doc)),
      reviewsWritten: written.map((doc) => ({
        aboutUserId: String(doc.target),
        ...review(doc),
      })),
      reviewsReceived: received.map(review),
      notifications: notifications.map((doc) => ({
        title: doc.title,
        message: doc.message,
        link: doc.link,
        read: doc.read,
        createdAt: doc.createdAt,
      })),
      reportsMade: reports.map((doc) => ({
        targetType: doc.targetType,
        targetId: String(doc.targetId),
        reason: doc.reason,
        note: doc.note,
        status: doc.status,
        createdAt: doc.createdAt,
      })),
    };

    // Phần nhỏ ghi 1 lần (bỏ "}" cuối để nối tiếp), cuộc trò chuyện + tin nhắn ghi dần
    const head = JSON.stringify(data).slice(0, -1);
    yield `{"code":200,"message":${JSON.stringify(DEFAULT_SUCCESS_MESSAGE)},"data":${head},"conversations":[`;
    for (const [index, conversation] of conversations.entries()) {
      const meta = JSON.stringify({
        id: String(conversation._id),
        targetType: conversation.targetModel,
        targetId: String(conversation.target),
      }).slice(0, -1);
      yield `${index > 0 ? ',' : ''}${meta},"messages":[`;
      const messages = this.messageModel
        .find({ conversation: conversation._id })
        .sort({ createdAt: 1 })
        .lean()
        .cursor();
      let first = true;
      for await (const message of messages) {
        yield `${first ? '' : ','}${JSON.stringify({
          fromMe: message.sender.equals(user._id),
          content: message.content,
          images: message.images,
          createdAt: message.createdAt,
        })}`;
        first = false;
      }
      yield ']}';
    }
    yield ']}}';
  }

  /**
   * Xoá tài khoản (người dùng tự xoá, hoặc admin xoá khi có `adminId`): xoá tin / món đồ / đánh giá
   * về họ / thông báo + ảnh đã upload của các mục đó và avatar, ảnh bìa; ẩn danh hồ sơ (tên, email,
   * SĐT thay bằng giá trị nội bộ để số đó đăng ký lại được), khoá để token cũ hết hiệu lực.
   * Ảnh trong tin nhắn giữ lại cùng tin nhắn (người còn lại trong cuộc trò chuyện vẫn xem được).
   */
  async deleteAccount(userId: string, adminId?: string) {
    if (adminId === userId) {
      throw new BadRequestException(
        'Không thể tự xoá chính mình ở trang quản trị',
      );
    }
    const user = await this.findActive(userId);
    if (user.role === 'admin') {
      throw new BadRequestException(
        adminId
          ? 'Hạ quyền quản trị của tài khoản này trước khi xoá'
          : 'Tài khoản quản trị không tự xoá được — nhờ quản trị viên khác hạ quyền trước',
      );
    }
    // Lấy URL ảnh trước khi xoá document
    const [listingImages, listingVideos, listingPosters, productImages] =
      await Promise.all([
        this.listingModel.distinct('images', { author: user._id }).exec(),
        this.listingModel.distinct('video', { author: user._id }).exec(),
        this.listingModel.distinct('videoPoster', { author: user._id }).exec(),
        this.productModel.distinct('images', { seller: user._id }).exec(),
      ]);
    await Promise.all([
      this.listingModel.deleteMany({ author: user._id }).exec(),
      this.productModel.deleteMany({ seller: user._id }).exec(),
      this.reviewModel.deleteMany({ target: user._id }).exec(),
      this.notificationModel.deleteMany({ user: user._id }).exec(),
    ]);
    await this.userModel
      .updateOne({ _id: user._id }, anonymizedUserUpdate(user.id as string))
      .exec();
    await this.storage.remove([
      ...(listingImages as string[]),
      ...(listingVideos as string[]),
      ...(listingPosters as string[]),
      ...(productImages as string[]),
      user.avatar,
      user.coverImage,
    ]);
    await this.auditService.log(adminId ?? (user.id as string), {
      action: adminId ? 'Xoá tài khoản' : 'Tự xoá tài khoản',
      targetType: 'user',
      targetId: user.id as string,
      targetTitle: adminId ? user.name : undefined,
    });
    return null;
  }

  private async findActive(userId: string) {
    const user = isValidObjectId(userId)
      ? await this.userModel.findById(userId).exec()
      : null;
    if (!user || user.deletedAt) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }
}
