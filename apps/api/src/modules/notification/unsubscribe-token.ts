import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Token trong link "huỷ nhận email" (không cần đăng nhập): `<userId>.<HMAC>`.
 * Không hết hạn — email cũ vẫn huỷ được; chỉ tắt được email của đúng tài khoản đó.
 */
const signature = (userId: string, secret: string) =>
  createHmac('sha256', secret)
    .update(`unsubscribe:${userId}`)
    .digest('base64url');

export const signUnsubscribeToken = (userId: string, secret: string) =>
  `${userId}.${signature(userId, secret)}`;

/** Token hợp lệ → userId; sai / sửa đổi → null. */
export function verifyUnsubscribeToken(token: string, secret: string) {
  const [userId, given] = token.split('.');
  if (!userId || !given || !/^[a-f0-9]{24}$/.test(userId)) return null;
  const expected = Buffer.from(signature(userId, secret));
  const actual = Buffer.from(given);
  return actual.length === expected.length && timingSafeEqual(actual, expected)
    ? userId
    : null;
}
