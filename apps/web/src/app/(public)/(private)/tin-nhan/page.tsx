'use client';

import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { App, Card, Skeleton } from 'antd';

import { getListing } from '@/api/listings';
import { ChatWindow, ConversationList } from '@/components/chat';
import { SAMPLE_QUESTIONS } from '@/lib/constants/constantsRoom';
import { useRequireUser } from '@/stores/useAuthStore';

import { useChat } from './useChat';

/**
 * Tin nhắn giữa người tìm trọ và người đăng.
 * Mở từ trang tin: /tin-nhan?listingId=<id>&text=<câu hỏi điền sẵn>
 */
export default function MessagesPage() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  const draft = searchParams.get('text') ?? undefined;
  const { message } = App.useApp();
  const user = useRequireUser();
  const chat = useChat(user);
  const { startConversation } = chat;
  const startedListingRef = useRef<string>(null);

  // Mở cuộc trò chuyện theo ?listingId= (chỉ 1 lần mỗi tin)
  useEffect(() => {
    if (!user || !listingId || startedListingRef.current === listingId) return;
    startedListingRef.current = listingId;
    getListing(listingId)
      .then((listing) => {
        if (listing.author?.id === user.id) {
          message.info('Đây là tin đăng của bạn');
          return;
        }
        startConversation(listing);
      })
      .catch((error: Error) => message.error(error.message));
  }, [listingId, message, startConversation, user]);

  if (!user) {
    return (
      <Card variant="borderless">
        <Skeleton avatar active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  const hasActive = Boolean(chat.activeConversation);

  return (
    <Card variant="borderless" classNames={{ body: 'p-0!' }} className="overflow-hidden">
      <div className="flex h-[calc(100vh-180px)] min-h-120">
        {/* Mobile: đang mở cuộc trò chuyện thì ẩn danh sách */}
        <aside
          className={clsx(
            'w-full border-r border-[#f0f0f0] md:block md:w-80 md:shrink-0',
            hasActive ? 'hidden' : 'block',
          )}
        >
          <ConversationList
            conversations={chat.conversations}
            activeId={chat.activeConversation?.id}
            currentUserId={user.id}
            onSelect={chat.selectConversation}
          />
        </aside>
        <section className={clsx('min-w-0 flex-1 md:block', hasActive ? 'block' : 'hidden')}>
          <ChatWindow
            conversation={chat.activeConversation}
            messages={chat.messages}
            currentUserId={user.id}
            isConnected={chat.isConnected}
            onSend={chat.sendMessage}
            onBack={() => chat.selectConversation(undefined)}
            quickQuestions={SAMPLE_QUESTIONS}
            draft={draft}
          />
        </section>
      </div>
    </Card>
  );
}
