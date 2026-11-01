import type { ApiResponse, AuthResponse } from '@tro-oi/shared';

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
