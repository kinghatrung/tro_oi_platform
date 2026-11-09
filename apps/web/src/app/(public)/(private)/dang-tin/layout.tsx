import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Đăng tin' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
