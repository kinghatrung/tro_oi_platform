import type { Listing, ProductItem } from '@tro-oi/shared';

const LISTINGS_KEY = 'viewedListings';
const PRODUCTS_KEY = 'viewedProducts';
const MAX_ITEMS = 15;

// Bản chụp tin/món đồ trong localStorage cho khách chưa đăng nhập (đã đăng nhập: lịch sử lấy từ tài
// khoản, xem useViewHistory). shortcut: lịch sử xem trước khi đăng nhập không gộp lên tài khoản.
/** Đã xem, mới xem trước. Storage lỗi/bị chặn → []. */
function readHistory<T>(key: string): T[] {
  try {
    const items: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(items) ? (items as T[]) : [];
  } catch {
    return [];
  }
}

/** Ghi lịch sử; storage lỗi / bị chặn → bỏ qua (lịch sử chỉ là tiện ích). */
function writeHistory(key: string, items: unknown[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Trình duyệt chặn storage / hết dung lượng
  }
}

/** Đưa lên đầu lịch sử (bỏ bản cũ của chính nó), giữ tối đa `max` mục. */
function recordHistory<T extends { id: string }>(key: string, item: T, max = MAX_ITEMS) {
  const rest = readHistory<T>(key).filter((entry) => entry.id !== item.id);
  writeHistory(key, [item, ...rest].slice(0, max));
}

/** Tin Trọ ơi đã xem. */
export const readViewHistory = () => readHistory<Listing>(LISTINGS_KEY);
export const recordView = (listing: Listing) => recordHistory(LISTINGS_KEY, listing);

/** Món đồ Chợ ơi đã xem. */
export const readProductHistory = () => readHistory<ProductItem>(PRODUCTS_KEY);
export const recordProductView = (product: ProductItem) => recordHistory(PRODUCTS_KEY, product);

/** Từ khoá tìm kiếm gần nhất, riêng theo trang nhận kết quả (Trọ ơi /tim-kiem, Chợ ơi /cho-oi). */
const RECENT_SEARCH_MAX = 3;
const searchKey = (basePath: string) => `recentSearches:${basePath}`;
interface RecentSearch {
  /** Chữ thường để không lưu trùng "Cầu Giấy" / "cầu giấy". */
  id: string;
  keyword: string;
}

export const readRecentSearches = (basePath: string) =>
  readHistory<RecentSearch>(searchKey(basePath))
    .slice(0, RECENT_SEARCH_MAX)
    .map((entry) => entry.keyword);

export const recordSearch = (basePath: string, keyword: string) =>
  recordHistory(searchKey(basePath), { id: keyword.toLowerCase(), keyword }, RECENT_SEARCH_MAX);

export const removeRecentSearch = (basePath: string, keyword: string) =>
  writeHistory(
    searchKey(basePath),
    readHistory<RecentSearch>(searchKey(basePath)).filter(
      (entry) => entry.id !== keyword.toLowerCase(),
    ),
  );
