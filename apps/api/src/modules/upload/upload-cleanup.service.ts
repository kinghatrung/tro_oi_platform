import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { User, type UserDocument } from '../auth/schemas/user.schema.js';
import {
  Message,
  type MessageDocument,
} from '../chat/schemas/message.schema.js';
import {
  Listing,
  type ListingDocument,
} from '../listing/schemas/listing.schema.js';
import { Page, type PageDocument } from '../page/page.schema.js';
import {
  Product,
  type ProductDocument,
} from '../product/schemas/product.schema.js';
import { Setting, type SettingDocument } from '../settings/settings.schema.js';
import { StorageService } from './storage.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Chỉ xoá file đã upload quá lâu: form đang soạn (ảnh đã tải, chưa bấm đăng) không bị mất. */
export const ORPHAN_MIN_AGE_MS = 7 * DAY_MS;
const FIRST_RUN_DELAY_MS = 10 * 60 * 1000;
const UPLOAD_NAME = /^(\d{13})-[a-f0-9]+\.[a-z0-9]+$/;
const UPLOAD_PATH = /\/uploads\/([\w.-]+)/g;

/** Tên do API sinh (`<ms>-<hex>.<đuôi>`) → thời điểm upload; tên khác → null (không bao giờ xoá). */
export const uploadedAt = (name: string) => {
  const match = UPLOAD_NAME.exec(name);
  return match ? Number(match[1]) : null;
};

/** File cần xoá: không nơi nào tham chiếu, tên do API sinh và đủ cũ. */
export function findOrphans(
  names: string[],
  referenced: Set<string>,
  now = Date.now(),
) {
  return names.filter((name) => {
    const time = uploadedAt(name);
    return (
      time !== null && !referenced.has(name) && now - time >= ORPHAN_MIN_AGE_MS
    );
  });
}

/**
 * Dọn file upload mồ côi (tải lên rồi bỏ form, đổi ảnh khi lỗi giữa chừng...) mỗi ngày.
 * Thêm field mới lưu URL upload → PHẢI thêm vào referencedNames, nếu không file sẽ bị xoá sau 7 ngày.
 */
@Injectable()
export class UploadCleanupService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UploadCleanupService.name);
  private timers: NodeJS.Timeout[] = [];

  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
    @InjectModel(Page.name) private readonly pageModel: Model<PageDocument>,
    private readonly storage: StorageService,
  ) {}

  onModuleInit() {
    // Chạy lần đầu sau khi khởi động một lúc (không làm chậm lúc deploy), sau đó mỗi ngày
    this.timers = [
      setTimeout(() => void this.run(), FIRST_RUN_DELAY_MS),
      setInterval(() => void this.run(), DAY_MS),
    ];
  }

  onModuleDestroy() {
    this.timers.forEach(clearTimeout);
  }

  async run() {
    try {
      const [names, referenced] = await Promise.all([
        this.storage.listNames(),
        this.referencedNames(),
      ]);
      const orphans = findOrphans(names, referenced);
      if (orphans.length === 0) return 0;
      const removed = await this.storage.removeNames(orphans);
      this.logger.log(`Đã dọn ${removed} file upload mồ côi`);
      return removed;
    } catch (error) {
      this.logger.warn(
        `Không dọn được file upload: ${(error as Error).message}`,
      );
      return 0;
    }
  }

  /** Tên mọi file upload đang được dùng ở bất kỳ đâu. */
  private async referencedNames() {
    const [urlLists, settings, pages] = await Promise.all([
      Promise.all([
        this.listingModel.distinct('images').exec(),
        this.listingModel.distinct('video').exec(),
        this.listingModel.distinct('videoPoster').exec(),
        this.productModel.distinct('images').exec(),
        this.userModel.distinct('avatar').exec(),
        this.userModel.distinct('coverImage').exec(),
        this.messageModel.distinct('images').exec(),
      ]),
      this.settingModel.find().lean().exec(),
      this.pageModel.find().lean().exec(),
    ]);
    // Thiết lập (logo, favicon, banner) và nội dung trang: quét cả văn bản, không phụ thuộc tên field
    const text = [
      ...urlLists.flat().map(String),
      JSON.stringify(settings),
      JSON.stringify(pages),
    ].join('\n');
    return new Set([...text.matchAll(UPLOAD_PATH)].map((match) => match[1]));
  }
}
