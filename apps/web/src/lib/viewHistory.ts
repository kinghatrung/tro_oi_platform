import type { Listing, ProductItem } from '@tro-oi/shared';

const LISTINGS_KEY = 'viewedListings';
const PRODUCTS_KEY = 'viewedProducts';
const MAX_ITEMS = 15;

// shortcut: lưu bản chụp tin/món đồ trong localStorage của trình duyệt (không đồng bộ giữa thiết bị,
// giá/trạng thái có thể cũ) — cần đồng bộ theo tài khoản thì chuyển sang API
/** Đã xem, mới xem trước. Storage lỗi/bị chặn → []. */
function readHistory<T>(key: string): T[] {
  try {
    const items: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(items) ? (items as T[]) : [];
  } catch {
    return [];
  }
}

/** Đưa lên đầu lịch sử (bỏ bản cũ của chính nó), giữ tối đa MAX_ITEMS. */
function recordHistory<T extends { id: string }>(key: string, item: T) {
  try {
    const rest = readHistory<T>(key).filter((entry) => entry.id !== item.id);
    localStorage.setItem(key, JSON.stringify([item, ...rest].slice(0, MAX_ITEMS)));
  } catch {
    // Trình duyệt chặn storage / hết dung lượng: bỏ qua, lịch sử chỉ là tiện ích
  }
}

/** Tin Trọ ơi đã xem. */
export const readViewHistory = () => readHistory<Listing>(LISTINGS_KEY);
export const recordView = (listing: Listing) => recordHistory(LISTINGS_KEY, listing);

/** Món đồ Chợ ơi đã xem. */
export const readProductHistory = () => readHistory<ProductItem>(PRODUCTS_KEY);
export const recordProductView = (product: ProductItem) => recordHistory(PRODUCTS_KEY, product);
