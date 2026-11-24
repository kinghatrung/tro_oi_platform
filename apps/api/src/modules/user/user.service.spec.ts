import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';

import { User } from '../auth/schemas/user.schema.js';
import { Listing } from '../listing/schemas/listing.schema.js';
import { Product } from '../product/schemas/product.schema.js';
import { MAX_VIEWED, UserService } from './user.service.js';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: {} },
        { provide: getModelToken(Listing.name), useValue: {} },
        { provide: getModelToken(Product.name), useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('ghi lịch sử xem: đưa lên đầu, giữ tối đa MAX_VIEWED; tin không tồn tại → 404', async () => {
    const updates: unknown[] = [];
    const listingId = new Types.ObjectId().toString();
    const viewed = new UserService(
      {
        updateOne: (_filter: unknown, update: unknown) => {
          updates.push(update);
          return { exec: async () => undefined };
        },
      } as never,
      { exists: async () => ({ _id: listingId }) } as never,
      {} as never,
    );
    await viewed.recordViewedListing('u1', listingId);
    expect(updates[0]).toEqual({
      $pull: { viewedListingIds: new Types.ObjectId(listingId) },
    });
    expect(updates[1]).toMatchObject({
      $push: { viewedListingIds: { $position: 0, $slice: MAX_VIEWED } },
    });

    await expect(service.recordViewedListing('u1', 'abc')).rejects.toThrow(
      'Không tìm thấy tin đăng',
    );
  });

  it('id không phải ObjectId → 404, không chạm DB', async () => {
    await expect(service.getPublic('abc')).rejects.toThrow(
      'Không tìm thấy người dùng',
    );
  });
});
