import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';

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

/** Tên hiển thị thay thế sau khi người dùng tự xoá tài khoản. */
export const DELETED_USER_NAME = 'Người dùng đã xoá';

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
  ) {}

  /**
   * Toàn bộ dữ liệu gắn với tài khoản, dạng JSON đọc được.
   * shortcut: gom 1 lần trong request — tài khoản rất nhiều tin nhắn thì chuyển sang job nền + link tải.
   */
  async exportData(userId: string) {
    const user = await this.findActive(userId);
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
    const messages = await this.messageModel
      .find({ conversation: { $in: conversations.map((item) => item._id) } })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    const review = (doc: (typeof written)[number]) => ({
      rating: doc.rating,
      comment: doc.comment,
      createdAt: doc.createdAt,
    });
    return {
      exportedAt: new Date().toISOString(),
      profile: toUser(user),
      favoriteListingIds: user.favoriteListingIds.map(String),
      favoriteProductIds: user.favoriteProductIds.map(String),
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
      conversations: conversations.map((conversation) => ({
        id: String(conversation._id),
        targetType: conversation.targetModel,
        targetId: String(conversation.target),
        messages: messages
          .filter((message) => message.conversation.equals(conversation._id))
          .map((message) => ({
            fromMe: message.sender.equals(user._id),
            content: message.content,
            images: message.images,
            createdAt: message.createdAt,
          })),
      })),
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
  }

  /**
   * Tự xoá tài khoản: xoá tin / món đồ / đánh giá về mình / thông báo; ẩn danh hồ sơ (tên, ảnh,
   * email, SĐT thay bằng giá trị nội bộ để số đó đăng ký lại được), khoá để token cũ hết hiệu lực.
   * shortcut: ảnh đã upload (ổ đĩa / S3) chưa bị xoá — cần job dọn ảnh không còn tham chiếu.
   */
  async deleteAccount(userId: string) {
    const user = await this.findActive(userId);
    if (user.role === 'admin') {
      throw new BadRequestException(
        'Tài khoản quản trị không tự xoá được — nhờ quản trị viên khác hạ quyền trước',
      );
    }
    await Promise.all([
      this.listingModel.deleteMany({ author: user._id }).exec(),
      this.productModel.deleteMany({ seller: user._id }).exec(),
      this.reviewModel.deleteMany({ target: user._id }).exec(),
      this.notificationModel.deleteMany({ user: user._id }).exec(),
    ]);
    await this.userModel
      .updateOne(
        { _id: user._id },
        {
          $set: {
            name: DELETED_USER_NAME,
            phone: `deleted:${user.id as string}`,
            isBlocked: true,
            deletedAt: new Date(),
            favoriteListingIds: [],
            favoriteProductIds: [],
            savedSearches: [],
            pushTokens: [],
          },
          $unset: {
            email: 1,
            bio: 1,
            avatar: 1,
            coverImage: 1,
            notifyPrefs: 1,
          },
        },
      )
      .exec();
    await this.auditService.log(user.id as string, {
      action: 'Tự xoá tài khoản',
      targetType: 'user',
      targetId: user.id as string,
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
