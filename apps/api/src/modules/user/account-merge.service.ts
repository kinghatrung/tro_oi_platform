import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, type Types } from 'mongoose';

import { AuditService } from '../audit/audit.service.js';
import { SOCIAL_PROVIDERS } from '../auth/auth.service.js';
import { FirebaseService } from '../auth/firebase.service.js';
import {
  User,
  toUser,
  type SavedSearch,
  type UserDocument,
  type UserRole,
} from '../auth/schemas/user.schema.js';
import {
  Conversation,
  type ConversationDocument,
} from '../chat/schemas/conversation.schema.js';
import {
  Message,
  type MessageDocument,
} from '../chat/schemas/message.schema.js';
import {
  Listing,
  type ListingDocument,
} from '../listing/schemas/listing.schema.js';
import {
  Notification,
  type NotificationDocument,
} from '../notification/notification.schema.js';
import {
  Product,
  type ProductDocument,
} from '../product/schemas/product.schema.js';
import { Report, type ReportDocument } from '../report/report.schema.js';
import { Review, type ReviewDocument } from '../review/review.schema.js';
import { StorageService } from '../upload/storage.service.js';
import { anonymizedUserUpdate } from './account.service.js';
import { MAX_SAVED_SEARCHES, MAX_VIEWED, unionIds } from './user.service.js';

/** Gộp giữ vai trò "cao" hơn (không bao giờ tạo admin — tài khoản admin không bị gộp). */
const ROLE_RANK: Record<UserRole, number> = {
  renter: 0,
  landlord: 1,
  agent: 2,
  admin: 3,
};

/** Định danh đăng nhập mà token Firebase chứng minh (SĐT đã OTP hoặc Google / Facebook). */
export type ProvenIdentity =
  { phone: string } | { firebaseUid: string; socialProvider: string };

/** Token Firebase → định danh; token không phải SĐT / Google / Facebook → null. */
export function identityOf(decoded: {
  uid: string;
  phone_number?: string;
  firebase?: { sign_in_provider?: string };
}): ProvenIdentity | null {
  const provider = decoded.firebase?.sign_in_provider ?? '';
  if (provider === 'phone' && decoded.phone_number) {
    return { phone: decoded.phone_number };
  }
  if (SOCIAL_PROVIDERS.includes(provider)) {
    return { firebaseUid: decoded.uid, socialProvider: provider };
  }
  return null;
}

/** Lý do không cho gộp `other` vào tài khoản đang đăng nhập; null = được gộp. */
export function mergeBlocker(
  current: Pick<UserDocument, 'id'>,
  other: Pick<UserDocument, 'id' | 'role' | 'isBlocked'>,
) {
  if (other.id === current.id) return 'Đây chính là tài khoản đang đăng nhập';
  if (other.role === 'admin') return 'Không gộp được tài khoản quản trị';
  if (other.isBlocked) return 'Tài khoản kia đang bị khoá, không gộp được';
  return null;
}

/** Tìm kiếm đã lưu: giữ của tài khoản hiện tại, thêm của tài khoản kia nếu chưa có cùng bộ lọc. */
export function mergeSavedSearches(mine: SavedSearch[], theirs: SavedSearch[]) {
  const queries = new Set(mine.map((item) => item.query));
  return [...mine, ...theirs.filter((item) => !queries.has(item.query))].slice(
    -MAX_SAVED_SEARCHES,
  );
}

type ConversationState = Pick<
  ConversationDocument,
  'lastMessage' | 'unreadByStarter' | 'unreadByOwner' | 'updatedAt'
>;

/**
 * 2 cuộc trò chuyện về cùng 1 tin dồn làm 1: cộng số chưa đọc, tin cuối = tin mới hơn, thời điểm
 * cập nhật = tin mới nhất (danh sách chat sắp theo updatedAt).
 */
export function mergedConversation(
  kept: ConversationState,
  duplicate: ConversationState,
) {
  const isDuplicateNewer =
    (duplicate.lastMessage?.createdAt?.getTime() ?? 0) >
    (kept.lastMessage?.createdAt?.getTime() ?? 0);
  return {
    $inc: {
      unreadByStarter: duplicate.unreadByStarter ?? 0,
      unreadByOwner: duplicate.unreadByOwner ?? 0,
    },
    ...(isDuplicateNewer && {
      $set: {
        lastMessage: duplicate.lastMessage,
        updatedAt: duplicate.updatedAt,
      },
    }),
  };
}

/**
 * Gộp tài khoản lỡ tạo riêng (vd 1 bằng SĐT, 1 bằng Google) vào tài khoản đang đăng nhập.
 * Người dùng chứng minh sở hữu tài khoản kia bằng token Firebase (OTP / popup) của nó → chuyển tin,
 * món đồ, đánh giá, chat (cả tin cuối, số chưa đọc), thông báo, báo cáo, yêu thích, lịch sử xem,
 * tìm kiếm đã lưu (bỏ trùng bộ lọc), push token sang; định danh vừa chứng
 * minh gắn vào tài khoản hiện tại; tài khoản kia ẩn danh hoá + khoá (như tự xoá).
 * shortcut: không dùng transaction (Mongo standalone) — lỗi giữa chừng để lại dữ liệu chia ở 2 tài
 * khoản (không mất), chạy gộp lại là tiếp tục được; cần chặt chẽ hơn thì chạy replica set + session.
 */
@Injectable()
export class AccountMergeService {
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
    private readonly firebaseService: FirebaseService,
    private readonly auditService: AuditService,
    private readonly storage: StorageService,
  ) {}

  async merge(userId: string, firebaseToken: string) {
    const identity = identityOf(
      await this.firebaseService.verifyIdToken(firebaseToken),
    );
    if (!identity) {
      throw new BadRequestException(
        'Chỉ gộp được tài khoản đăng nhập bằng SĐT, Google hoặc Facebook',
      );
    }
    const user = isValidObjectId(userId)
      ? await this.userModel.findById(userId).exec()
      : null;
    if (!user || user.deletedAt) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    const other = await this.userModel
      .findOne(
        'phone' in identity
          ? { phone: identity.phone }
          : { firebaseUid: identity.firebaseUid },
      )
      .exec();
    if (!other || other.deletedAt) {
      throw new NotFoundException('Không có tài khoản Trọ ơi nào để gộp');
    }
    const blocker = mergeBlocker(user, other);
    if (blocker) {
      throw other.isBlocked
        ? new ForbiddenException(blocker)
        : new BadRequestException(blocker);
    }

    await this.moveData(user._id, other._id);

    // Giải phóng SĐT / Firebase UID của tài khoản kia trước (index unique) rồi mới gắn sang
    await this.userModel
      .updateOne({ _id: other._id }, anonymizedUserUpdate(other.id as string))
      .exec();

    const keep = <T>(mine: T | undefined, theirs: T | undefined) =>
      mine ?? theirs;
    const social =
      'firebaseUid' in identity
        ? identity
        : !user.firebaseUid && other.firebaseUid
          ? {
              firebaseUid: other.firebaseUid,
              socialProvider: other.socialProvider,
            }
          : {};
    const phone =
      'phone' in identity ? identity.phone : keep(user.phone, other.phone);
    user.set({
      ...social,
      phone,
      email: keep(user.email, other.email),
      bio: keep(user.bio, other.bio),
      avatar: keep(user.avatar, other.avatar),
      coverImage: keep(user.coverImage, other.coverImage),
      role:
        ROLE_RANK[other.role] > ROLE_RANK[user.role] ? other.role : user.role,
      favoriteListingIds: unionIds(
        user.favoriteListingIds,
        other.favoriteListingIds,
      ),
      favoriteProductIds: unionIds(
        user.favoriteProductIds,
        other.favoriteProductIds,
      ),
      viewedListingIds: unionIds(
        user.viewedListingIds,
        other.viewedListingIds,
      ).slice(0, MAX_VIEWED),
      viewedProductIds: unionIds(
        user.viewedProductIds,
        other.viewedProductIds,
      ).slice(0, MAX_VIEWED),
      savedSearches: mergeSavedSearches(
        user.savedSearches,
        other.savedSearches,
      ),
      pushTokens: [...new Set([...user.pushTokens, ...other.pushTokens])],
    });
    try {
      await user.save();
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          'Định danh này vừa được gắn cho tài khoản khác, thử lại',
        );
      }
      throw error;
    }
    // Ảnh của tài khoản kia không được giữ (đã có ảnh riêng) → xoá file
    await this.storage.remove(
      [other.avatar, other.coverImage].filter(
        (url) => url && url !== user.avatar && url !== user.coverImage,
      ),
    );
    await this.auditService.log(user.id as string, {
      action: 'Gộp tài khoản',
      targetType: 'user',
      targetId: other.id as string,
      targetTitle: other.name,
    });
    return toUser(user);
  }

  /** Chuyển dữ liệu `from` → `to`, bỏ bản ghi sẽ trùng (index unique) hoặc thành "với chính mình". */
  private async moveData(to: Types.ObjectId, from: Types.ObjectId) {
    await Promise.all([
      this.listingModel
        .updateMany({ author: from }, { $set: { author: to } })
        .exec(),
      this.productModel
        .updateMany({ seller: from }, { $set: { seller: to } })
        .exec(),
      this.notificationModel
        .updateMany({ user: from }, { $set: { user: to } })
        .exec(),
      this.moveReviews(to, from),
      this.moveConversations(to, from),
      this.moveReports(to, from),
    ]);
    await this.dropSelfReports(to);
  }

  /** Báo cáo đang mở về tin / món đồ giờ là của chính người báo cáo → bỏ. */
  private async dropSelfReports(userId: Types.ObjectId) {
    const [listingIds, productIds] = await Promise.all([
      this.listingModel.distinct('_id', { author: userId }).exec(),
      this.productModel.distinct('_id', { seller: userId }).exec(),
    ]);
    await this.reportModel
      .deleteMany({
        reporter: userId,
        status: 'open',
        targetId: { $in: [...listingIds, ...productIds] },
      })
      .exec();
  }

  /** Đánh giá: unique (target, reviewer). Bỏ đánh giá giữa 2 tài khoản và bản trùng với đã có. */
  private async moveReviews(to: Types.ObjectId, from: Types.ObjectId) {
    const [targetsOfTo, reviewersOfTo] = await Promise.all([
      this.reviewModel.distinct('target', { reviewer: to }).exec(),
      this.reviewModel.distinct('reviewer', { target: to }).exec(),
    ]);
    await this.reviewModel
      .deleteMany({
        $or: [
          { reviewer: from, target: to },
          { reviewer: to, target: from },
          { reviewer: from, target: { $in: targetsOfTo } },
          { target: from, reviewer: { $in: reviewersOfTo } },
        ],
      })
      .exec();
    await this.reviewModel
      .updateMany({ reviewer: from }, { $set: { reviewer: to } })
      .exec();
    await this.reviewModel
      .updateMany({ target: from }, { $set: { target: to } })
      .exec();
  }

  /**
   * Chat: unique (target, starter). Cuộc trò chuyện giữa 2 tài khoản (thành tự nói với mình) → xoá;
   * cả 2 cùng hỏi 1 tin → dồn tin nhắn vào cuộc của tài khoản giữ lại.
   */
  private async moveConversations(to: Types.ObjectId, from: Types.ObjectId) {
    const between = await this.conversationModel
      .find({
        $or: [
          { starter: from, owner: to },
          { starter: to, owner: from },
        ],
      })
      .distinct('_id')
      .exec();
    await Promise.all([
      this.messageModel.deleteMany({ conversation: { $in: between } }).exec(),
      this.conversationModel.deleteMany({ _id: { $in: between } }).exec(),
    ]);

    const kept = await this.conversationModel
      .find({ starter: to })
      .lean()
      .exec();
    const keptByTarget = new Map(
      kept.map((item) => [String(item.target), item]),
    );
    const duplicates = await this.conversationModel
      .find({ starter: from, target: { $in: [...keptByTarget.keys()] } })
      .lean()
      .exec();
    for (const duplicate of duplicates) {
      const target = keptByTarget.get(String(duplicate.target))!;
      await this.messageModel
        .updateMany(
          { conversation: duplicate._id },
          { $set: { conversation: target._id } },
        )
        .exec();
      // timestamps: false — giữ updatedAt = thời điểm tin cuối (không phải lúc gộp)
      await this.conversationModel
        .updateOne({ _id: target._id }, mergedConversation(target, duplicate), {
          timestamps: false,
        })
        .exec();
      await this.conversationModel.deleteOne({ _id: duplicate._id }).exec();
    }

    await Promise.all([
      this.conversationModel
        .updateMany({ starter: from }, { $set: { starter: to } })
        .exec(),
      this.conversationModel
        .updateMany({ owner: from }, { $set: { owner: to } })
        .exec(),
      this.messageModel
        .updateMany({ sender: from }, { $set: { sender: to } })
        .exec(),
      // Tin cuối hiện ở danh sách chat ("Bạn: …") theo người gửi
      this.conversationModel
        .updateMany(
          { 'lastMessage.sender': from },
          { $set: { 'lastMessage.sender': to } },
          { timestamps: false },
        )
        .exec(),
    ]);
  }

  /** Báo cáo đang mở: unique (targetId, reporter) → bỏ bản trùng với báo cáo đã có. */
  private async moveReports(to: Types.ObjectId, from: Types.ObjectId) {
    const reportedByTo = await this.reportModel
      .distinct('targetId', { reporter: to, status: 'open' })
      .exec();
    await this.reportModel
      .deleteMany({
        reporter: from,
        status: 'open',
        targetId: { $in: reportedByTo },
      })
      .exec();
    await this.reportModel
      .updateMany({ reporter: from }, { $set: { reporter: to } })
      .exec();
  }
}
