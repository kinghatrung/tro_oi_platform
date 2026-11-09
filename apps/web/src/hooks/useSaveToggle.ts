import { useCallback, type MouseEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { App } from 'antd';

import { useAuthStore } from '@/stores/useAuthStore';

/**
 * Handler cho nút Lưu (tin Trọ ơi, món đồ Chợ ơi): chưa đăng nhập → /dang-nhap,
 * lỗi API → toast. Chặn click lan lên thẻ <Link> bao ngoài.
 */
export function useSaveToggle(toggle: () => Promise<void>) {
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const isLoggedIn = useAuthStore((state) => Boolean(state.user));

  return useCallback(
    async (event?: MouseEvent) => {
      event?.preventDefault();
      event?.stopPropagation();
      if (!isLoggedIn) {
        router.push(`/dang-nhap?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      try {
        await toggle();
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [isLoggedIn, message, pathname, router, toggle],
  );
}
