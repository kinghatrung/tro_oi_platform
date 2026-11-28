import type { AssistantAction } from '@/api/assistant';
import { useAuthStore } from '@/stores/useAuthStore';

import { assistantCommand, assistantForm, type AssistantFormKey } from './assistantRegistry';

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
/** Viền / nền nổi bật phần tử trợ lý đang thao tác (globals.css). */
const HIGHLIGHT_CLASS = 'assistant-typing';
const LOGIN_PATH = '/dang-nhap';
/** Form không hiện dù đã ở đúng trang → lý do thường gặp. */
const FORM_MISSING: Partial<Record<AssistantFormKey, string>> = {
  review: 'Chưa đánh giá được: chỉ đánh giá người đã nhắn tin qua lại với bạn',
};

/** Điều agent cần từ widget: chuyển trang (router của Next) + báo bước đang làm. */
export interface ActionContext {
  navigate: (path: string) => void;
  onStep: (text: string) => void;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const isReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Chờ tới khi `find` trả giá trị (trang mới render xong / URL đổi); quá hạn → null. */
async function waitFor<T>(find: () => T | null | undefined | false, timeout = WAIT_MS) {
  for (const end = Date.now() + timeout; Date.now() < end; await sleep(100)) {
    const found = find();
    if (found) return found;
  }
  return null;
}

/** Phần tử đang hiện trên trang (bỏ phần tử ẩn / trong khung chat của trợ lý). */
const visible = <T extends Element>(selector: string) =>
  [...document.querySelectorAll<T>(selector)].find(
    (element) => element.getClientRects().length > 0 && !element.closest('[role=dialog]'),
  );

/** Gõ như người dùng: đặt giá trị qua setter gốc + sự kiện input → onChange của React chạy. */
function typeValue(input: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Luôn cuộn tới phần tử rồi tô sáng — người dùng thấy trợ lý đang thao tác ở đâu. */
async function focusOn(element: HTMLElement) {
  element.scrollIntoView({ block: 'center', behavior: isReduced() ? 'auto' : 'smooth' });
  element.classList.add(HIGHLIGHT_CLASS);
  await sleep(isReduced() ? 150 : PAUSE_MS);
}

/** Cuộn tới, tô sáng, bấm (như người dùng bấm chuột). */
async function clickOn(element: HTMLElement) {
  await focusOn(element);
  element.click();
  await sleep(300);
  element.classList.remove(HIGHLIGHT_CLASS);
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
 * Tìm kiếm như người thật, ở trang chủ / Chợ ơi dùng ô trên banner, ở trang tìm kiếm dùng ô từ khoá
 * (sai khu / không có ô → mở trang tìm kiếm trước):
 * 1. Bộ lọc không gõ được (loại hình, giá…) đặt sẵn lên URL trang hiện tại (replaceState, không tải
 *    lại) — ô tìm kiếm của trang mang theo khi nhấn Enter, nên Enter tới thẳng trang đích.
 * 2. Cuộn tới ô, xoá chữ cũ, gõ từng chữ, nhấn Enter — chính trang tự tìm.
 * Gõ là việc chính nên vẫn gõ khi máy bật giảm chuyển động (chỉ bỏ cuộn mượt).
 */
async function openSearch(
  action: Extract<AssistantAction, { type: 'open-search' }>,
  { navigate, onStep }: ActionContext,
) {
  const target = new URL(action.path, location.origin);
  const query = action.query.trim();
  if (!query) {
    onStep('Đang mở trang kết quả…');
    navigate(action.path);
    return;
  }

  if (SEARCH_TARGET[location.pathname] !== target.pathname || !visible(SEARCH_INPUT)) {
    onStep('Đang mở trang tìm kiếm…');
    navigate(target.pathname);
    if (!(await waitFor(() => location.pathname === target.pathname && visible(SEARCH_INPUT)))) {
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
  const input = await waitFor(() => visible<HTMLInputElement>(SEARCH_INPUT));
  if (!input) {
    navigate(action.path);
    return;
  }

  onStep('Đang gõ vào ô tìm kiếm…');
  const box = input.closest<HTMLElement>('.ant-input-affix-wrapper') ?? input;
  try {
    await focusOn(box);
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
    box.classList.remove(HIGHLIGHT_CLASS);
  }

  // Trang tự tìm → chờ tới trang đích; ô tìm kiếm không mang đủ bộ lọc (hiếm) → đi thẳng
  await waitFor(() => isSameSearch(target));
  if (!isSameSearch(target)) navigate(action.path);
}

/**
 * Tới trang `path`: bấm link / thẻ tới đó nếu đang hiện trên trang, không có thì mở thẳng.
 * Trang cần đăng nhập mà chưa đăng nhập → trang tự chuyển sang /dang-nhap → false.
 */
async function goTo(path: string, step: string, { navigate, onStep }: ActionContext) {
  if (location.pathname === path) return true;
  onStep(step);
  const link = visible<HTMLAnchorElement>(`a[href="${CSS.escape(path)}"]`);
  if (link) await clickOn(link);
  else navigate(path);
  await waitFor(() => location.pathname === path || location.pathname === LOGIN_PATH);
  if (location.pathname === LOGIN_PATH)
    onStep('Bạn cần đăng nhập trước — đăng nhập xong nhờ mình lại nhé');
  return location.pathname === path;
}

/** Đợi phần tử trên trang mới (vừa chuyển trang, React chưa vẽ xong). */
const waitVisible = (selector: string) => waitFor(() => visible<HTMLElement>(selector));

/**
 * Bấm nút `data-assistant="<target>"` (mở `path` trước nếu có). Nút bật / tắt (aria-pressed /
 * aria-checked) đã đúng `ensure` thì không bấm; nút đang khoá (vd không còn thông báo chưa đọc) bỏ qua.
 */
async function clickTarget(
  action: Extract<AssistantAction, { type: 'click' }>,
  context: ActionContext,
) {
  const { onStep } = context;
  if (action.path) {
    if (!isInternalPath(action.path)) return;
    if (!(await goTo(action.path, `Đang mở trang: ${action.label}`, context))) return;
  }
  const button = await waitVisible(`[data-assistant="${CSS.escape(action.target)}"]`);
  if (!button) {
    onStep(`Không thấy nút "${action.label}" trên trang`);
    return;
  }
  const state = button.getAttribute('aria-pressed') ?? button.getAttribute('aria-checked');
  const isDisabled = button.matches(':disabled, [aria-disabled="true"]');
  if (
    isDisabled ||
    (action.ensure !== undefined && state !== null && (state === 'true') === action.ensure)
  ) {
    onStep(
      isDisabled
        ? `Nút "${action.label}" đang khoá, không bấm được lúc này`
        : `${action.label}: đã đúng như bạn muốn`,
    );
    await focusOn(button);
    button.classList.remove(HIGHLIGHT_CLASS);
    return;
  }
  onStep(`Đang bấm: ${action.label}`);
  await clickOn(button);
}

/**
 * Điền sẵn form trang đã đăng ký (lib/assistantRegistry.ts): mở trang, mở hộp thoại nếu cần, điền
 * từng ô. Không bấm gửi — người dùng kiểm tra (tải ảnh…) rồi tự gửi.
 */
async function fillForm(
  action: Extract<AssistantAction, { type: 'fill-form' }>,
  context: ActionContext,
) {
  const { onStep } = context;
  if (!isInternalPath(action.path)) return;
  if (!(await goTo(action.path, `Đang mở trang: ${action.label}`, context))) return;
  if (action.open) {
    const name = action.open;
    const open = await waitFor(() => assistantCommand(name));
    if (!open) {
      onStep(`Không mở được: ${action.label}`);
      return;
    }
    onStep(`Đang mở: ${action.label}`);
    open();
  }
  const form = action.form;
  // Hộp báo cáo khi chưa đăng nhập → trang tự chuyển sang /dang-nhap
  const fill = await waitFor(() => assistantForm(form) ?? location.pathname === LOGIN_PATH);
  if (location.pathname === LOGIN_PATH) {
    onStep('Bạn cần đăng nhập trước — đăng nhập xong nhờ mình lại nhé');
    return;
  }
  if (typeof fill !== 'function') {
    onStep(FORM_MISSING[form] ?? `Không thấy form "${action.label}" trên trang`);
    return;
  }
  onStep(`Đang điền: ${action.label}`);
  await fill(action.values);
  onStep('Đã điền xong — bạn kiểm tra lại rồi tự bấm gửi nhé');
}

/**
 * Diễn lại 1 thao tác của agent trên giao diện như người thật: cuộn tới đúng chỗ, tô sáng, bấm / gõ.
 * Việc cần đăng nhập (lưu, nhắn tin…) để chính trang xử lý — chưa đăng nhập thì trang tự chuyển tới
 * trang đăng nhập như khi người dùng tự bấm.
 */
export async function playAssistantAction(action: AssistantAction, context: ActionContext) {
  const { navigate, onStep } = context;
  switch (action.type) {
    case 'open-search':
      if (isInternalPath(action.path)) await openSearch(action, context);
      return;

    case 'open-item':
      if (isInternalPath(action.path))
        await goTo(action.path, `Đang mở tin: ${action.label}`, context);
      return;

    case 'message': {
      if (!isInternalPath(action.path) || !isInternalPath(action.chatPath)) return;
      if (!(await goTo(action.path, `Đang mở tin: ${action.label}`, context))) return;
      const contact = await waitVisible('[data-assistant="contact"]');
      if (contact) {
        onStep('Đang liên hệ người đăng…');
        await focusOn(contact);
        contact.classList.remove(HIGHLIGHT_CLASS);
      }
      onStep('Đang mở khung chat với tin nhắn soạn sẵn…');
      navigate(action.chatPath);
      return;
    }

    case 'click':
      await clickTarget(action, context);
      return;

    case 'fill-form':
      await fillForm(action, context);
      return;

    case 'logout':
      onStep('Đang đăng xuất…');
      useAuthStore.getState().logout();
      // tải lại toàn trang như nút Đăng xuất ở menu: xoá state client, tránh trang riêng tư tự chuyển
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- cố ý tải lại toàn trang
      window.location.assign('/');
      return;

    case 'set-theme': {
      if (document.documentElement.dataset.theme === action.mode) return;
      const toggle = visible<HTMLElement>('[data-assistant="theme-toggle"]');
      if (!toggle) {
        onStep('Website đang không cho đổi giao diện');
        return;
      }
      onStep(`Đang chuyển sang ${action.label.toLowerCase()}…`);
      await clickOn(toggle);
      return;
    }

    case 'open-page':
      if (!isInternalPath(action.path)) return;
      onStep(`Đang mở ${action.label}…`);
      navigate(action.path);
      await waitFor(() => location.pathname === action.path);
      return;
  }
}

/** Nút chỉ dùng được khi đã đăng nhập (trang tự chuyển sang đăng nhập nếu chưa). */
const LOGIN_TARGETS = new Set([
  'save',
  'save-search',
  'mark-all-read',
  'notify-email',
  'notify-sms',
  'export-data',
]);

/** Thao tác cần đăng nhập: điền form, nhắn tin, các nút trong LOGIN_TARGETS. */
export const needsLogin = (action: AssistantAction) =>
  action.type === 'fill-form' ||
  action.type === 'message' ||
  (action.type === 'click' && LOGIN_TARGETS.has(action.target));

/** Đăng nhập xong quay về trang của thao tác (không có thì trang đang xem). */
export const loginReturnPath = (action: AssistantAction) =>
  'path' in action && action.path && isInternalPath(action.path)
    ? action.path
    : `${location.pathname}${location.search}`;

const PENDING_KEY = 'assistant:pending';
/** Quá 15 phút mới đăng nhập → coi như bỏ việc cũ, không tự làm bất ngờ. */
const PENDING_TTL_MS = 15 * 60_000;

/** Nhớ việc dở (trong tab này) để đăng nhập xong widget làm tiếp. */
export function savePendingActions(actions: AssistantAction[]) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ at: Date.now(), actions }));
  } catch {
    // trình duyệt chặn storage → đăng nhập xong người dùng nhờ lại
  }
}

/** Lấy (và xoá) việc dở còn hạn. */
export function takePendingActions(): AssistantAction[] {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    const pending = raw ? (JSON.parse(raw) as { at: number; actions: AssistantAction[] }) : null;
    return pending && Date.now() - pending.at < PENDING_TTL_MS && Array.isArray(pending.actions)
      ? pending.actions
      : [];
  } catch {
    return [];
  }
}
