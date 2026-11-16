'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button, Input, Tag, Tooltip } from 'antd';
import { Bot, SendHorizontal, Sparkles, X } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
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

/**
 * shortcut: chưa nối model AI — trả lời giả để dựng giao diện.
 * Khi có API (POST /assistant/chat) thì thay hàm này, giữ nguyên chữ ký.
 */
async function askAssistant(history: ChatMessage[]): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const question = history.at(-1)?.text ?? '';
  return `Mình đã nhận câu hỏi “${question}”. Trợ lý AI đang được kết nối nên chưa trả lời được — trong lúc chờ, bạn thử dùng ô tìm kiếm và bộ lọc nhé!`;
}

/** Nút tròn góc phải dưới → khung chat với trợ lý AI (giữ hội thoại khi chuyển trang). */
export function AssistantWidget() {
  const pathname = usePathname();
  const isMarket = pathname.startsWith('/cho-oi');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

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
    try {
      const reply = await askAssistant(history);
      setMessages((current) => [...current, { role: 'assistant', text: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', text: 'Xin lỗi, trợ lý đang bận. Bạn thử lại sau ít phút nhé.' },
      ]);
    } finally {
      setIsThinking(false);
    }
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
                  <p
                    className={clsx(
                      'max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm',
                      message.role === 'user'
                        ? 'rounded-br-sm bg-brand text-white'
                        : 'rounded-bl-sm bg-surface text-ink shadow-sm',
                    )}
                  >
                    {message.text}
                  </p>
                </div>
              ))
            )}
            {isThinking && (
              <div
                className="flex justify-start"
                aria-live="polite"
                aria-label="Trợ lý đang trả lời"
              >
                <span className="flex gap-1 rounded-2xl rounded-bl-sm bg-surface px-3 py-3 shadow-sm">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="assistant-dot size-1.5 rounded-full bg-subtle"
                      style={{ animationDelay: `${dot * 0.15}s` }}
                    />
                  ))}
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
