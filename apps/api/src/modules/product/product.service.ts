import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';

import type { AuthUser } from '../../common/current-user.decorator.js';
import { recordModeration } from '../../common/moderation.js';
import { assertOwnerStatusChange } from '../../common/status-rules.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type {
  CreateProductDto,
  SearchProductDto,
  UpdateProductDto,
} from './dto/product.dto.js';
import { buildProductQuery } from './product.filter.js';
import { SELLER_FIELDS, toProduct } from './product.mapper.js';
import { Product, type ProductDocument } from './schemas/product.schema.js';

/** Trạng thái người bán tự chuyển được: đang bán ↔ đã bán ↔ ẩn. */
const OWNER_STATUSES = ['active', 'sold', 'closed'] as const;

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async search(query: SearchProductDto) {
    const { filter, sort, skip, limit } = buildProductQuery(query);
    const [docs, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('seller', SELLER_FIELDS)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);
    return {
      items: docs.map(toProduct),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findMine(userId: string) {
    const docs = await this.productModel
      .find({ seller: userId })
      .sort({ createdAt: -1 })
      .populate('seller', SELLER_FIELDS)
      .exec();
    return docs.map(toProduct);
  }

  /** Chi tiết món đang bán, +1 lượt xem (không đổi updatedAt). */
  async findActive(id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Không tìm thấy món đồ');
    }
    const doc = await this.productModel
      .findOneAndUpdate(
        { _id: id, status: 'active' },
        { $inc: { viewCount: 1 } },
        { returnDocument: 'after', timestamps: false },
      )
      .populate('seller', SELLER_FIELDS)
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy món đồ');
    return toProduct(doc);
  }

  async create(user: AuthUser, dto: CreateProductDto) {
    const { requireProductApproval, enableMarketplace } =
      await this.settingsService.get();
    if (!enableMarketplace) {
      throw new ForbiddenException('Chợ ơi đang tạm đóng');
    }
    const doc = await this.productModel.create({
      ...dto,
      seller: user.sub,
      status: requireProductApproval ? 'pending' : 'active',
    });
    await doc.populate('seller', SELLER_FIELDS);
    return toProduct(doc);
  }

  async update(user: AuthUser, id: string, dto: UpdateProductDto) {
    const doc = await this.findOwned(user, id);
    const from = doc.status;
    assertOwnerStatusChange(
      doc.status,
      dto.status,
      OWNER_STATUSES,
      user.role === 'admin',
    );
    doc.set(dto);
    await doc.save();
    await this.moderated(user, doc, from, doc.status);
    await doc.populate('seller', SELLER_FIELDS);
    return toProduct(doc);
  }

  async remove(user: AuthUser, id: string) {
    const doc = await this.findOwned(user, id);
    await doc.deleteOne();
    await this.moderated(user, doc, doc.status, null);
    return null;
  }

  private moderated(
    user: AuthUser,
    doc: ProductDocument,
    from: string,
    to: string | null,
  ) {
    return recordModeration(
      { audit: this.auditService, notification: this.notificationService },
      user,
      'product',
      doc.seller,
      { id: doc.id as string, title: doc.title },
      from,
      to,
    );
  }

  /** Món đồ tồn tại và user là người bán hoặc admin. */
  private async findOwned(user: AuthUser, id: string) {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Không tìm thấy món đồ');
    }
    const doc = await this.productModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy món đồ');
    if (!doc.seller.equals(user.sub) && user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền sửa món đồ này');
    }
    return doc;
  }
}
