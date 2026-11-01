/** Tạo user + tin đăng mẫu cho môi trường dev. Bỏ qua nếu DB đã có tin. */
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { AppModule } from './app.module.js';
import { User, type UserDocument } from './modules/auth/schemas/user.schema.js';
import { withFullAddress } from './modules/listing/listing.mapper.js';
import {
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

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const listingModel = app.get<Model<ListingDocument>>(
    getModelToken(Listing.name),
  );

  if ((await listingModel.estimatedDocumentCount()) > 0) {
    console.log('DB đã có tin đăng — bỏ qua seed.');
    await app.close();
    return;
  }

  const authors = await userModel.create([
    {
      phone: '+84900000001',
      name: 'Minh Huyên',
      role: 'agent',
      bio: 'Môi giới phòng trọ khu Cầu Giấy',
    },
    { phone: '+84900000002', name: 'Hoàng Thái', role: 'landlord' },
    { phone: '+84900000003', name: 'Lan Anh', role: 'landlord' },
  ]);

  const listings = Array.from({ length: 60 }, (_, index) => {
    const category = LISTING_CATEGORIES[index % LISTING_CATEGORIES.length];
    const area = AREAS[index % AREAS.length];
    const district = area.districts[index % area.districts.length];
    const isBuy = index % 3 === 0 && category !== 'o-ghep';
    const size = 18 + (index % 8) * 6;

    return {
      title: `${TITLES[category]} - ${district}`,
      description: `${TITLES[category]}.\n- Diện tích ${size}m², sạch sẽ, an ninh.\n- Gần chợ, trường học, bến xe buýt.\nLiên hệ để xem phòng.`,
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
      // rải thời gian đăng để sort "mới nhất" có ý nghĩa
      createdAt: new Date(Date.now() - index * 3 * 60 * 60 * 1000),
    };
  });
  await listingModel.insertMany(listings);

  console.log(`Đã tạo ${authors.length} user, ${listings.length} tin đăng.`);
  console.log('Đăng nhập thử (AUTH_DEV_LOGIN=true): 0900000001');
  await app.close();
}

void seed();
