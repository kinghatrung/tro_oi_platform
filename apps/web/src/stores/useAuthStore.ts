import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { create } from 'zustand';
import type { AuthResponse, Listing, ProductItem, SavedSearch, User } from '@tro-oi/shared';

import { clearAccessToken, getAccessToken, setAccessToken } from '@/api/axiosClient';
import {
  addFavorite,
  addFavoriteProduct,
  createSavedSearch,
  deleteSavedSearch,
  getFavoriteProducts,
  getFavorites,
  getMe,
  getSavedSearches,
  removeFavorite,
  removeFavoriteProduct,
} from '@/api/users';
import { forgetPushToken } from '@/lib/pushToken';

type SessionStatus = 'idle' | 'loading' | 'ready';

interface AuthState {
  user: User | null;
  /** Tin đã lưu, mới lưu trước. */
  favorites: Listing[];
  /** Món đồ Chợ ơi đã lưu, mới lưu trước. */
  favoriteProducts: ProductItem[];
  /** Tìm kiếm đã lưu, mới lưu trước. */
  savedSearches: SavedSearch[];
  status: SessionStatus;
  /** Đọc token từ cookie và tải user + favorites. Gọi nhiều lần chỉ chạy 1 lần. */
  loadSession: () => Promise<void>;
  login: (auth: AuthResponse) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  /** Lưu/bỏ lưu tin (optimistic). Ném lỗi để caller hiển thị toast. */
  toggleFavorite: (listing: Listing) => Promise<void>;
  toggleFavoriteProduct: (product: ProductItem) => Promise<void>;
  /** Lưu (chờ API trả id) / bỏ lưu (optimistic) tìm kiếm theo query. */
  toggleSavedSearch: (query: string, title: string) => Promise<void>;
}

const EMPTY_SESSION = { favorites: [], favoriteProducts: [], savedSearches: [] };

/** Dữ liệu cá nhân tải kèm phiên đăng nhập. */
const loadUserData = async () => {
  const [favorites, favoriteProducts, savedSearches] = await Promise.all([
    getFavorites(),
    getFavoriteProducts(),
    getSavedSearches(),
  ]);
  return { favorites, favoriteProducts, savedSearches };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  favorites: [],
  favoriteProducts: [],
  savedSearches: [],
  status: 'idle',

  loadSession: async () => {
    if (get().status !== 'idle') return;
    if (!getAccessToken()) {
      set({ status: 'ready' });
      return;
    }

    set({ status: 'loading' });
    try {
      const [user, data] = await Promise.all([getMe(), loadUserData()]);
      set({ user, ...data, status: 'ready' });
    } catch {
      // Token hết hạn/không hợp lệ → coi như chưa đăng nhập
      clearAccessToken();
      set({ user: null, ...EMPTY_SESSION, status: 'ready' });
    }
  },

  login: async ({ accessToken, user }) => {
    setAccessToken(accessToken);
    set({ user, status: 'loading' });
    set({ ...(await loadUserData()), status: 'ready' });
  },

  logout: () => {
    forgetPushToken(); // cần access token → gọi trước khi xoá
    clearAccessToken();
    set({ user: null, ...EMPTY_SESSION, status: 'ready' });
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

  toggleFavoriteProduct: async (product) => {
    const previous = get().favoriteProducts;
    const isFavorite = previous.some((item) => item.id === product.id);
    set({
      favoriteProducts: isFavorite
        ? previous.filter((item) => item.id !== product.id)
        : [product, ...previous],
    });

    try {
      await (isFavorite ? removeFavoriteProduct(product.id) : addFavoriteProduct(product.id));
    } catch (error) {
      set({ favoriteProducts: previous });
      throw error;
    }
  },

  toggleSavedSearch: async (query, title) => {
    const previous = get().savedSearches;
    const existing = previous.find((item) => item.query === query);
    if (!existing) {
      const saved = await createSavedSearch({ query, title });
      set({
        savedSearches: [saved, ...get().savedSearches.filter((item) => item.id !== saved.id)],
      });
      return;
    }

    set({ savedSearches: previous.filter((item) => item.id !== existing.id) });
    try {
      await deleteSavedSearch(existing.id);
    } catch (error) {
      set({ savedSearches: previous });
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
