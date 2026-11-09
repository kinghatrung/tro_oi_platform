import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tin nhắn' };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
