import { jest } from '@jest/globals';
import { Types } from 'mongoose';

import { ListingService } from './listing.service.js';

const storage = {
  isStoredUrl: (url: string) => url.startsWith('https://api/uploads/'),
  remove: jest.fn(async () => 0),
};
const owner = { sub: 'u1', role: 'landlord' } as never;

const serviceWith = (doc: Record<string, unknown> | null = null) =>
  new ListingService(
    { findById: () => ({ exec: async () => doc }) } as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    storage as never,
  );

describe('Video tin đăng', () => {
  afterEach(() => storage.remove.mockClear());

  it('chỉ nhận video đã tải lên hệ thống', async () => {
    await expect(
      serviceWith().create(owner, {
        video: 'https://evil.example/a.mp4',
      } as never),
    ).rejects.toThrow('tải lên từ Trọ ơi');
  });

  it('gỡ / đổi video khi sửa tin → xoá file cũ', async () => {
    const doc = {
      author: { equals: () => true, toString: () => 'u1' },
      status: 'active',
      video: 'https://api/uploads/old.mp4',
      set(values: Record<string, unknown> | string, _value?: unknown) {
        if (typeof values === 'string') return;
        Object.assign(this, values);
      },
      save: async () => undefined,
      populate: async () => undefined,
    };
    const service = serviceWith(doc);
    // remove chạy ngay sau save; phần sau (thông báo, map response) lỗi vì mock thiếu → bỏ qua
    await service
      .update(owner, new Types.ObjectId().toString(), { video: '' } as never)
      .catch(() => null);
    expect(storage.remove).toHaveBeenCalledWith([
      'https://api/uploads/old.mp4',
    ]);
  });
});
