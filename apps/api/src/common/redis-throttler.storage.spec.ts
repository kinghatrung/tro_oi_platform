import { RedisThrottlerStorage } from './redis-throttler.storage.js';

/** Redis giả đủ cho INCR / PEXPIRE NX / PTTL / SET PX (thời gian đứng yên). */
const fakeRedis = () => {
  const values = new Map<string, number>();
  const expiries = new Map<string, number>();
  const pttl = (key: string) =>
    values.has(key) ? (expiries.get(key) ?? -1) : -2;
  return {
    multi() {
      const ops: (() => unknown)[] = [];
      const chain = {
        incr(key: string) {
          ops.push(() => {
            values.set(key, (values.get(key) ?? 0) + 1);
            return values.get(key);
          });
          return chain;
        },
        pexpire(key: string, ms: number) {
          ops.push(() => (expiries.has(key) ? 0 : (expiries.set(key, ms), 1)));
          return chain;
        },
        pttl(key: string) {
          ops.push(() => pttl(key));
          return chain;
        },
        exec: async () => ops.map((op) => [null, op()]),
      };
      return chain;
    },
    async set(key: string, _value: string, _px: string, ms: number) {
      values.set(key, 1);
      expiries.set(key, ms);
      return 'OK';
    },
  };
};

describe('RedisThrottlerStorage', () => {
  it('đếm theo cửa sổ; vượt limit → khoá blockDuration', async () => {
    const storage = new RedisThrottlerStorage(fakeRedis() as never);
    const hit = () => storage.increment('ip', 60_000, 2, 30_000, 'default');
    expect(await hit()).toMatchObject({ totalHits: 1, isBlocked: false });
    expect(await hit()).toMatchObject({
      totalHits: 2,
      isBlocked: false,
      timeToExpire: 60,
    });
    expect(await hit()).toMatchObject({
      totalHits: 3,
      isBlocked: true,
      timeToBlockExpire: 30,
    });
  });

  it('Redis lỗi → cho qua, không chặn người dùng', async () => {
    const broken = {
      multi: () => ({
        incr() {
          return this;
        },
        pexpire() {
          return this;
        },
        pttl() {
          return this;
        },
        exec: async () => {
          throw new Error('ECONNREFUSED');
        },
      }),
    };
    const storage = new RedisThrottlerStorage(broken as never);
    await expect(
      storage.increment('ip', 60_000, 1, 60_000, 'default'),
    ).resolves.toMatchObject({ isBlocked: false });
  });
});
