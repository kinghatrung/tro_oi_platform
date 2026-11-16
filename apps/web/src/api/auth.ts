import type { ApiResponse, AuthResponse, User } from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function verifyPhone(firebaseToken: string) {
  const res = (await axiosClient.post('/auth/verify-phone', {
    firebaseToken,
  })) as ApiResponse<AuthResponse>;
  return res.data;
}

export async function devLogin(phone: string) {
  const res = (await axiosClient.post('/auth/dev-login', { phone })) as ApiResponse<AuthResponse>;
  return res.data;
}

/** Đăng nhập Google / Facebook: Firebase ID token sau signInWithPopup. */
export async function socialLogin(firebaseToken: string) {
  const res = (await axiosClient.post('/auth/social', {
    firebaseToken,
  })) as ApiResponse<AuthResponse>;
  return res.data;
}

/** Gắn Google / Facebook vào tài khoản đang đăng nhập (ID token sau signInWithPopup). */
export async function linkSocial(firebaseToken: string) {
  const res = (await axiosClient.post('/auth/link/social', { firebaseToken })) as ApiResponse<User>;
  return res.data;
}

/** Huỷ liên kết Google / Facebook (API chỉ cho khi tài khoản đã có SĐT). */
export async function unlinkSocial() {
  const res = (await axiosClient.delete('/auth/link/social')) as ApiResponse<User>;
  return res.data;
}

/** Gắn SĐT đã xác minh OTP (ID token Firebase Phone Auth). */
export async function linkPhone(firebaseToken: string) {
  const res = (await axiosClient.post('/auth/link/phone', { firebaseToken })) as ApiResponse<User>;
  return res.data;
}
