import type { NextConfig } from 'next';

/** Nơi phục vụ ảnh upload: API (ổ đĩa) và — khi API lưu ảnh lên S3 — domain công khai của bucket. */
const uploadHosts = [
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000',
  process.env.NEXT_PUBLIC_UPLOAD_URL, // = S3_PUBLIC_URL bên API
]
  .filter((value): value is string => Boolean(value))
  .map((value) => new URL(value));

const nextConfig: NextConfig = {
  // @tro-oi/shared là TS source (enum runtime) nên Next phải tự biên dịch
  transpilePackages: ['@tro-oi/shared'],
  images: {
    remotePatterns: uploadHosts.map((url) => ({
      protocol: url.protocol === 'https:' ? ('https' as const) : ('http' as const),
      hostname: url.hostname,
      port: url.port,
      pathname: `${url.pathname.replace(/\/$/, '')}/uploads/**`,
    })),
    // API dev chạy ở localhost — Next 16 mặc định chặn tối ưu ảnh từ IP nội bộ
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
};

export default nextConfig;
