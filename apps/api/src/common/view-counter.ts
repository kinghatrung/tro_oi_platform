import { createHash } from 'node:crypto';

/** User-Agent của bot / trình xem trước link → không tính lượt xem. */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|curl|wget|python|axios|node-fetch/i;
/** Cùng người xem 1 tin trong khoảng này chỉ tính 1 lượt. */
export const VIEW_WINDOW_MS = 30 * 60 * 1000;
const MAX_ENTRIES = 50_000;

/**
 * Chống đếm trùng lượt xem (F5, mở nhiều tab, bot). Người xem = hash(IP + User-Agent), không lưu IP gốc.
 * shortcut: nhớ trong bộ nhớ từng instance — chạy nhiều instance API thì 1 người có thể được tính
 * thêm 1 lượt / instance; cần chính xác hơn thì chuyển sang Redis (SET key NX PX).
 */
export class ViewCounter {
  private readonly seen = new Map<string, number>();

  constructor(private readonly windowMs = VIEW_WINDOW_MS) {}

  /** true = lượt xem mới cần cộng; false = bot hoặc đã tính gần đây. */
  shouldCount(
    targetId: string,
    ip: string | undefined,
    userAgent: string | undefined,
    now = Date.now(),
  ) {
    if (!userAgent || BOT_PATTERN.test(userAgent)) return false;
    const viewer = createHash('sha256')
      .update(`${ip ?? ''}|${userAgent}`)
      .digest('base64url')
      .slice(0, 16);
    const key = `${targetId}:${viewer}`;
    const last = this.seen.get(key);
    if (last !== undefined && now - last < this.windowMs) return false;
    this.seen.set(key, now);
    if (this.seen.size > MAX_ENTRIES) this.prune(now);
    return true;
  }

  /** Bỏ mục hết hạn; vẫn quá nhiều (bị dội) → bỏ nửa cũ nhất (Map giữ thứ tự thêm vào). */
  private prune(now: number) {
    for (const [key, time] of this.seen) {
      if (now - time >= this.windowMs) this.seen.delete(key);
    }
    if (this.seen.size > MAX_ENTRIES) {
      const drop = this.seen.size - MAX_ENTRIES / 2;
      let index = 0;
      for (const key of this.seen.keys()) {
        if (index++ >= drop) break;
        this.seen.delete(key);
      }
    }
  }
}
