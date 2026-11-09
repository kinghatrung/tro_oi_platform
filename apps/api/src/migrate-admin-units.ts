/**
 * Chuyển địa chỉ tin Trọ ơi + món đồ Chợ ơi sang đơn vị hành chính 2 cấp (từ 1/7/2025).
 * Chạy 1 lần: yarn workspace api migrate:admin-units (chạy lại an toàn — dữ liệu đã chuyển được giữ nguyên).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { AppModule } from './app.module.js';
import { migrateAddress } from './common/admin-units-migration.js';
import { withFullAddress } from './modules/listing/listing.mapper.js';
import {
  Listing,
  type ListingDocument,
} from './modules/listing/schemas/listing.schema.js';
import {
  Product,
  type ProductDocument,
} from './modules/product/schemas/product.schema.js';

// Cùng nguồn với web (sinh bởi scripts/build-admin-units.mjs); chạy từ thư mục apps/api
const WARDS = JSON.parse(
  readFileSync(join(process.cwd(), '../web/src/constants/wards.json'), 'utf8'),
) as Record<string, string[]>;

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const listingModel = app.get<Model<ListingDocument>>(
    getModelToken(Listing.name),
  );
  const productModel = app.get<Model<ProductDocument>>(
    getModelToken(Product.name),
  );
  const unmatched: string[] = [];
  let changed = 0;

  // .lean(): object thuần — spread subdocument Mongoose sẽ kéo theo field nội bộ
  for await (const doc of listingModel.find().lean().cursor()) {
    const { unmatched: miss, ...next } = migrateAddress(doc.address, WARDS);
    if (miss)
      unmatched.push(`Tin ${String(doc._id)}: ${doc.address.fullAddress}`);
    if (next.city === doc.address.city && next.ward === doc.address.ward)
      continue;
    // Bỏ quận cũ khỏi fullAddress khi đã có phường thay thế (next còn district nếu không thay được)
    const { district: _district, ...base } = doc.address;
    await listingModel
      .updateOne(
        { _id: doc._id },
        { $set: { address: withFullAddress({ ...base, ...next }) } },
        { timestamps: false },
      )
      .exec();
    changed++;
  }

  for await (const doc of productModel.find().lean().cursor()) {
    const { unmatched: miss, ...next } = migrateAddress(doc.address, WARDS);
    if (miss)
      unmatched.push(
        `Món đồ ${String(doc._id)}: ${doc.address.district ?? ''}, ${doc.address.city}`,
      );
    if (next.city === doc.address.city && next.ward === doc.address.ward)
      continue;
    await productModel
      .updateOne(
        { _id: doc._id },
        { $set: { address: next } },
        { timestamps: false },
      )
      .exec();
    changed++;
  }

  console.log(`Đã chuyển ${changed} địa chỉ.`);
  if (unmatched.length) {
    console.log(
      `${unmatched.length} địa chỉ chưa xác định được phường/xã (sửa tay trong form):`,
    );
    unmatched.forEach((line) => console.log(`  - ${line}`));
  }
  await app.close();
}

void migrate();
