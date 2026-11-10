import axiosClient, { getAccessToken } from '@/api/axiosClient';

/** Token FCM của trình duyệt này (để gỡ khi tắt / đăng xuất). Không import Firebase → nhẹ cho bundle chung. */
const TOKEN_KEY = 'push-token';

export const pushTokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (value: string | null) => {
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Chế độ ẩn danh / chặn lưu trữ: token vẫn ở tài khoản, chỉ không gỡ tự động khi đăng xuất
    }
  },
};

/**
 * Đăng xuất: gỡ token khỏi tài khoản để người dùng sau trên máy này không nhận thông báo của
 * tài khoản cũ. Gọi TRƯỚC khi xoá access token; keepalive vì trang chuyển hướng ngay sau đó.
 */
export function forgetPushToken() {
  const token = pushTokenStorage.get();
  const accessToken = getAccessToken();
  pushTokenStorage.set(null);
  if (!token || !accessToken) return;
  void fetch(`${axiosClient.defaults.baseURL}/notifications/push-tokens`, {
    method: 'DELETE',
    keepalive: true,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ token }),
  }).catch(() => undefined);
}
