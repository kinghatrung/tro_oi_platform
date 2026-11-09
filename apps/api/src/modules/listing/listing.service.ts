import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, type Types } from 'mongoose';

import type { AuthUser } from '../../common/current-user.decorator.js';
import { recordModeration } from '../../common/moderation.js';
import { assertOwnerStatusChange } from '../../common/status-rules.js';
import { AuditService } from '../audit/audit.service.js';
import { NotificationService } from '../notification/notification.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type {
  CreateListingDto,
  SearchListingDto,
  UpdateListingDto,
} from './dto/listing.dto.js';
import { buildListingQuery } from './listing.filter.js';
import { AUTHOR_FIELDS, toListing, withFullAddress } from './listing.mapper.js';
import { User, type UserDocument } from '../auth/schemas/user.schema.js';
import { matchesSavedSearch } from './saved-search-match.js';
import { Listing, type ListingDocument } from './schemas/listing.schema.js';

/** Trạng thái chủ tin tự chuyển được: hiển thị ↔ ẩn, hết hạn → hiển thị (gia hạn). */
const OWNER_STATUSES = ['active', 'closed'] as const;

/** Tin hiển thị được bao lâu kể từ lần đăng / duyệt / gia hạn gần nhất. */
export const LISTING_TTL_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;
const EXPIRE_CHECK_MS = 60 * 60 * 1000;
/** Báo chủ tin trước khi hết hạn bao lâu. */
const REMIND_BEFORE_MS = 3 * DAY_MS;
/** Số thông báo "tin mới khớp tìm kiếm" ghi mỗi lần. */
const ALERT_BATCH = 500;

export const nextExpiry = (from = Date.now()) =>
  new Date(from + LISTING_TTL_DAYS * DAY_MS);

const formatDate = (date: Date) =>
  date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

@Injectable()
export class ListingService implements OnModuleInit, OnModuleDestroy {
  private expireTimer?: NodeJS.Timeout;
  private readonly logger = new Logger(ListingService.name);

  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly settingsService: SettingsService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  // Mỗi instance API đều chạy hẹn giờ; checkExpiry nhận tin nguyên tử nên không báo trùng
  async onModuleInit() {
    // Tin cũ chưa có hạn: cho thêm 1 kỳ kể từ lúc triển khai thay vì hết hạn hàng loạt
    await this.listingModel
      .updateMany(
        { status: 'active', expiresAt: { $exists: false } },
        { $set: { expiresAt: nextExpiry() } },
      )
      .exec();
    await this.checkExpiry();
    this.expireTimer = setInterval(
      () => void this.checkExpiry(),
      EXPIRE_CHECK_MS,
    );
  }

  onModuleDestroy() {
    clearInterval(this.expireTimer);
  }

  /**
   * Tin sắp hết hạn → báo chủ tin (1 lần / kỳ). Tin quá expiresAt → expired
   * (ẩn khỏi tìm kiếm, chủ tin gia hạn ở Kênh người đăng) + báo chủ tin.
   */
  async checkExpiry() {
    const now = new Date();
    // Nhận từng tin nguyên tử: nhiều instance API chạy job cùng lúc vẫn không báo trùng
    const expiring = await this.claimAll(
      {
        status: 'active',
        expiryReminded: { $ne: true },
        expiresAt: {
          $gt: now,
          $lte: new Date(now.getTime() + REMIND_BEFORE_MS),
        },
      },
      { $set: { expiryReminded: true } },
      false, // cờ nội bộ, không đổi updatedAt
    );
    const overdue = await this.claimAll(
      { status: 'active', expiresAt: { $lte: now } },
      { $set: { status: 'expired' } },
      true,
    );

    const manage = '/kenh-nguoi-dang/tin-dang';
    await this.notificationService.notify([
      ...expiring.map((doc) => ({
        user: doc.author,
        input: {
          kind: 'warning' as const,
          title: 'Tin sắp hết hạn',
          message: `"${doc.title}" sẽ hết hạn ngày ${formatDate(doc.expiresAt!)}. Gia hạn để tin tiếp tục hiển thị.`,
          link: manage,
        },
      })),
      ...overdue.map((doc) => ({
        user: doc.author,
        input: {
          kind: 'error' as const,
          title: 'Tin đã hết hạn',
          message: `"${doc.title}" đã ngừng hiển thị. Bấm Gia hạn ${LISTING_TTL_DAYS} ngày để đăng lại.`,
          link: manage,
        },
      })),
    ]);
    return overdue.length;
  }

  /** findOneAndUpdate lặp tới khi hết tin khớp; `update` phải làm tin không còn khớp `filter`. */
  private async claimAll(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    timestamps: boolean,
  ) {
    const claimed: ListingDocument[] = [];
    for (;;) {
      const doc = await this.listingModel
        .findOneAndUpdate(filter, update, {
          projection: 'title author expiresAt',
          timestamps,
        })
        .exec();
      if (!doc) return claimed;
      claimed.push(doc);
    }
  }

  async search(query: SearchListingDto) {
    const { filter, sort, skip, limit } = buildListingQuery(query);
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

  /** Số tin active theo transaction × category × city, kèm ảnh đầu của tin mới nhất mỗi nhóm. */
  stats() {
    return this.listingModel
      .aggregate<{
        transaction: string;
        category: string;
        city: string;
        count: number;
        image?: string;
      }>([
        { $match: { status: 'active' } },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: {
              transaction: '$transaction',
              category: '$category',
              city: '$address.city',
            },
            count: { $sum: 1 },
            image: { $first: { $arrayElemAt: ['$images', 0] } },
          },
        },
        {
          $project: {
            _id: 0,
            transaction: '$_id.transaction',
            category: '$_id.category',
            city: '$_id.city',
            count: 1,
            image: 1,
          },
        },
      ])
      .exec();
  }

  /** Mọi tin của tôi, kèm số người đã lưu từng tin (cho Kênh người đăng). */
  async findMine(userId: string) {
    const docs = await this.listingModel
      .find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('author', AUTHOR_FIELDS)
      .exec();

    const ids = docs.map((doc) => doc._id);
    const counts = await this.userModel
      .aggregate<{ _id: unknown; count: number }>([
        { $match: { favoriteListingIds: { $in: ids } } },
        { $unwind: '$favoriteListingIds' },
        { $match: { favoriteListingIds: { $in: ids } } },
        { $group: { _id: '$favoriteListingIds', count: { $sum: 1 } } },
      ])
      .exec();
    const favoriteCount = new Map(
      counts.map((row) => [String(row._id), row.count]),
    );

    return docs.map((doc) =>
      toListing(doc, {
        favoriteCount: favoriteCount.get(doc.id as string) ?? 0,
      }),
    );
  }

  async findActive(id: string) {
    if (!isValidObjectId(id))
      throw new NotFoundException('Không tìm thấy tin đăng');

    // shortcut: mỗi lần mở trang chi tiết +1 view (kể cả F5/bot), cần chống trùng khi có analytics thật
    // timestamps: false — tăng view không được đổi updatedAt ("Cập nhật x ngày trước")
    const doc = await this.listingModel
      .findOneAndUpdate(
        { _id: id, status: 'active' },
        { $inc: { viewCount: 1 } },
        { returnDocument: 'after', timestamps: false },
      )
      .populate('author', AUTHOR_FIELDS)
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tin đăng');

    const listingCount = await this.listingModel
      .countDocuments({ author: doc.author._id, status: 'active' })
      .exec();
    return toListing(doc, { listingCount });
  }

  /** Tin mới: chờ duyệt nếu admin bật requireListingApproval, ngược lại hiển thị ngay. */
  async create(user: AuthUser, dto: CreateListingDto) {
    const { requireListingApproval } = await this.settingsService.get();
    const doc = await this.listingModel.create({
      ...dto,
      address: withFullAddress(dto.address),
      author: user.sub,
      status: requireListingApproval ? 'pending' : 'active',
      ...(!requireListingApproval && { expiresAt: nextExpiry() }),
    });
    if (doc.status === 'active') void this.alertSavedSearches(doc, doc.author);
    await doc.populate('author', AUTHOR_FIELDS);
    return toListing(doc);
  }

  async update(user: AuthUser, id: string, dto: UpdateListingDto) {
    const doc = await this.findOwned(user, id);
    const from = doc.status;
    assertOwnerStatusChange(
      doc.status,
      dto.status,
      OWNER_STATUSES,
      user.role === 'admin',
    );
    doc.set({
      ...dto,
      ...(dto.address && { address: withFullAddress(dto.address) }),
      // Duyệt / hiện lại / gia hạn tin hết hạn → tính lại hạn hiển thị
      ...(dto.status === 'active' &&
        from !== 'active' && {
          expiresAt: nextExpiry(),
          expiryReminded: false,
        }),
    });
    await doc.save();
    await this.moderated(user, doc, from, doc.status);
    if (from === 'pending' && doc.status === 'active') {
      void this.alertSavedSearches(doc, doc.author); // tin vừa được duyệt = tin mới
    }
    await doc.populate('author', AUTHOR_FIELDS);
    return toListing(doc);
  }

  async remove(user: AuthUser, id: string) {
    const doc = await this.findOwned(user, id);
    await doc.deleteOne();
    await this.moderated(user, doc, doc.status, null);
    return null;
  }

  /**
   * Tin mới hiển thị (đăng không cần duyệt / vừa được duyệt) → báo người có tìm kiếm đã lưu khớp tin
   * (1 thông báo / người). Chạy nền, lỗi chỉ ghi log.
   */
  // shortcut: so khớp từng tìm kiếm đã lưu bằng JS (không dùng index) — rất nhiều user thì lưu bộ lọc có cấu trúc để query thẳng Mongo
  private async alertSavedSearches(
    doc: ListingDocument,
    authorId: Types.ObjectId,
  ) {
    try {
      // Đọc dần bằng cursor + gửi theo lô: không nạp hết user vào bộ nhớ
      const users = this.userModel
        .find(
          {
            'savedSearches.0': { $exists: true },
            _id: { $ne: authorId },
            isBlocked: { $ne: true },
          },
          'savedSearches',
        )
        .cursor();
      let batch: Parameters<NotificationService['notify']>[0] = [];
      for await (const user of users) {
        const search = user.savedSearches.find((item) =>
          matchesSavedSearch(doc, item.query),
        );
        if (search) {
          batch.push({
            user: user._id,
            input: {
              kind: 'info',
              title: 'Có tin mới khớp tìm kiếm của bạn',
              message: `"${doc.title}" · ${search.title}`,
              link: `/phong-tro/${doc.id as string}`,
            },
          });
        }
        if (batch.length >= ALERT_BATCH) {
          await this.notificationService.notify(batch);
          batch = [];
        }
      }
      await this.notificationService.notify(batch);
    } catch (error) {
      this.logger.warn(
        `Không gửi được thông báo tìm kiếm đã lưu: ${(error as Error).message}`,
      );
    }
  }

  private moderated(
    user: AuthUser,
    doc: ListingDocument,
    from: string,
    to: string | null,
  ) {
    return recordModeration(
      { audit: this.auditService, notification: this.notificationService },
      user,
      'listing',
      doc.author,
      { id: doc.id as string, title: doc.title },
      from,
      to,
    );
  }

  /** Tin tồn tại và user là chủ tin hoặc admin. */
  private async findOwned(user: AuthUser, id: string) {
    if (!isValidObjectId(id))
      throw new NotFoundException('Không tìm thấy tin đăng');

    const doc = await this.listingModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tin đăng');
    if (!doc.author.equals(user.sub) && user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền sửa tin đăng này');
    }
    return doc;
  }
}
