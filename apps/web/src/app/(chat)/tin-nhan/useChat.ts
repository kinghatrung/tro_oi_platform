import { useCallback, useMemo, useState } from 'react';
import {
  MessageStatus,
  type ChatMessage,
  type Conversation,
  type Listing,
  type User,
} from '@tro-oi/shared';

/**
 * State trang tin nhắn — ĐIỂM NỐI DUY NHẤT với backend chat.
 *
 * Hiện tại: chưa có backend chat nên chỉ giữ state cục bộ (mất khi tải lại trang),
 * tin nhắn ở trạng thái SENDING và `isConnected = false`.
 *
 * TODO(chat): làm theo docs/chat-plan.md — Bước 6 (FE):
 *  - conversations: GET /conversations khi mount
 *  - startConversation: POST /conversations { listingId }
 *  - selectConversation: GET /conversations/:id/messages + emit "conversation:read"
 *  - sendMessage: emit "message:send" kèm ack → cập nhật status SENT/FAILED
 *  - lắng nghe "message:new" để nhận tin realtime
 * Giữ nguyên shape trả về để page/component không phải sửa.
 */
export function useChat(currentUser: User | null) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [activeId, setActiveId] = useState<string>();
  const isConnected = false;

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId),
    [activeId, conversations],
  );
  const messages = useMemo(
    () => (activeId ? (messagesByConversation[activeId] ?? []) : []),
    [activeId, messagesByConversation],
  );

  /** Mở (hoặc tạo nháp) cuộc trò chuyện với người đăng của tin. */
  const startConversation = useCallback((listing: Listing) => {
    if (!listing.author) return;
    const author = listing.author;
    // shortcut: id nháp theo tin đăng; backend sẽ trả id thật từ POST /conversations
    const id = `draft-${listing.id}`;
    setConversations((current) =>
      current.some((item) => item.id === id)
        ? current
        : [
            {
              id,
              listing: {
                id: listing.id,
                title: listing.title,
                image: listing.images[0],
                price: listing.price,
                transaction: listing.transaction,
              },
              otherUser: {
                id: author.id,
                name: author.name,
                avatar: author.avatar,
                role: author.role,
              },
              unreadCount: 0,
              updatedAt: new Date().toISOString(),
            },
            ...current,
          ],
    );
    setActiveId(id);
  }, []);

  const selectConversation = useCallback((id?: string) => setActiveId(id), []);

  const sendMessage = useCallback(
    (content: string) => {
      if (!activeId || !currentUser) return;
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        conversationId: activeId,
        senderId: currentUser.id,
        content,
        createdAt: new Date().toISOString(),
        status: MessageStatus.SENDING,
      };
      setMessagesByConversation((current) => ({
        ...current,
        [activeId]: [...(current[activeId] ?? []), message],
      }));
      setConversations((current) =>
        current.map((item) =>
          item.id === activeId
            ? { ...item, lastMessage: message, updatedAt: message.createdAt }
            : item,
        ),
      );
    },
    [activeId, currentUser],
  );

  return {
    conversations,
    activeConversation,
    messages,
    isConnected,
    startConversation,
    selectConversation,
    sendMessage,
  };
}
