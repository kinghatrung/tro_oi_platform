// Trang riêng của từng người dùng (đã chặn đăng nhập ở src/proxy.ts): không prerender lúc build
export const dynamic = 'force-dynamic';

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
