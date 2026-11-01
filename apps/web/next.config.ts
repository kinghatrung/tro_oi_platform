import type { NextConfig } from 'next';

const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000');

const nextConfig: NextConfig = {
  // @tro-oi/shared là TS source (enum runtime) nên Next phải tự biên dịch
  transpilePackages: ['@tro-oi/shared'],
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol === 'https:' ? 'https' : 'http',
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: '/uploads/**',
      },
    ],
    // API dev chạy ở localhost — Next 16 mặc định chặn tối ưu ảnh từ IP nội bộ
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== 'production',
  },
};

export default nextConfig;
