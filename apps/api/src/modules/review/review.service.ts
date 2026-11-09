import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Types, type Model } from 'mongoose';

import type { AuthUser } from '../../common/current-user.decorator.js';
import { AuditService } from '../audit/audit.service.js';
import { User, type UserDocument } from '../auth/schemas/user.schema.js';
import {
  Conversation,
  type ConversationDocument,
} from '../chat/schemas/conversation.schema.js';
import { NotificationService } from '../notification/notification.service.js';
import type { ReviewQueryDto, UpsertReviewDto } from './review.dto.js';
import { Review, type ReviewDocument } from './review.schema.js';

const toReview = (doc: ReviewDocument) => {
  const reviewer = doc.reviewer as unknown as UserDocument | null;
  return {
    id: doc.id as string,
    rating: doc.rating,
    comment: doc.comment,
    reviewer: reviewer && {
      id: reviewer.id as string,
      name: reviewer.name,
      avatar: reviewer.avatar,
      role: reviewer.role,
    },
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
};

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<ConversationDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly notificationService: NotificationService,
    private readonly auditService: AuditService,
  ) {}

  /** Đánh giá về 1 người (mới trước) + điểm trung bình. Công khai. */
  async list(query: ReviewQueryDto) {
    const target = new Types.ObjectId(query.userId);
    const [docs, [summary]] = await Promise.all([
      this.reviewModel
        .find({ target })
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .populate('reviewer', 'name avatar role')
        .exec(),
      this.reviewModel
        .aggregate<{ average: number; count: number }>([
          { $match: { target } },
          {
            $group: {
              _id: null,
              average: { $avg: '$rating' },
              count: { $sum: 1 },
            },
          },
        ])
        .exec(),
    ]);
    const count = summary?.count ?? 0;
    return {
      items: docs.map(toReview),
      total: count,
      page: query.page,
      pageSize: query.pageSize,
      count,
      average: summary ? Math.round(summary.average * 10) / 10 : null,
    };
  }

  /** Tôi có được đánh giá người này không + đánh giá tôi đã viết (để sửa). */
  async mine(userId: string, targetId: string) {
    const [canReview, review] = await Promise.all([
      this.canReview(userId, targetId),
      this.reviewModel
        .findOne({ target: targetId, reviewer: userId })
        .populate('reviewer', 'name avatar role')
        .exec(),
    ]);
    return { canReview, review: review && toReview(review) };
  }

  /** Viết mới hoặc sửa đánh giá của mình. Lần đầu → báo cho người được đánh giá. */
  async upsert(userId: string, dto: UpsertReviewDto) {
    if (!(await this.canReview(userId, dto.userId))) {
      throw new ForbiddenException(
        'Chỉ người đã trao đổi tin nhắn với người này mới đánh giá được',
      );
    }
    const filter = { target: dto.userId, reviewer: userId };
    const existed = await this.reviewModel.exists(filter).exec();
    const doc = await this.reviewModel
      .findOneAndUpdate(
        filter,
        {
          $set: {
            rating: dto.rating,
            comment: dto.comment?.trim() || undefined,
          },
        },
        { upsert: true, returnDocument: 'after' },
      )
      .populate('reviewer', 'name avatar role')
      .exec();
    const review = toReview(doc!);

    if (!existed) {
      await this.notificationService.notify([
        {
          user: dto.userId,
          input: {
            kind: 'info',
            title: 'Bạn có đánh giá mới',
            message: `${review.reviewer?.name ?? 'Một người dùng'} đánh giá bạn ${dto.rating}★.`,
            link: `/nguoi-dung/${dto.userId}`,
          },
        },
      ]);
    }
    return review;
  }

  /** Người viết xoá đánh giá của mình; admin xoá được mọi đánh giá (ghi nhật ký). */
  async remove(user: AuthUser, id: string) {
    const doc = isValidObjectId(id)
      ? await this.reviewModel.findById(id).exec()
      : null;
    if (!doc) throw new NotFoundException('Không tìm thấy đánh giá');
    const isAuthor = doc.reviewer.equals(user.sub);
    if (!isAuthor && user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền xoá đánh giá này');
    }
    await doc.deleteOne();
    if (!isAuthor) {
      await this.auditService.log(user.sub, {
        action: `Xoá đánh giá ${doc.rating}★`,
        targetType: 'review',
        targetId: String(doc.target),
        targetTitle: doc.comment?.slice(0, 80),
      });
    }
    return null;
  }

  /** Không tự đánh giá; 2 người phải từng nhắn tin qua lại (cuộc trò chuyện có tin nhắn). */
  async canReview(userId: string, targetId: string) {
    if (userId === targetId) return false;
    if (!(await this.userModel.exists({ _id: targetId }).exec())) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }
    const talked = await this.conversationModel
      .exists({
        lastMessage: { $exists: true },
        $or: [
          { starter: userId, owner: targetId },
          { starter: targetId, owner: userId },
        ],
      })
      .exec();
    return Boolean(talked);
  }
}
