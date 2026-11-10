import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { ListingModule } from '../listing/listing.module.js';
import { ProductModule } from '../product/product.module.js';
import { Review, ReviewSchema } from '../review/review.schema.js';
import { ReportController } from './report.controller.js';
import { Report, ReportSchema } from './report.schema.js';
import { ReportService } from './report.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Report.name, schema: ReportSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
    AuthModule,
    ListingModule,
    ProductModule,
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
