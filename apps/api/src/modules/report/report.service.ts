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
import { Report, type ReportDocument } from './report.schema.js';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(userId: string, dto: CreateReportDto) {
    const model =
      dto.targetType === 'listing' ? this.listingModel : this.productModel;
    const exists = await (model as Model<unknown>)
      .exists({ _id: dto.targetId })
      .exec();
    if (!exists) throw new NotFoundException('Không tìm thấy tin cần báo cáo');

    try {
      await this.reportModel.create({ ...dto, reporter: userId });
    } catch (error) {
      // Index unique (targetId, reporter) khi status open
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Bạn đã báo cáo tin này, đang chờ xử lý');
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
    const [listings, products] = await Promise.all([
      this.listingModel
        .find({ _id: { $in: idsOf('listing') } }, 'title')
        .exec(),
      this.productModel
        .find({ _id: { $in: idsOf('product') } }, 'title')
        .exec(),
    ]);
    const titles = new Map(
      [...listings, ...products].map((doc) => [String(doc._id), doc.title]),
    );

    return {
      items: docs.map((doc) => {
        const reporter = doc.reporter as unknown as UserDocument | null;
        return {
          id: doc.id as string,
          targetType: doc.targetType,
          targetId: String(doc.targetId),
          targetTitle: titles.get(String(doc.targetId)) ?? null,
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
