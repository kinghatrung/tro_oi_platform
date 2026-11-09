import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module.js';
import { PageController } from './page.controller.js';
import { Page, PageSchema } from './page.schema.js';
import { PageService } from './page.service.js';

/** Trang chính sách (điều khoản, bảo mật) do admin soạn. */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: Page.name, schema: PageSchema }]),
    AuditModule,
  ],
  controllers: [PageController],
  providers: [PageService],
  exports: [PageService],
})
export class PageModule {}
