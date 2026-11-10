import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';

import type { UserDocument } from '../auth/schemas/user.schema.js';
import {
  Listing,
  type ListingDocument,
} from '../listing/schemas/listing.schema.js';
import {
  Product,
  type ProductDocument,
} from '../product/schemas/product.schema.js';
import type {
  CreateReportDto,
  ReportQueryDto,
  UpdateReportDto,
} from './report.dto.js';
import { Review, type ReviewDocument } from '../review/review.schema.js';
import { Report, type ReportDocument } from './report.schema.js';

/** Tiêu đề hiển thị cho admin của 1 đánh giá bị báo cáo. */
const reviewTitle = (review: { rating: number; comment?: string }) =>
  `${review.rating}★ — ${review.comment ? `"${review.comment.slice(0, 80)}"` : '(không có lời bình)'}`;

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async create(userId: string, dto: CreateReportDto) {
    const model = {
      listing: this.listingModel,
      product: this.productModel,
      review: this.reviewModel,
    }[dto.targetType];
    const exists = await (model as Model<unknown>)
      .exists({ _id: dto.targetId })
      .exec();
    if (!exists) {
      throw new NotFoundException('Không tìm thấy nội dung cần báo cáo');
    }

    try {
      await this.reportModel.create({ ...dto, reporter: userId });
    } catch (error) {
      // Index unique (targetId, reporter) khi status open
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(
          'Bạn đã báo cáo nội dung này, đang chờ xử lý',
        );
      }
      throw error;
    }
    return null;
  }

  /** Danh sách cho admin, kèm tiêu đề tin bị báo cáo và người báo cáo. */
  async list(query: ReportQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.targetType) filter.targetType = query.targetType;

    const [docs, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .populate('reporter', 'name avatar role')
        .exec(),
      this.reportModel.countDocuments(filter).exec(),
    ]);

    const idsOf = (type: string) =>
      docs.filter((doc) => doc.targetType === type).map((doc) => doc.targetId);
    const [listings, products, reviews] = await Promise.all([
      this.listingModel
        .find({ _id: { $in: idsOf('listing') } }, 'title')
        .exec(),
      this.productModel
        .find({ _id: { $in: idsOf('product') } }, 'title')
        .exec(),
      this.reviewModel
        .find({ _id: { $in: idsOf('review') } }, 'rating comment target')
        .exec(),
    ]);
    const titles = new Map<string, string>([
      ...[...listings, ...products].map(
        (doc) => [String(doc._id), doc.title] as [string, string],
      ),
      ...reviews.map(
        (doc) => [String(doc._id), reviewTitle(doc)] as [string, string],
      ),
    ]);
    // Đánh giá → hồ sơ người được đánh giá (link cho admin)
    const reviewees = new Map(
      reviews.map((doc) => [String(doc._id), String(doc.target)]),
    );

    return {
      items: docs.map((doc) => {
        const reporter = doc.reporter as unknown as UserDocument | null;
        return {
          id: doc.id as string,
          targetType: doc.targetType,
          targetId: String(doc.targetId),
          targetTitle: titles.get(String(doc.targetId)) ?? null,
          targetUserId: reviewees.get(String(doc.targetId)),
          reason: doc.reason,
          note: doc.note,
          status: doc.status,
          reporter: reporter && {
            id: reporter.id as string,
            name: reporter.name,
            avatar: reporter.avatar,
            role: reporter.role,
          },
          createdAt: doc.createdAt.toISOString(),
        };
      }),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async update(id: string, dto: UpdateReportDto) {
    const doc = isValidObjectId(id)
      ? await this.reportModel
          .findByIdAndUpdate(
            id,
            { status: dto.status },
            { returnDocument: 'after' },
          )
          .exec()
      : null;
    if (!doc) throw new NotFoundException('Không tìm thấy báo cáo');
    return null;
  }

  countOpen() {
    return this.reportModel.countDocuments({ status: 'open' }).exec();
  }
}
