import type { AssistantAction } from '@/api/assistant';

/** Ô từ khoá ở banner (trang chủ, Chợ ơi) và trang tìm kiếm — cùng aria-label. */
const SEARCH_INPUT = 'input[aria-label="Từ khoá tìm kiếm"]';
/** Ô tìm kiếm trên mỗi trang đưa tới trang kết quả nào (banner Chợ ơi tìm trong Chợ ơi). */
const SEARCH_TARGET: Record<string, string> = {
  '/': '/tim-kiem',
  '/tim-kiem': '/tim-kiem',
  '/cho-oi': '/cho-oi/tim-kiem',
  '/cho-oi/tim-kiem': '/cho-oi/tim-kiem',
};
const TYPE_DELAY_MS = 160;
const PAUSE_MS = 700;
const WAIT_MS = 8000;
/** Viền / nền nổi bật ô đang được gõ (globals.css). */
const TYPING_CLASS = 'assistant-typing';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Chờ tới khi `find` trả giá trị (trang mới render xong / URL đổi); quá hạn → null. */
async function waitFor<T>(find: () => T | null | undefined, timeout = WAIT_MS) {
  for (const end = Date.now() + timeout; Date.now() < end; await sleep(100)) {
    const found = find();
    if (found) return found;
  }
  return null;
}

const visibleSearchInput = () =>
  [...document.querySelectorAll<HTMLInputElement>(SEARCH_INPUT)].find(
    (element) => element.getClientRects().length > 0,
  );

/** Gõ như người dùng: đặt giá trị qua setter gốc + sự kiện input → onChange của React chạy. */
function typeValue(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Cùng trang và cùng bộ tham số (không phân biệt thứ tự). */
function isSameSearch(target: URL) {
  const sorted = (params: URLSearchParams) => {
    const copy = new URLSearchParams(params);
    copy.sort();
    return copy.toString();
  };
  return (
    location.pathname === target.pathname &&
    sorted(new URLSearchParams(location.search)) === sorted(target.searchParams)
  );
}

/** Chỉ đường dẫn nội bộ của web (chặn "//evil.com", "https://…" dù dịch vụ AI đã tự dựng path). */
export const isInternalPath = (path: string) => path.startsWith('/') && !path.startsWith('//');

/**
 * Agent tìm hộ như người thật, ở trang chủ / Chợ ơi dùng ô trên banner, ở trang tìm kiếm dùng ô
 * từ khoá (sai khu / không có ô → mở trang tìm kiếm trước):
 * 1. Bộ lọc không gõ được (loại hình, giá…) đặt sẵn lên URL trang hiện tại (replaceState, không tải
 *    lại) — ô tìm kiếm của trang mang theo khi nhấn Enter, nên Enter tới thẳng trang đích.
 * 2. Cuộn tới ô, xoá chữ cũ, gõ từng chữ, nhấn Enter — chính trang tự tìm.
 * Gõ là việc chính nên vẫn gõ khi máy bật giảm chuyển động (chỉ bỏ cuộn mượt).
 */
export async function playAssistantAction(
  action: AssistantAction,
  navigate: (path: string) => void,
  onStep: (text: string) => void,
) {
  if (!isInternalPath(action.path)) return;
  const target = new URL(action.path, location.origin);
  const query = action.query.trim();
  if (!query) {
    onStep('Đang mở trang kết quả…');
    navigate(action.path);
    return;
  }
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (SEARCH_TARGET[location.pathname] !== target.pathname || !visibleSearchInput()) {
    onStep('Đang mở trang tìm kiếm…');
    navigate(target.pathname);
    if (!(await waitFor(() => location.pathname === target.pathname && visibleSearchInput()))) {
      navigate(action.path);
      return;
    }
  }

  const filters = new URLSearchParams(target.searchParams);
  filters.delete('keyword');
  if (filters.size > 0) {
    onStep(`Chọn bộ lọc: ${action.label}`);
    // state null như docs Next: router coi là thay đổi từ ngoài → cập nhật useSearchParams
    // (truyền history.state cũ có cờ nội bộ của Next → router bỏ qua, ô tìm kiếm không thấy bộ lọc)
    window.history.replaceState(null, '', `${location.pathname}?${filters}`);
    await sleep(PAUSE_MS); // trang tìm kiếm dựng lại khung lọc theo URL mới
  }
  const input = await waitFor(visibleSearchInput);
  if (!input) {
    navigate(action.path);
    return;
  }

  // Luôn cuộn tới ô tìm kiếm trước khi gõ (ô có thể đang ở ngoài màn hình)
  onStep('Đang gõ vào ô tìm kiếm…');
  input.scrollIntoView({ block: 'center', behavior: isReduced ? 'auto' : 'smooth' });
  await sleep(isReduced ? 100 : PAUSE_MS);
  const box = input.closest<HTMLElement>('.ant-input-affix-wrapper') ?? input;
  try {
    box.classList.add(TYPING_CLASS);
    input.focus({ preventScroll: true });
    typeValue(input, '');
    for (let length = 1; length <= query.length; length++) {
      typeValue(input, query.slice(0, length));
      await sleep(TYPE_DELAY_MS);
    }
    await sleep(PAUSE_MS);

    onStep('Nhấn Enter…');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }),
    );
  } finally {
    box.classList.remove(TYPING_CLASS);
  }

  // Trang tự tìm → chờ tới trang đích; ô tìm kiếm không mang đủ bộ lọc (hiếm) → đi thẳng
  await waitFor(() => isSameSearch(target));
  if (!isSameSearch(target)) navigate(action.path);
}
