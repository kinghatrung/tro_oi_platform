import type { Listing } from '@tro-oi/shared';

const KEY = 'viewedListings';
const MAX_ITEMS = 15;

// shortcut: lưu bản chụp tin trong localStorage của trình duyệt (không đồng bộ giữa thiết bị,
// giá/trạng thái có thể cũ) — cần đồng bộ theo tài khoản thì chuyển sang API
/** Tin đã xem, mới xem trước. Storage lỗi/bị chặn → []. */
export function readViewHistory(): Listing[] {
  try {
    const items: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(items) ? (items as Listing[]) : [];
  } catch {
    return [];
  }
}

/** Đưa tin lên đầu lịch sử (bỏ bản cũ của chính tin đó), giữ tối đa MAX_ITEMS. */
export function recordView(listing: Listing) {
  try {
    const rest = readViewHistory().filter((item) => item.id !== listing.id);
    localStorage.setItem(KEY, JSON.stringify([listing, ...rest].slice(0, MAX_ITEMS)));
  } catch {
    // Trình duyệt chặn storage / hết dung lượng: bỏ qua, lịch sử chỉ là tiện ích
  }
}
