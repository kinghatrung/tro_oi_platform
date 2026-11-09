import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tin đã lưu' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
