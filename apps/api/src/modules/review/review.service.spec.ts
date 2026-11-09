import { jest } from '@jest/globals';
import { Types } from 'mongoose';

import { ReviewService } from './review.service.js';

const alice = new Types.ObjectId().toString();
const bob = new Types.ObjectId().toString();
const execOf = (value: unknown) => ({ exec: async () => value });

/** talked: 2 người đã nhắn tin chưa; review: bản ghi findById trả về. */
const setup = ({ talked = false, review = null as unknown } = {}) => {
  const audit = { log: jest.fn(async () => undefined) };
  const service = new ReviewService(
    { findById: () => execOf(review) } as never,
    { exists: () => execOf(talked ? { _id: 1 } : null) } as never,
    { exists: () => execOf({ _id: 1 }) } as never,
    { notify: jest.fn() } as never,
    audit as never,
  );
  return { service, audit };
};

describe('ReviewService', () => {
  it('không tự đánh giá mình', async () => {
    const { service } = setup({ talked: true });
    await expect(service.canReview(alice, alice)).resolves.toBe(false);
  });

  it('chưa từng nhắn tin → không được đánh giá (403)', async () => {
    const { service } = setup({ talked: false });
    await expect(
      service.upsert(alice, { userId: bob, rating: 5 }),
    ).rejects.toThrow('Chỉ người đã trao đổi tin nhắn');
  });

  it('đã nhắn tin → được đánh giá', async () => {
    const { service } = setup({ talked: true });
    await expect(service.canReview(alice, bob)).resolves.toBe(true);
  });

  it('xoá: người ngoài 403; admin xoá → ghi nhật ký', async () => {
    const review = {
      reviewer: new Types.ObjectId(alice),
      target: new Types.ObjectId(bob),
      rating: 1,
      deleteOne: jest.fn(async () => undefined),
    };
    const id = new Types.ObjectId().toString();

    const outsider = setup({ review });
    await expect(
      outsider.service.remove({ sub: bob, phone: '', role: 'renter' }, id),
    ).rejects.toThrow('không có quyền');

    const admin = setup({ review });
    await admin.service.remove(
      { sub: new Types.ObjectId().toString(), phone: '', role: 'admin' },
      id,
    );
    expect(review.deleteOne).toHaveBeenCalled();
    expect(admin.audit.log).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ targetType: 'review', targetId: bob }),
    );
  });
});
