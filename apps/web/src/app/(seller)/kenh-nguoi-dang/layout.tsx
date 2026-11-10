import type { Metadata } from 'next';

import { SellerShell } from './SellerShell';

// Trang riêng của người đăng (đã chặn đăng nhập ở src/proxy.ts): không prerender lúc build
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kênh người đăng',
  robots: { index: false, follow: false },
};

/** Kênh người đăng: khung toàn màn hình như trang quản trị. */
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
