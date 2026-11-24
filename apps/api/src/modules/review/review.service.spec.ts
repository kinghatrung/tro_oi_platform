import { jest } from '@jest/globals';
import { Types } from 'mongoose';

import { ReviewService } from './review.service.js';

const alice = new Types.ObjectId().toString();
const bob = new Types.ObjectId().toString();
const execOf = (value: unknown) => ({ exec: async () => value });

/**
 * talked: 2 người đã nhắn tin chưa; review: bản ghi findById trả về;
 * requireApproval: thiết lập requireReviewApproval; saved: ghi lại $set của findOneAndUpdate.
 */
const setup = ({
  talked = false,
  review = null as unknown,
  requireApproval = false,
} = {}) => {
  const audit = { log: jest.fn(async () => undefined) };
  const notify = jest.fn(async () => undefined);
  const saved: Record<string, unknown>[] = [];
  const populated = (value: unknown) => ({
    populate: () => populated(value),
    exec: async () => value,
  });
  const reviewModel = {
    findById: () => populated(review),
    exists: () => execOf(null),
    findOneAndUpdate: (_filter: unknown, update: { $set: object }) => {
      saved.push(update.$set);
      return populated({
        id: 'r1',
        target: new Types.ObjectId(bob),
        reviewer: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...update.$set,
      });
    },
  };
  const service = new ReviewService(
    reviewModel as never,
    { exists: () => execOf(talked ? { _id: 1 } : null) } as never,
    { exists: () => execOf({ _id: 1 }) } as never,
    { notify } as never,
    audit as never,
    { get: async () => ({ requireReviewApproval: requireApproval }) } as never,
  );
  return { service, audit, notify, saved };
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

  it('bật duyệt đánh giá: lưu chờ duyệt, chưa báo người được đánh giá', async () => {
    const off = setup({ talked: true });
    await off.service.upsert(alice, { userId: bob, rating: 4 });
    expect(off.saved[0]).toMatchObject({ status: 'approved' });
    expect(off.notify).toHaveBeenCalled();

    const on = setup({ talked: true, requireApproval: true });
    const review = await on.service.upsert(alice, { userId: bob, rating: 4 });
    expect(review.status).toBe('pending');
    expect(on.notify).not.toHaveBeenCalled();
  });

  it('admin duyệt → hiện công khai, báo người được đánh giá, ghi nhật ký', async () => {
    const review = {
      id: 'r1',
      status: 'pending',
      rating: 5,
      reviewer: null,
      target: new Types.ObjectId(bob),
      createdAt: new Date(),
      updatedAt: new Date(),
      save: jest.fn(async () => undefined),
    };
    const { service, notify, audit } = setup({ review });
    const result = await service.approve(
      alice,
      new Types.ObjectId().toString(),
    );
    expect(result.status).toBe('approved');
    expect(review.save).toHaveBeenCalled();
    expect(notify).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalled();
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
