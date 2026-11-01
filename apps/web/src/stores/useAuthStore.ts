import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { create } from 'zustand';
import type { AuthResponse, Listing, User } from '@tro-oi/shared';

import { clearAccessToken, getAccessToken, setAccessToken } from '@/api/axiosClient';
import { addFavorite, getFavorites, getMe, removeFavorite } from '@/api/users';

type SessionStatus = 'idle' | 'loading' | 'ready';

interface AuthState {
  user: User | null;
  /** Tin đã lưu, mới lưu trước. */
  favorites: Listing[];
  status: SessionStatus;
  /** Đọc token từ cookie và tải user + favorites. Gọi nhiều lần chỉ chạy 1 lần. */
  loadSession: () => Promise<void>;
  login: (auth: AuthResponse) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  /** Lưu/bỏ lưu tin (optimistic). Ném lỗi để caller hiển thị toast. */
  toggleFavorite: (listing: Listing) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  favorites: [],
  status: 'idle',

  loadSession: async () => {
    if (get().status !== 'idle') return;
    if (!getAccessToken()) {
      set({ status: 'ready' });
      return;
    }

    set({ status: 'loading' });
    try {
      const [user, favorites] = await Promise.all([getMe(), getFavorites()]);
      set({ user, favorites, status: 'ready' });
    } catch {
      // Token hết hạn/không hợp lệ → coi như chưa đăng nhập
      clearAccessToken();
      set({ user: null, favorites: [], status: 'ready' });
    }
  },

  login: async ({ accessToken, user }) => {
    setAccessToken(accessToken);
    set({ user, status: 'loading' });
    set({ favorites: await getFavorites(), status: 'ready' });
  },

  logout: () => {
    clearAccessToken();
    set({ user: null, favorites: [], status: 'ready' });
  },

  setUser: (user) => set({ user }),

  toggleFavorite: async (listing) => {
    const previous = get().favorites;
    const isFavorite = previous.some((item) => item.id === listing.id);
    set({
      favorites: isFavorite
        ? previous.filter((item) => item.id !== listing.id)
        : [listing, ...previous],
    });

    try {
      await (isFavorite ? removeFavorite(listing.id) : addFavorite(listing.id));
    } catch (error) {
      set({ favorites: previous });
      throw error;
    }
  },
}));

/**
 * Dùng ở trang cần đăng nhập: proxy.ts đã chặn khi thiếu cookie,
 * hook này xử lý trường hợp cookie còn nhưng token hết hạn. Trả về user (null khi đang tải).
 */
export function useRequireUser() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    void useAuthStore.getState().loadSession();
  }, []);

  useEffect(() => {
    if (status === 'ready' && !user) {
      router.replace(`/dang-nhap?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, status, user]);

  return user;
}
