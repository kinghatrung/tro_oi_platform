import type { TroiApiPort } from '../core/ports.js';

const TIMEOUT_MS = 10_000;

/**
 * Đọc API công khai Trọ ơi qua HTTP — cùng endpoint trình duyệt gọi, không có quyền gì thêm.
 * Response API: { code, message, data } → trả data; lỗi → Error(message tiếng Việt của API).
 */
export class TroiApi implements TroiApiPort {
  constructor(private readonly baseUrl: string) {}

  async get<T>(
    path: string,
    params: Record<string, string | number | string[] | undefined> = {},
    token?: string,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === '') continue;
      // API nhận mảng dạng "a,b" (vd amenities=wifi,parking)
      url.searchParams.set(
        key,
        Array.isArray(value) ? value.join(',') : String(value),
      );
    }
    const res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(token && { headers: { authorization: `Bearer ${token}` } }),
    });
    const body = (await res.json().catch(() => null)) as {
      message?: string;
      data?: T;
    } | null;
    if (!res.ok || !body) {
      throw new Error(body?.message ?? `API Trọ ơi lỗi ${res.status}`);
    }
    return body.data as T;
  }
}
