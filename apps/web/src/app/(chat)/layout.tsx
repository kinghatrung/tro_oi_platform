import SubHeader from '@/components/layout/SubHeader';

// Trang riêng từng người dùng (đã chặn đăng nhập ở src/proxy.ts): không prerender lúc build
export const dynamic = 'force-dynamic';

/** Layout chat: chỉ có header, phần còn lại lấp đầy màn hình, không cuộn trang (chỉ cuộn bên trong khung chat). */
export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <SubHeader />
      <main className="min-h-0 flex-1 border-t border-line bg-surface">{children}</main>
    </div>
  );
}
