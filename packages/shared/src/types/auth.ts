import type { User } from './user';

/** Body POST /auth/verify-phone — ID token Firebase sau khi xác minh OTP. */
export interface VerifyPhoneRequest {
  firebaseToken: string;
}

/** Body POST /auth/dev-login — chỉ dùng khi server bật AUTH_DEV_LOGIN. */
export interface DevLoginRequest {
  phone: string;
}

export interface AuthResponse {
  accessToken: string;
  /** true khi SĐT đăng nhập lần đầu (vừa tạo tài khoản). */
  isNewUser?: boolean;
  user: User;
}

export interface JwtPayload {
  /** User id. */
  sub: string;
  phone: string;
  role: string;
}
