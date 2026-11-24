import { Logger } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';
import type { Redis } from 'ioredis';

/**
 * Bộ đếm rate limit dùng chung qua Redis (có REDIS_URL) — nhiều instance API cùng 1 giới hạn / IP.
 * Cửa sổ cố định: INCR + PEXPIRE NX; vượt `limit` → khoá thêm `blockDuration`.
 * Redis lỗi → cho qua (không chặn người dùng vì hạ tầng phụ), chỉ ghi log.
 */
export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);

  constructor(private readonly redis: Redis) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): ReturnType<ThrottlerStorage['increment']> {
    const hitKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `${hitKey}:block`;
    try {
      const results = await this.redis
        .multi()
        .incr(hitKey)
        .pexpire(hitKey, ttl, 'NX')
        .pttl(hitKey)
        .pttl(blockKey)
        .exec();
      const [totalHits, , hitTtl, blockTtl] = (results ?? []).map(
        ([error, value]) => {
          if (error) throw error;
          return Number(value);
        },
      );
      let blockMs = blockTtl > 0 ? blockTtl : 0;
      if (blockMs === 0 && totalHits > limit) {
        await this.redis.set(blockKey, '1', 'PX', blockDuration);
        blockMs = blockDuration;
      }
      return {
        totalHits,
        timeToExpire: Math.ceil(Math.max(hitTtl, 0) / 1000),
        isBlocked: blockMs > 0,
        timeToBlockExpire: Math.ceil(blockMs / 1000),
      };
    } catch (error) {
      this.logger.warn(
        `Redis rate limit lỗi, tạm bỏ qua: ${(error as Error).message}`,
      );
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
