'use client';

import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { App, Skeleton } from 'antd';
import { ChatTargetType } from '@tro-oi/shared';

import { ChatWindow, ConversationList } from '@/components/chat';
import { PRODUCT_QUESTIONS } from '@/lib/constants/constantsProduct';
import { SAMPLE_QUESTIONS } from '@/lib/constants/constantsRoom';
import { useRequireUser } from '@/stores/useAuthStore';

import { useChat } from './useChat';

/**
 * Tin nhắn giữa người hỏi và chủ tin / người bán.
 * Mở từ trang tin: /tin-nhan?listingId=<id>&text=<câu hỏi điền sẵn>; từ món đồ: ?productId=<id>
 */
export default function MessagesPage() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId') ?? undefined;
  const productId = searchParams.get('productId') ?? undefined;
  const draft = searchParams.get('text') ?? undefined;
  const { message } = App.useApp();
  const user = useRequireUser();
  const chat = useChat(user);
  const { startConversation } = chat;
  const startedRef = useRef<string>(null);

  // Mở cuộc trò chuyện theo ?listingId= / ?productId= (chỉ 1 lần mỗi đối tượng)
  const targetKey = listingId ?? productId;
  useEffect(() => {
    if (!user || !targetKey || startedRef.current === targetKey) return;
    startedRef.current = targetKey;
    startConversation({ listingId, productId }).catch((error: Error) =>
      message.error(error.message),
    );
  }, [listingId, message, productId, startConversation, targetKey, user]);

  if (!user) {
    return (
      <div className="p-6">
        <Skeleton avatar active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  const hasActive = Boolean(chat.activeConversation);

  return (
    <div className="flex h-full">
      {/* Mobile: đang mở cuộc trò chuyện thì ẩn danh sách */}
      <aside
        className={clsx(
          'w-full border-r border-line md:block md:w-80 md:shrink-0',
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
          onTyping={chat.notifyTyping}
          isOtherTyping={chat.isOtherTyping}
          onBack={() => chat.selectConversation(undefined)}
          quickQuestions={
            chat.activeConversation?.listing.type === ChatTargetType.PRODUCT
              ? PRODUCT_QUESTIONS
              : SAMPLE_QUESTIONS
          }
          draft={draft}
        />
      </section>
    </div>
  );
}
