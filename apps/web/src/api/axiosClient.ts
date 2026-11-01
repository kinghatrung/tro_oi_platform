import axios, { AxiosError, type AxiosResponse } from 'axios';
import type { ApiResponse } from '@tro-oi/shared';

const TOKEN_COOKIE = 'accessToken';
const TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

/** Lỗi từ API; `status` = `code` của ApiResponse để caller phân biệt 404/401... */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

/** Token chỉ đọc được ở client (cookie không httpOnly). */
export function getAccessToken() {
  if (typeof document === 'undefined') return undefined;
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`))
    ?.slice(TOKEN_COOKIE.length + 1);
}

export function setAccessToken(token: string) {
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${TOKEN_MAX_AGE}; samesite=lax`;
}

export function clearAccessToken() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000',
  timeout: 15_000,
});

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Mọi response backend theo ApiResponse { code, message, data } (packages/shared/src/types/api.ts).
 * Thành công → trả nguyên body ApiResponse<T>; lỗi → ApiError(message, code).
 */
axiosClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const body = response.data;
    // Phòng backend trả HTTP 2xx nhưng code lỗi trong body
    if (body.code >= 400) return Promise.reject(new ApiError(body.message, body.code));
    return body as never;
  },
  (error: AxiosError<Partial<ApiResponse>>) => {
    const code = error.response?.data?.code ?? error.response?.status;
    if (code === 401 && typeof document !== 'undefined') clearAccessToken();

    const message =
      error.response?.data?.message ??
      (error.response ? 'Có lỗi xảy ra, vui lòng thử lại' : 'Không kết nối được máy chủ');
    return Promise.reject(new ApiError(message, code));
  },
);

export default axiosClient;
