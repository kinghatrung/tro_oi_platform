import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { AuditService } from '../audit/audit.service.js';
import { parseContent } from './page-content.js';
import type { UpsertPageDto } from './page.dto.js';
import {
  DEFAULT_PAGE_TITLES,
  PAGE_SLUGS,
  Page,
  type PageDocument,
  type PageSlug,
} from './page.schema.js';

const assertSlug = (slug: string): PageSlug => {
  if (!(PAGE_SLUGS as readonly string[]).includes(slug)) {
    throw new NotFoundException('Không tìm thấy trang');
  }
  return slug as PageSlug;
};

@Injectable()
export class PageService {
  constructor(
    @InjectModel(Page.name) private readonly pageModel: Model<PageDocument>,
    private readonly auditService: AuditService,
  ) {}

  /** Trang đã đăng (có nội dung) — cho link ở chân trang. */
  async listPublished() {
    const docs = await this.pageModel
      .find({ content: { $ne: '' } }, 'slug title updatedAt')
      .exec();
    return docs.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      updatedAt: doc.updatedAt.toISOString(),
    }));
  }

  async getPublished(slug: string) {
    const doc = await this.pageModel.findOne({ slug: assertSlug(slug) }).exec();
    if (!doc?.content) throw new NotFoundException('Không tìm thấy trang');
    return {
      slug: doc.slug,
      title: doc.title,
      blocks: parseContent(doc.content),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }

  /** Admin soạn: chưa có thì trả tiêu đề mặc định + nội dung rỗng. */
  async getForAdmin(slug: string) {
    const valid = assertSlug(slug);
    const doc = await this.pageModel.findOne({ slug: valid }).exec();
    return {
      slug: valid,
      title: doc?.title ?? DEFAULT_PAGE_TITLES[valid],
      content: doc?.content ?? '',
      updatedAt: doc?.updatedAt.toISOString() ?? null,
    };
  }

  async upsert(adminId: string, slug: string, dto: UpsertPageDto) {
    const valid = assertSlug(slug);
    const content = dto.content.trim();
    await this.pageModel
      .updateOne(
        { slug: valid },
        { $set: { title: dto.title.trim(), content } },
        { upsert: true },
      )
      .exec();
    await this.auditService.log(adminId, {
      action: content ? 'Cập nhật trang' : 'Gỡ trang',
      targetType: 'page',
      targetId: valid,
      targetTitle: dto.title.trim(),
    });
    return this.getForAdmin(valid);
  }
}
