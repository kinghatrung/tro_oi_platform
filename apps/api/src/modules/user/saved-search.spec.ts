import { jest } from '@jest/globals';
import { Types } from 'mongoose';

import { UserService } from './user.service.js';

/** User giả chỉ có savedSearches + save(). */
const serviceWith = (count: number) => {
  const user = {
    savedSearches: Array.from({ length: count }, (_, index) => ({
      _id: new Types.ObjectId(),
      query: `page-${index}`,
      title: `Tìm ${index}`,
      createdAt: new Date(),
    })),
    save: jest.fn(async () => undefined),
  };
  // push của mảng Mongoose tự gán _id/createdAt — mảng thường thì tự thêm
  const push = user.savedSearches.push.bind(user.savedSearches);
  user.savedSearches.push = (...items) =>
    push(
      ...items.map((item) => ({
        ...item,
        _id: new Types.ObjectId(),
        createdAt: new Date(),
      })),
    );
  const model = { findById: () => ({ exec: async () => user }) };
  const service = new UserService(model as never, {} as never, {} as never);
  return { service, user };
};
const userId = new Types.ObjectId().toString();

describe('Tìm kiếm đã lưu', () => {
  it('lưu trùng query → trả bản cũ, không thêm', async () => {
    const { service, user } = serviceWith(2);
    const result = await service.addSavedSearch(userId, {
      query: 'page-1',
      title: 'khác',
    });
    expect(result.title).toBe('Tìm 1');
    expect(user.savedSearches).toHaveLength(2);
    expect(user.save).not.toHaveBeenCalled();
  });

  it('thêm mới → lưu, trả id', async () => {
    const { service, user } = serviceWith(0);
    const result = await service.addSavedSearch(userId, {
      query: 'city=Hà+Nội',
      title: 'Hà Nội',
    });
    expect(result.query).toBe('city=Hà+Nội');
    expect(result.id).toMatch(/^[a-f0-9]{24}$/);
    expect(user.save).toHaveBeenCalled();
  });

  it('đủ 20 tìm kiếm → báo lỗi', async () => {
    const { service } = serviceWith(20);
    await expect(
      service.addSavedSearch(userId, { query: 'new', title: 'Mới' }),
    ).rejects.toThrow('tối đa 20');
  });
});
