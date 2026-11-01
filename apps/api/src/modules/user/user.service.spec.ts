import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../auth/schemas/user.schema.js';
import { Listing } from '../listing/schemas/listing.schema.js';
import { UserService } from './user.service.js';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getModelToken(User.name), useValue: {} },
        { provide: getModelToken(Listing.name), useValue: {} },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('id không phải ObjectId → 404, không chạm DB', async () => {
    await expect(service.getPublic('abc')).rejects.toThrow(
      'Không tìm thấy người dùng',
    );
  });
});
