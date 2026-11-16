import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Cần cho thông báo đẩy (Firebase Cloud Messaging)
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

/** App Firebase dùng chung (Auth, Messaging), hoặc null khi chưa cấu hình env. */
export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseConfig.apiKey) return null;
  return getApps()[0] ?? initializeApp(firebaseConfig);
}

/** Firebase Auth client, hoặc null khi chưa cấu hình env (dùng dev-login). */
export function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  if (!app) return null;
  const auth = getAuth(app);
  auth.languageCode = 'vi';
  return auth;
}

export const PHONE_PATTERN = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
export const toE164 = (phone: string) => phone.replace(/^0/, '+84');

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-verification-code': 'Mã OTP không đúng',
  'auth/code-expired': 'Mã OTP đã hết hạn, vui lòng gửi lại',
  'auth/too-many-requests': 'Bạn thử quá nhiều lần, vui lòng đợi ít phút',
  'auth/invalid-phone-number': 'Số điện thoại không hợp lệ',
  'auth/popup-blocked':
    'Trình duyệt đã chặn cửa sổ đăng nhập — hãy cho phép cửa sổ bật lên rồi thử lại',
  'auth/account-exists-with-different-credential':
    'Email này đã đăng nhập bằng cách khác (Google hoặc Facebook) — hãy dùng lại cách đó',
  // Firebase trả mã này cả khi chưa bật nhà cung cấp lẫn khi vùng SMS (Việt Nam) chưa được cho phép
  'auth/operation-not-allowed':
    'Cách đăng nhập này chưa được bật, hoặc chưa cho phép gửi SMS tới Việt Nam — liên hệ quản trị viên',
  'auth/billing-not-enabled':
    'Hệ thống chưa bật gửi SMS thật (cần gói trả phí Firebase) — liên hệ quản trị viên',
  'auth/quota-exceeded': 'Đã hết hạn mức gửi SMS hôm nay, vui lòng thử lại sau',
  'auth/unauthorized-domain': 'Tên miền này chưa được cho phép đăng nhập, liên hệ quản trị viên',
};

/** Người dùng tự đóng cửa sổ đăng nhập Google / Facebook — không báo lỗi. */
export const isPopupCancelled = (error: unknown) =>
  ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'].includes(
    (error as { code?: string }).code ?? '',
  );

/** Lỗi Firebase / API → câu tiếng Việt. */
export const firebaseErrorMessage = (error: unknown, fallback = 'Đăng nhập thất bại') => {
  const code = (error as { code?: string }).code;
  return (code && FIREBASE_ERRORS[code]) || (error as Error).message || fallback;
};
