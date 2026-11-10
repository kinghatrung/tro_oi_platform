import { deleteToken, getMessaging, getToken, isSupported } from 'firebase/messaging';

import { addPushToken, removePushToken } from '@/api/notifications';

import { getFirebaseApp } from './firebase';
import { pushTokenStorage } from './pushToken';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
/** Service worker tự hiện thông báo từ dữ liệu FCM (public/push-sw.js). */
const SW_URL = '/push-sw.js';

/** Đã cấu hình FCM và trình duyệt hỗ trợ (Safari iOS: chỉ khi đã "Thêm vào màn hình chính"). */
export async function canUsePush() {
  if (!VAPID_KEY || !getFirebaseApp() || !('serviceWorker' in navigator)) return false;
  return isSupported().catch(() => false);
}

/** Trình duyệt này đang nhận thông báo đẩy. */
export const isPushOn = () =>
  typeof Notification !== 'undefined' &&
  Notification.permission === 'granted' &&
  Boolean(pushTokenStorage.get());

/** Xin quyền → đăng ký service worker → lấy token FCM → lưu vào tài khoản. Lỗi ném ra tiếng Việt. */
export async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error(
      'Trình duyệt đang chặn thông báo. Hãy cho phép thông báo cho trang này trong cài đặt trình duyệt rồi thử lại.',
    );
  }
  const registration = await navigator.serviceWorker.register(SW_URL);
  const token = await getToken(getMessaging(getFirebaseApp()!), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  await addPushToken(token);
  pushTokenStorage.set(token);
}

export async function disablePush() {
  const token = pushTokenStorage.get();
  if (token) await removePushToken(token);
  pushTokenStorage.set(null);
  await deleteToken(getMessaging(getFirebaseApp()!)).catch(() => undefined);
}
