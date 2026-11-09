import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuditModule } from '../audit/audit.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationModule } from '../notification/notification.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ProductController } from './product.controller.js';
import { ProductService } from './product.service.js';
import { Product, ProductSchema } from './schemas/product.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    AuthModule,
    SettingsModule,
    AuditModule,
    NotificationModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [MongooseModule],
})
export class ProductModule {}
