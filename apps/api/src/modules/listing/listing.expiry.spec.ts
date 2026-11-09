import { jest } from '@jest/globals';
import { Types } from 'mongoose';

import {
  LISTING_TTL_DAYS,
  ListingService,
  nextExpiry,
} from './listing.service.js';

const DAY = 24 * 60 * 60 * 1000;
const ownerId = new Types.ObjectId();

/** Doc giả: chỉ những gì update() dùng. */
const fakeDoc = (status: string) => {
  const doc = {
    status,
    author: ownerId,
    expiresAt: undefined as Date | undefined,
    set(values: Record<string, unknown>) {
      Object.assign(doc, values);
    },
    save: jest.fn(async () => doc),
    populate: jest.fn(async () => doc),
  };
  return doc;
};

const serviceWith = (doc: ReturnType<typeof fakeDoc>) => {
  const model = { findById: () => ({ exec: async () => doc }) };
  return new ListingService(
    model as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
};

describe('Hạn hiển thị tin', () => {
  it(`nextExpiry = +${LISTING_TTL_DAYS} ngày`, () => {
    expect(nextExpiry(0).getTime()).toBe(LISTING_TTL_DAYS * DAY);
  });

  it.each(['expired', 'closed', 'pending'])(
    '%s → active: đặt lại hạn mới',
    async (from) => {
      const doc = fakeDoc(from);
      await serviceWith(doc)
        .update(
          { sub: ownerId.toString(), role: 'admin' } as never,
          ownerId.toString(),
          { status: 'active' } as never,
        )
        .catch(() => undefined); // toListing lỗi trên doc giả — chỉ kiểm tra giá trị đã set
      expect(doc.status).toBe('active');
      expect(doc.expiresAt!.getTime()).toBeGreaterThan(
        Date.now() + (LISTING_TTL_DAYS - 1) * DAY,
      );
    },
  );

  it('active → active (sửa nội dung): giữ nguyên hạn cũ', async () => {
    const doc = fakeDoc('active');
    const old = new Date(Date.now() + DAY);
    doc.expiresAt = old;
    await serviceWith(doc)
      .update(
        { sub: ownerId.toString(), role: 'user' } as never,
        ownerId.toString(),
        { status: 'active' } as never,
      )
      .catch(() => undefined);
    expect(doc.expiresAt).toBe(old);
  });
});

describe('checkExpiry nhiều instance', () => {
  it('2 instance chạy cùng lúc: mỗi tin chỉ được báo 1 lần', async () => {
    const make = (n: number, prefix: string) =>
      Array.from({ length: n }, (_, index) => ({
        title: `${prefix}${index}`,
        author: ownerId,
        expiresAt: new Date(),
      }));
    // "DB" dùng chung: findOneAndUpdate lấy ra 1 tin (nguyên tử) theo loại cập nhật
    const pools: Record<string, ReturnType<typeof make>> = {
      expiryReminded: make(3, 'sắp-'),
      status: make(4, 'hết-'),
    };
    const model = {
      findOneAndUpdate: (_filter: unknown, update: { $set: object }) => {
        const key = Object.keys(update.$set)[0];
        const doc = pools[key].shift() ?? null;
        return {
          exec: () =>
            new Promise((resolve) => setTimeout(() => resolve(doc), 1)),
        };
      },
    };
    const notified: string[] = [];
    const notify = async (items: { input: { message: string } }[]) => {
      notified.push(...items.map((item) => item.input.message.split('"')[1]));
    };
    const instance = () =>
      new ListingService(
        model as never,
        {} as never,
        {} as never,
        {} as never,
        { notify } as never,
      );

    await Promise.all([instance().checkExpiry(), instance().checkExpiry()]);
    expect(notified.sort()).toEqual(
      ['sắp-0', 'sắp-1', 'sắp-2', 'hết-0', 'hết-1', 'hết-2', 'hết-3'].sort(),
    );
  });
});
