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
import { buildListingQuery } from '../listing/listing.filter.js';
import { AUTHOR_FIELDS, toListing } from '../listing/listing.mapper.js';
import {
  Listing,
  type ListingDocument,
} from '../listing/schemas/listing.schema.js';
import { buildProductQuery, escapeRegex } from '../product/product.filter.js';
import { SELLER_FIELDS, toProduct } from '../product/product.mapper.js';
import {
  Product,
  type ProductDocument,
} from '../product/schemas/product.schema.js';
import type { UpdateReportDto } from '../report/report.dto.js';
import { ReportService } from '../report/report.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type { UpdateSettingsDto } from '../settings/update-settings.dto.js';
import type {
  AdminListingQueryDto,
  AdminProductQueryDto,
  AdminUpdateUserDto,
  AdminUserQueryDto,
} from './admin.dto.js';
import {
  buildDailySeries,
  dailyCountPipeline,
  dailyWindowStart,
  DAILY_DAYS,
} from './admin.stats.js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Số tỉnh trong "tỉnh có nhiều tin nhất". */
const TOP_CITY_COUNT = 6;
/** Số tin tối đa trả cho bản đồ quản trị. */
const MAP_LIMIT = 5000;

const REPORT_ACTIONS: Record<UpdateReportDto['status'], string> = {
  resolved: 'Xử lý báo cáo',
  dismissed: 'Bỏ qua báo cáo',
  open: 'Mở lại báo cáo',
};

/** [{ _id: status, count }] → { status: count }. */
const toStatusMap = (rows: { _id: string; count: number }[]) =>
  Object.fromEntries(rows.map((row) => [row._id, row.count]));

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    private readonly reportService: ReportService,
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
  ) {}

  async stats() {
    const now = new Date();
    const since = dailyWindowStart(now, DAILY_DAYS);
    const groupBy = (field: string) => [
      { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    ];
    const sumViews = [{ $group: { _id: null, views: { $sum: '$viewCount' } } }];
    type CountRow = { _id: string; count: number };

    const [
      users,
      blocked,
      newUsers,
      userRoleRows,
      listingRows,
      listingCategoryRows,
      listingCityRows,
      listingViews,
      productRows,
      productCategoryRows,
      productViews,
      dailyUsers,
      dailyListings,
      dailyProducts,
      openReports,
    ] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ isBlocked: true }).exec(),
      this.userModel
        .countDocuments({
          createdAt: { $gte: new Date(now.getTime() - 7 * DAY_MS) },
        })
        .exec(),
      this.userModel.aggregate<CountRow>(groupBy('role')).exec(),
      this.listingModel.aggregate<CountRow>(groupBy('status')).exec(),
      this.listingModel.aggregate<CountRow>(groupBy('category')).exec(),
      // Tỉnh có nhiều tin đang hiển thị nhất
      this.listingModel
        .aggregate<CountRow>([
          { $match: { status: 'active' } },
          ...groupBy('address.city'),
          { $sort: { count: -1 } },
          { $limit: TOP_CITY_COUNT },
        ])
        .exec(),
      this.listingModel.aggregate<{ views: number }>(sumViews).exec(),
      this.productModel.aggregate<CountRow>(groupBy('status')).exec(),
      this.productModel.aggregate<CountRow>(groupBy('category')).exec(),
      this.productModel.aggregate<{ views: number }>(sumViews).exec(),
      this.userModel.aggregate<CountRow>(dailyCountPipeline(since)).exec(),
      this.listingModel.aggregate<CountRow>(dailyCountPipeline(since)).exec(),
      this.productModel.aggregate<CountRow>(dailyCountPipeline(since)).exec(),
      this.reportService.countOpen(),
    ]);
    const sum = (rows: { count: number }[]) =>
      rows.reduce((total, row) => total + row.count, 0);

    return {
      users: {
        total: users,
        blocked,
        newLast7Days: newUsers,
        byRole: toStatusMap(userRoleRows),
      },
      listings: {
        total: sum(listingRows),
        byStatus: toStatusMap(listingRows),
        byCategory: toStatusMap(listingCategoryRows),
        topCities: listingCityRows
          .filter((row) => row._id)
          .map((row) => ({ city: row._id, count: row.count })),
        views: listingViews[0]?.views ?? 0,
      },
      products: {
        total: sum(productRows),
        byStatus: toStatusMap(productRows),
        byCategory: toStatusMap(productCategoryRows),
        views: productViews[0]?.views ?? 0,
      },
      reports: { open: openReports },
      daily: buildDailySeries(now, DAILY_DAYS, {
        users: dailyUsers,
        listings: dailyListings,
        products: dailyProducts,
      }),
    };
  }

  /** Người dùng + số tin đã đăng (Trọ ơi, Chợ ơi). */
  async listUsers(query: AdminUserQueryDto) {
    const filter: Record<string, unknown> = {};
    const keyword = query.keyword?.trim();
    if (keyword) {
      const regex = new RegExp(escapeRegex(keyword), 'i');
      // SĐT lưu dạng +84…, admin thường gõ 09…
      const phone = new RegExp(escapeRegex(keyword.replace(/^0/, '+84')));
      filter.$or = [
        { name: regex },
        { phone: regex },
        { phone },
        { email: regex },
      ];
    }
    if (query.role) filter.role = query.role;
    if (query.isBlocked !== undefined) filter.isBlocked = query.isBlocked;

    const [docs, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    const ids = docs.map((doc) => doc._id);
    const countBy = (model: Model<any>, field: string) =>
      model
        .aggregate<{ _id: unknown; count: number }>([
          { $match: { [field]: { $in: ids } } },
          { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        ])
        .exec()
        .then(
          (rows) => new Map(rows.map((row) => [String(row._id), row.count])),
        );
    const [listingCounts, productCounts] = await Promise.all([
      countBy(this.listingModel, 'author'),
      countBy(this.productModel, 'seller'),
    ]);

    return {
      items: docs.map((doc) => ({
        ...toUser(doc),
        listingCount: listingCounts.get(doc.id as string) ?? 0,
        productCount: productCounts.get(doc.id as string) ?? 0,
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async updateUser(adminId: string, id: string, dto: AdminUpdateUserDto) {
    // Tránh admin tự khoá / tự hạ quyền làm mất quyền quản trị
    if (id === adminId) {
      throw new BadRequestException(
        'Không thể tự đổi quyền hoặc khoá chính mình',
      );
    }
    const before = isValidObjectId(id)
      ? await this.userModel
          .findByIdAndUpdate(id, dto, { returnDocument: 'before' })
          .exec()
      : null;
    if (!before) throw new NotFoundException('Không tìm thấy người dùng');

    // Drawer gửi cả form → chỉ ghi phần thực sự đổi
    const actions = [
      dto.role !== undefined &&
        dto.role !== before.role &&
        (dto.role === 'admin' ? 'Cấp quyền quản trị' : 'Gỡ quyền quản trị'),
      dto.isBlocked !== undefined &&
        dto.isBlocked !== before.isBlocked &&
        (dto.isBlocked ? 'Khoá tài khoản' : 'Mở khoá tài khoản'),
    ].filter(Boolean);
    if (actions.length > 0) {
      await this.auditService.log(adminId, {
        action: actions.join(', '),
        targetType: 'user',
        targetId: id,
        targetTitle: before.name,
      });
    }
    before.set(dto);
    return toUser(before);
  }

  async updateReport(adminId: string, id: string, dto: UpdateReportDto) {
    await this.reportService.update(id, dto);
    await this.auditService.log(adminId, {
      action: REPORT_ACTIONS[dto.status],
      targetType: 'report',
      targetId: id,
    });
    return null;
  }

  async updateSettings(adminId: string, dto: UpdateSettingsDto) {
    const settings = await this.settingsService.update(dto);
    await this.auditService.log(adminId, {
      action: 'Cập nhật thiết lập website',
      targetType: 'settings',
    });
    return settings;
  }

  /** Tin Trọ ơi mọi trạng thái (status bỏ trống = tất cả). */
  async listListings(query: AdminListingQueryDto) {
    const { filter, sort, skip, limit } = buildListingQuery(query);
    if (query.status) filter.status = query.status;
    else delete filter.status;

    const [docs, total] = await Promise.all([
      this.listingModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', AUTHOR_FIELDS)
        .exec(),
      this.listingModel.countDocuments(filter).exec(),
    ]);
    return {
      items: docs.map((doc) => toListing(doc)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /**
   * Điểm trên bản đồ quản trị: tin có toạ độ, lọc như listListings nhưng không phân trang,
   * chỉ trả trường cần vẽ ghim.
   */
  async listingMap(query: AdminListingQueryDto) {
    const { filter } = buildListingQuery(query);
    if (query.status) filter.status = query.status;
    else delete filter.status;
    filter['address.geo.latitude'] = { $exists: true };

    // shortcut: tối đa MAP_LIMIT tin mới nhất; nhiều hơn thì chuyển sang tile vector / lọc theo khung nhìn
    const docs = await this.listingModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(MAP_LIMIT)
      .select(
        'title price transaction status category address.city address.ward address.geo',
      )
      .lean()
      .exec();
    return docs.map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      price: doc.price,
      transaction: doc.transaction,
      status: doc.status,
      category: doc.category,
      city: doc.address?.city,
      ward: doc.address?.ward,
      geo: doc.address!.geo!,
    }));
  }

  /** Món Chợ ơi có toạ độ cho bản đồ quản trị — lọc như listProducts, không phân trang. */
  async productMap(query: AdminProductQueryDto) {
    const { filter } = buildProductQuery(query);
    if (query.status) filter.status = query.status;
    else delete filter.status;
    filter['address.geo.latitude'] = { $exists: true };

    // shortcut: tối đa MAP_LIMIT món mới nhất (như listingMap)
    const docs = await this.productModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(MAP_LIMIT)
      .select(
        'title price status category address.city address.ward address.geo',
      )
      .lean()
      .exec();
    return docs.map((doc) => ({
      id: String(doc._id),
      title: doc.title,
      price: doc.price,
      status: doc.status,
      category: doc.category,
      city: doc.address?.city,
      ward: doc.address?.ward,
      geo: doc.address!.geo!,
    }));
  }

  /** Tin Chợ ơi mọi trạng thái. */
  async listProducts(query: AdminProductQueryDto) {
    const { filter, sort, skip, limit } = buildProductQuery(query);
    if (query.status) filter.status = query.status;
    else delete filter.status;

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
}
