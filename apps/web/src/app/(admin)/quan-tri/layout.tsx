import type { Metadata } from 'next';

import { AdminShell } from './AdminShell';

// Dữ liệu quản trị luôn mới nhất, không prerender
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Quản trị',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
