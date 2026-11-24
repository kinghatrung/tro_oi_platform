import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PageModule } from '../page/page.module.js';
import { ListingModule } from '../listing/listing.module.js';
import { ProductModule } from '../product/product.module.js';
import { ReportModule } from '../report/report.module.js';
import { ReviewModule } from '../review/review.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { UserModule } from '../user/user.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [
    AuditModule,
    AuthModule,
    ListingModule,
    PageModule,
    ProductModule,
    ReportModule,
    ReviewModule,
    SettingsModule,
    UserModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
