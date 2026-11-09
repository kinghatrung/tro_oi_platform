/** Tạo user + tin đăng mẫu cho môi trường dev. Bỏ qua nếu DB đã có tin. */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { AppModule } from './app.module.js';
import { User, type UserDocument } from './modules/auth/schemas/user.schema.js';
import { withFullAddress } from './modules/listing/listing.mapper.js';
import {
  Product,
  type ProductDocument,
} from './modules/product/schemas/product.schema.js';
import {
  AMENITIES,
  DIRECTIONS,
  FURNISHING_STATUSES,
  LISTING_CATEGORIES,
  Listing,
  type ListingDocument,
} from './modules/listing/schemas/listing.schema.js';

// Tên thành phố phải khớp CITIES bên apps/web/src/constants
const AREAS = [
  {
    city: 'Hà Nội',
    districts: ['Cầu Giấy', 'Đống Đa', 'Thanh Xuân', 'Ba Đình'],
    geo: [21.03, 105.8],
  },
  {
    city: 'Hồ Chí Minh',
    districts: ['Quận 1', 'Bình Thạnh', 'Gò Vấp', 'Thủ Đức'],
    geo: [10.78, 106.7],
  },
  { city: 'Đà Nẵng', districts: ['Hải Châu', 'Sơn Trà'], geo: [16.05, 108.2] },
  { city: 'Cần Thơ', districts: ['Ninh Kiều'], geo: [10.03, 105.78] },
  {
    city: 'Bình Dương',
    districts: ['Thủ Dầu Một', 'Dĩ An'],
    geo: [10.98, 106.65],
  },
];
const ADMIN_PHONE = '+84900000000';
const TITLES = {
  'phong-tro': 'Phòng trọ khép kín full đồ, giờ giấc tự do',
  'can-ho': 'Căn hộ dịch vụ 1PN ban công thoáng, có thang máy',
  'nguyen-can': 'Nhà nguyên căn 3 tầng ngõ ô tô, phù hợp gia đình',
  'o-ghep': 'Tìm bạn nữ ở ghép phòng rộng, gần trường đại học',
};
const IMAGES = [
  '/images/banner-0.png',
  '/images/banner-1.png',
  '/images/banner-2.png',
  '/images/banner-3.png',
  '/images/test.jpg',
];

const PRODUCT_SAMPLES = [
  { title: 'Tủ quần áo gỗ 2 cánh', category: 'furniture', price: 650_000 },
  { title: 'Bàn học gấp gọn kèm ghế', category: 'furniture', price: 280_000 },
  { title: 'Quạt điện đứng Senko', category: 'appliance', price: 150_000 },
  { title: 'Nồi cơm điện 1.8L', category: 'appliance', price: 220_000 },
  { title: 'Tủ lạnh mini 90L', category: 'appliance', price: 1_200_000 },
  {
    title: 'Laptop văn phòng core i5',
    category: 'electronics',
    price: 4_500_000,
  },
  {
    title: 'Màn hình 24 inch Full HD',
    category: 'electronics',
    price: 1_600_000,
  },
  { title: 'Xe đạp thể thao', category: 'vehicle', price: 1_100_000 },
  { title: 'Giáo trình kinh tế vi mô', category: 'study', price: 60_000 },
  { title: 'Combo sách luyện IELTS', category: 'study', price: 250_000 },
] as const;
const CONDITIONS = ['new', 'like-new', 'good', 'fair'] as const;

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const listingModel = app.get<Model<ListingDocument>>(
    getModelToken(Listing.name),
  );
  const productModel = app.get<Model<ProductDocument>>(
    getModelToken(Product.name),
  );

  /** Tạo user nếu chưa có (theo SĐT), không ghi đè dữ liệu đã sửa. */
  const ensureUser = (phone: string, values: Partial<User>) =>
    userModel
      .findOneAndUpdate(
        { phone },
        { $setOnInsert: { phone, ...values } },
        { upsert: true, returnDocument: 'after' },
      )
      .orFail()
      .exec();

  // 1. Tài khoản quản trị — luôn đảm bảo tồn tại và là admin
  await userModel
    .updateOne(
      { phone: ADMIN_PHONE },
      {
        $set: { role: 'admin', isBlocked: false },
        $setOnInsert: { name: 'Quản trị viên' },
      },
      { upsert: true },
    )
    .exec();

  const authors = await Promise.all([
    ensureUser('+84900000001', {
      name: 'Minh Huyên',
      role: 'agent',
      bio: 'Môi giới phòng trọ khu Cầu Giấy',
    }),
    ensureUser('+84900000002', { name: 'Hoàng Thái', role: 'landlord' }),
    ensureUser('+84900000003', { name: 'Lan Anh', role: 'landlord' }),
  ]);

  // 2. Tin Trọ ơi
  if ((await listingModel.estimatedDocumentCount()) === 0) {
    const listings = Array.from({ length: 60 }, (_, index) => {
      const category = LISTING_CATEGORIES[index % LISTING_CATEGORIES.length];
      const area = AREAS[index % AREAS.length];
      const district = area.districts[index % area.districts.length];
      const isBuy = index % 3 === 0 && category !== 'o-ghep';
      const size = 18 + (index % 8) * 6;

      return {
        title: `${TITLES[category]} - ${district}`,
        description: `${TITLES[category]}.
- Diện tích ${size}m², sạch sẽ, an ninh.
- Gần chợ, trường học, bến xe buýt.
Liên hệ để xem phòng.`,
        category,
        transaction: isBuy ? 'buy-room' : 'rent-room',
        status: 'active',
        price: isBuy
          ? 1_500_000_000 + (index % 10) * 250_000_000
          : 1_800_000 + (index % 10) * 400_000,
        area: size,
        bedrooms: 1 + (index % 3),
        bathrooms: 1,
        floorCount: category === 'nguyen-can' ? 3 : undefined,
        direction: DIRECTIONS[index % DIRECTIONS.length],
        furnishing: FURNISHING_STATUSES[index % FURNISHING_STATUSES.length],
        amenities: AMENITIES.filter((_, i) => (i + index) % 3 !== 0),
        images: [
          ...IMAGES.slice(index % IMAGES.length),
          ...IMAGES.slice(0, index % IMAGES.length),
        ],
        address: withFullAddress({
          street: `Số ${10 + index} ngõ ${100 + index}`,
          district,
          city: area.city,
          geo: {
            latitude: area.geo[0] + (index % 5) * 0.004,
            longitude: area.geo[1] + (index % 7) * 0.004,
          },
        }),
        author: authors[index % authors.length]._id,
        isFeatured: index % 10 === 0,
        viewCount: (index * 37) % 500,
        // rải thời gian đăng để sort "mới nhất" có ý nghĩa
        createdAt: new Date(Date.now() - index * 3 * 60 * 60 * 1000),
      };
    });
    await listingModel.insertMany(listings);
    console.log(`Đã tạo ${listings.length} tin Trọ ơi.`);
  }

  // 3. Đồ Chợ ơi (ảnh placeholder — người dùng thật sẽ upload ảnh)
  if ((await productModel.estimatedDocumentCount()) === 0) {
    const products = Array.from({ length: 30 }, (_, index) => {
      const sample = PRODUCT_SAMPLES[index % PRODUCT_SAMPLES.length];
      const area = AREAS[index % AREAS.length];
      return {
        title: sample.title,
        description: `${sample.title}, còn dùng tốt. Chuyển phòng nên pass lại, có thể xem trực tiếp.`,
        category: sample.category,
        condition: CONDITIONS[index % CONDITIONS.length],
        status: 'active',
        price: sample.price,
        isNegotiable: index % 2 === 0,
        images: ['/images/no-image.svg'],
        address: { city: area.city, district: area.districts[0] },
        seller: authors[index % authors.length]._id,
        viewCount: (index * 23) % 200,
        createdAt: new Date(Date.now() - index * 5 * 60 * 60 * 1000),
      };
    });
    await productModel.insertMany(products);
    console.log(`Đã tạo ${products.length} món Chợ ơi.`);
  }

  console.log(
    'Đăng nhập (AUTH_DEV_LOGIN=true): người đăng 0900000001, admin 0900000000',
  );
  await app.close();
}

void seed();
