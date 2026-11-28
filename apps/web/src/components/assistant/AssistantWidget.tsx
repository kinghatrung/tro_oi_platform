'use client';

import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Input, Tag, Tooltip } from 'antd';
import {
  Bot,
  MousePointerClick,
  SendHorizontal,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from 'lucide-react';
import type { TransactionType } from '@tro-oi/shared';

import {
  rateAssistantAnswer,
  streamAssistant,
  type AssistantAction,
  type AssistantCard,
} from '@/api/assistant';
import { NO_IMAGE } from '@/constants';
import {
  isInternalPath,
  loginReturnPath,
  needsLogin,
  playAssistantAction,
  savePendingActions,
  takePendingActions,
} from '@/lib/assistantActions';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatListingPrice, formatVietnameseCurrency } from '@/utils/helpers';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  cards?: AssistantCard[];
  /** Thao tác agent đã làm trên trang (hiện thành nút để mở lại). */
  actions?: AssistantAction[];
  /** Id lượt trả lời (sự kiện done) — có thì hiện 👍 / 👎. */
  messageId?: string;
  rating?: 1 | -1;
}

/** Số lượt gần nhất gửi kèm làm ngữ cảnh (dịch vụ AI chưa lưu phiên). */
const HISTORY_SIZE = 10;

const SESSION_KEY = 'assistantSessionId';

/** Id phiên chat theo tab trình duyệt — nhật ký gom các lượt của 1 cuộc trò chuyện. */
function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID(); // chặn storage (chế độ riêng tư) → mỗi câu 1 phiên
  }
}

/** Trang có giao diện riêng (quản trị, kênh người đăng, đăng nhập, tin nhắn) → không hiện nút. */
const HIDDEN_PREFIXES = ['/quan-tri', '/kenh-nguoi-dang', '/dang-nhap', '/tin-nhan'];

const SUGGESTIONS = {
  housing: [
    'Tìm phòng 3–5 triệu ở Cầu Giấy',
    'Giá thuê phòng trung bình ở Hà Nội?',
    'Đăng tin cho thuê thế nào?',
  ],
  market: [
    'Tìm tủ lạnh cũ dưới 2 triệu',
    'Đồ nội thất nào đang rẻ?',
    'Bán đồ cũ trên Chợ ơi thế nào?',
  ],
};

/** Thẻ tin / món đồ trong câu trả lời — bấm mở trang chi tiết. */
function ResultCard({ card, onOpen }: { card: AssistantCard; onOpen: () => void }) {
  const isListing = card.kind === 'listing';
  return (
    <Link
      href={isListing ? `/phong-tro/${card.id}` : `/cho-oi/${card.id}`}
      onClick={onOpen}
      className="flex gap-2 rounded-xl border border-line bg-surface p-2 transition-colors hover:border-brand"
    >
      <Image
        src={card.image || NO_IMAGE}
        alt=""
        width={64}
        height={64}
        className="size-16 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 text-left">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{card.title}</p>
        <p className="text-sm font-bold text-price">
          {isListing && card.transaction
            ? formatListingPrice(card.price, card.transaction as TransactionType)
            : formatVietnameseCurrency(card.price)}
          {card.area ? <span className="font-normal text-subtle"> · {card.area}m²</span> : null}
        </p>
        {card.address && <p className="truncate text-xs text-subtle">{card.address}</p>}
      </div>
    </Link>
  );
}

/** Nút "mở lại" cho thao tác agent đã làm; thao tác không có trang riêng (lưu tìm kiếm, đổi giao diện) → null. */
/**
 * Chữ trợ lý: chỉ hiểu **đậm** và [chữ](/đường-dẫn) — link nội bộ bấm được, link ngoài chỉ hiện
 * chữ. Còn lại giữ nguyên (React tự escape, không render HTML).
 */
function RichText({ text }: { text: string }) {
  return text.split(/(\*\*[^*\n]+\*\*|\[[^\]\n]+\]\([^)\s]+\))/g).map((part, index) => {
    const bold = /^\*\*(.+)\*\*$/.exec(part);
    if (bold) return <strong key={index}>{bold[1]}</strong>;
    const link = /^\[(.+)\]\((.+)\)$/.exec(part);
    if (!link) return part;
    return isInternalPath(link[2]) ? (
      <Link key={index} href={link[2]} className="font-semibold text-brand underline">
        {link[1]}
      </Link>
    ) : (
      link[1]
    );
  });
}

function actionLink(action: AssistantAction): { href: string; text: string } | null {
  const link =
    action.type === 'open-search'
      ? { href: action.path, text: `Trang kết quả: ${action.label}` }
      : action.type === 'open-item'
        ? { href: action.path, text: `Đã mở: ${action.label}` }
        : action.type === 'message'
          ? { href: action.chatPath, text: `Tin nhắn soạn sẵn: ${action.label}` }
          : action.type === 'open-page' || action.type === 'fill-form'
            ? { href: action.path, text: action.label }
            : action.type === 'click' && action.path
              ? { href: action.path, text: action.label }
              : null;
  return link && isInternalPath(link.href) ? link : null;
}

/** Nút tròn góc phải dưới → khung chat với trợ lý AI (giữ hội thoại khi chuyển trang). */
export function AssistantWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoggedIn = useAuthStore((state) => Boolean(state.user));
  const isMarket = pathname.startsWith('/cho-oi');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  /** Dòng trạng thái dịch vụ AI gửi về, vd "Đang tìm phòng ở Phường Cầu Giấy…". */
  const [status, setStatus] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  /**
   * Agent thao tác hộ, lần lượt từng việc: thu khung chat (không che trang), cuộn / gõ / bấm, rồi
   * mở lại (điện thoại: khung chat che cả màn hình → để đóng). Việc cần đăng nhập mà chưa đăng
   * nhập → nhớ phần còn lại, mở trang đăng nhập; đăng nhập xong effect bên dưới làm tiếp.
   */
  const playActions = async (actions: AssistantAction[]) => {
    setIsOpen(false);
    for (const [index, action] of actions.entries()) {
      const { user, status: session } = useAuthStore.getState();
      if (!user && session === 'ready' && needsLogin(action)) {
        savePendingActions(actions.slice(index));
        router.push(`/dang-nhap?redirect=${encodeURIComponent(loginReturnPath(action))}`);
        return;
      }
      await playAssistantAction(action, {
        navigate: (path) => router.push(path),
        onStep: setStatus,
      });
    }
    if (window.innerWidth >= 640) setIsOpen(true);
  };
  /** Làm tiếp việc dở lúc chưa đăng nhập (nhớ trong sessionStorage). */
  const resumePending = useEffectEvent(() => {
    const pending = takePendingActions();
    if (pending.length === 0) return;
    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        text: `Bạn đã đăng nhập — mình làm tiếp: ${pending.map((action) => action.label).join(', ')}.`,
      },
    ]);
    setIsThinking(true);
    void playActions(pending).finally(() => {
      setIsThinking(false);
      setStatus('');
    });
  });

  // Đăng nhập xong và đã rời trang đăng nhập (trang đó tự chuyển về redirect) → đợi trang đích
  // vẽ xong rồi làm tiếp; trang còn đổi tiếp thì huỷ hẹn giờ, chờ trang cuối
  useEffect(() => {
    if (!isLoggedIn || pathname.startsWith('/dang-nhap')) return;
    const timer = setTimeout(resumePending, 400);
    return () => clearTimeout(timer);
  }, [isLoggedIn, pathname]);

  // Cuộn xuống tin mới nhất
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isThinking]);

  // Esc đóng khung chat
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setIsOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || isThinking) return;
    const history: ChatMessage[] = [...messages, { role: 'user', text: content }];
    setMessages(history);
    setDraft('');
    setIsThinking(true);
    setStatus('');

    const reply: ChatMessage = { role: 'assistant', text: '' };
    const showReply = (patch: Partial<ChatMessage>) => {
      Object.assign(reply, patch);
      setMessages([...history, { ...reply }]);
    };
    try {
      await streamAssistant(
        {
          sessionId: getSessionId(),
          messages: history
            .slice(-HISTORY_SIZE)
            .filter((message) => message.text)
            .map(({ role, text: body }) => ({ role, content: body })),
          context: {
            page: pathname,
            section: isMarket ? 'market' : 'housing',
            isLoggedIn,
            // Thẻ của câu trả lời gần nhất có thẻ — trợ lý hiểu "phòng thứ 2", "món đầu tiên"
            recentItems: (messages.findLast((message) => message.cards?.length)?.cards ?? []).map(
              ({ kind, id, title }) => ({ kind, id, title: title.slice(0, 150) }),
            ),
          },
        },
        ({ event, data }) => {
          if (event === 'status') setStatus(data.text);
          else if (event === 'delta') showReply({ text: reply.text + data.text });
          else if (event === 'text') showReply({ text: data.text });
          else if (event === 'cards') showReply({ cards: data.items });
          else if (event === 'action') showReply({ actions: [...(reply.actions ?? []), data] });
          else if (event === 'error') showReply({ text: data.message });
          else if (event === 'done') showReply({ messageId: data.messageId });
        },
      );
      if (reply.actions?.length) await playActions(reply.actions);
    } catch (error) {
      showReply({ text: (error as Error).message });
    } finally {
      if (!reply.text && !reply.cards)
        showReply({ text: 'Mình chưa trả lời được, bạn thử lại nhé.' });
      setIsThinking(false);
      setStatus('');
    }
  };

  /** 👍 / 👎: hiện ngay, gửi lỗi thì bỏ chọn lại. */
  const rate = (messageId: string, rating: 1 | -1) => {
    const setRating = (value?: 1 | -1) =>
      setMessages((current) =>
        current.map((message) =>
          message.messageId === messageId ? { ...message, rating: value } : message,
        ),
      );
    setRating(rating);
    rateAssistantAnswer(messageId, rating).catch(() => setRating(undefined));
  };

  return (
    <>
      {isOpen && (
        <section
          role="dialog"
          aria-label="Trò chuyện với trợ lý AI"
          className="assistant-pop fixed inset-0 z-1000 flex flex-col overflow-hidden bg-surface shadow-[0_12px_40px_rgba(0,0,0,0.18)] sm:inset-auto sm:right-5 sm:bottom-24 sm:h-140 sm:max-h-[calc(100dvh-8rem)] sm:w-95 sm:rounded-2xl sm:border sm:border-line"
        >
          <header className="flex items-center gap-3 bg-brand px-4 py-3 text-white">
            <span className="flex size-9 items-center justify-center rounded-full bg-white/20">
              <Bot size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight">Trợ lý AI {isMarket ? 'Chợ ơi' : 'Trọ ơi'}</p>
              <p className="text-xs text-white/80">Hỏi gì cũng được về phòng trọ, đồ cũ</p>
            </div>
            <Tag className="m-0! border-0! bg-white/20! text-white!">Thử nghiệm</Tag>
            <Button
              type="text"
              aria-label="Đóng"
              icon={<X size={18} className="text-white" />}
              onClick={() => setIsOpen(false)}
            />
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-page px-4 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center gap-3 pt-6 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <Sparkles size={26} />
                </span>
                <p className="font-bold text-ink">Xin chào! Mình có thể giúp gì cho bạn?</p>
                <p className="text-sm text-body">
                  Thử hỏi bằng lời bình thường, mình sẽ tìm và trả lời giúp bạn.
                </p>
                <div className="mt-2 flex w-full flex-col gap-2">
                  {SUGGESTIONS[isMarket ? 'market' : 'housing'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(suggestion)}
                      className="cursor-pointer rounded-xl border border-line bg-surface px-3 py-2 text-left text-sm text-ink transition-colors hover:border-brand hover:text-brand"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={clsx(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div className="flex max-w-[85%] flex-col gap-2">
                    {message.text && (
                      <p
                        className={clsx(
                          'whitespace-pre-line rounded-2xl px-3 py-2 text-sm',
                          message.role === 'user'
                            ? 'self-end rounded-br-sm bg-brand text-white'
                            : 'rounded-bl-sm bg-surface text-ink shadow-sm',
                        )}
                      >
                        {message.role === 'assistant' ? (
                          <RichText text={message.text} />
                        ) : (
                          message.text
                        )}
                      </p>
                    )}
                    {message.cards?.map((card) => (
                      <ResultCard
                        key={`${card.kind}-${card.id}`}
                        card={card}
                        // Màn hình nhỏ: khung chat che cả trang → đóng để thấy tin vừa mở
                        onOpen={() => window.innerWidth < 640 && setIsOpen(false)}
                      />
                    ))}
                    {message.actions?.map((action) => {
                      const link = actionLink(action);
                      return (
                        link && (
                          <Link
                            key={`${action.type}-${link.href}`}
                            href={link.href}
                            onClick={() => window.innerWidth < 640 && setIsOpen(false)}
                            className="flex items-center gap-2 self-start rounded-full bg-brand-soft! px-3 py-1.5 text-xs font-semibold text-brand"
                          >
                            <MousePointerClick size={14} className="shrink-0" />
                            <span className="line-clamp-1">{link.text}</span>
                          </Link>
                        )
                      );
                    })}
                    {message.messageId && (
                      <div className="flex items-center gap-1 text-subtle">
                        {(
                          [
                            [1, ThumbsUp, 'Câu trả lời hữu ích'],
                            [-1, ThumbsDown, 'Câu trả lời chưa tốt'],
                          ] as const
                        ).map(([value, Icon, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-label={label}
                            aria-pressed={message.rating === value}
                            title={label}
                            onClick={() => rate(message.messageId!, value)}
                            className={clsx(
                              'flex size-7 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent transition-colors hover:bg-soft',
                              message.rating === value && 'text-brand',
                            )}
                          >
                            <Icon
                              size={15}
                              fill={message.rating === value ? 'currentColor' : 'none'}
                            />
                          </button>
                        ))}
                        {message.rating && <span className="text-xs">Cảm ơn bạn!</span>}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isThinking && (
              <div
                className="flex justify-start"
                aria-live="polite"
                aria-label="Trợ lý đang trả lời"
              >
                <span className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-surface px-3 py-2.5 shadow-sm">
                  <span className="flex gap-1">
                    {[0, 1, 2].map((dot) => (
                      <span
                        key={dot}
                        className="assistant-dot size-1.5 rounded-full bg-subtle"
                        style={{ animationDelay: `${dot * 0.15}s` }}
                      />
                    ))}
                  </span>
                  {status && <span className="text-xs text-body">{status}</span>}
                </span>
              </div>
            )}
          </div>

          <form
            className="flex items-end gap-2 border-t border-line bg-surface p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <Input.TextArea
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onPressEnter={(event) => {
                if (event.shiftKey) return; // Shift+Enter xuống dòng
                event.preventDefault();
                void send(draft);
              }}
              placeholder="Nhập câu hỏi…"
              aria-label="Câu hỏi cho trợ lý AI"
              autoSize={{ minRows: 1, maxRows: 4 }}
              maxLength={1000}
              className="rounded-xl!"
            />
            <Button
              type="primary"
              htmlType="submit"
              shape="circle"
              aria-label="Gửi"
              disabled={!draft.trim() || isThinking}
              icon={<SendHorizontal size={16} />}
            />
          </form>
        </section>
      )}

      {/* Khung chat thu lại khi trợ lý đang thao tác trên trang → bước hiện cạnh nút */}
      {!isOpen && isThinking && status && (
        <p
          aria-live="polite"
          className="assistant-pop fixed right-22 bottom-8 z-1000 m-0 flex max-w-[calc(100vw-7rem)] items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        >
          <Bot size={16} className="shrink-0 text-brand" />
          <span className="truncate">{status}</span>
        </p>
      )}

      <Tooltip title={isOpen ? undefined : 'Trợ lý AI'} placement="left">
        <button
          type="button"
          aria-label={isOpen ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((open) => !open)}
          className={clsx(
            'fixed right-5 bottom-5 z-1000 flex size-14 cursor-pointer items-center justify-center rounded-full border-0 bg-brand text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform hover:scale-105',
            isOpen && 'max-sm:hidden',
          )}
        >
          {isOpen ? <X size={24} /> : <Bot size={26} />}
        </button>
      </Tooltip>
    </>
  );
}
