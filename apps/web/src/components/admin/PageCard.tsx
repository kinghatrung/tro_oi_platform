import type { ReactNode } from 'react';

/** Khung trang danh sách quản trị: nền surface, cao đúng bằng Content của AdminShell (bảng bên trong tự cuộn). */
export function PageCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4 rounded-xl bg-surface p-4">{children}</div>
  );
}
