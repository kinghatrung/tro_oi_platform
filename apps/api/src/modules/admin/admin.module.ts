import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { ListingModule } from '../listing/listing.module.js';
import { ProductModule } from '../product/product.module.js';
import { ReportModule } from '../report/report.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [
    AuthModule,
    ListingModule,
    ProductModule,
    ReportModule,
    SettingsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
