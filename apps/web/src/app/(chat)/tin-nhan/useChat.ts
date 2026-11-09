import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App } from 'antd';
import {
  MessageStatus,
  type ChatMessage,
  type ChatMessageEvent,
  type Conversation,
  type SendMessageAck,
  type StartConversationRequest,
  type User,
} from '@tro-oi/shared';

import {
  getConversations,
  getMessages,
  startConversation as startConversationApi,
} from '@/api/chat';
import { getChatSocket } from '@/lib/socket';
import { useChatStore } from '@/stores/useChatStore';

const SEND_TIMEOUT_MS = 10_000;

/** Gộp 2 danh sách tin (REST + realtime), bỏ trùng id, sắp theo thời gian. */
const mergeMessages = (base: ChatMessage[], extra: ChatMessage[]) =>
  [...new Map([...base, ...extra].map((message) => [message.id, message])).values()].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

/** Đưa cuộc trò chuyện lên đầu danh sách (mới có tin). */
const moveToTop = (list: Conversation[], conversation: Conversation) => [
  conversation,
  ...list.filter((item) => item.id !== conversation.id),
];

/**
 * State trang tin nhắn: REST cho danh sách + lịch sử, Socket.IO (/chat) cho gửi/nhận realtime.
 * Kết nối socket do MessagesButton trên Navbar mở; hook chỉ đăng ký sự kiện.
 */
export function useChat(currentUser: User | null) {
  const { message: toast } = App.useApp();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [activeId, setActiveId] = useState<string>();
  const activeIdRef = useRef<string>(undefined);
  const loadedRef = useRef(new Set<string>());
  const isConnected = useChatStore((state) => state.isConnected);
  const userId = currentUser?.id;

  const activeConversation = useMemo(
    () => conversations.find((item) => item.id === activeId),
    [activeId, conversations],
  );
  const messages = useMemo(
    () => (activeId ? (messagesByConversation[activeId] ?? []) : []),
    [activeId, messagesByConversation],
  );

  const addMessages = useCallback((conversationId: string, list: ChatMessage[]) => {
    setMessagesByConversation((current) => ({
      ...current,
      [conversationId]: mergeMessages(current[conversationId] ?? [], list),
    }));
  }, []);

  const markRead = useCallback((conversationId: string) => {
    setConversations((current) =>
      current.map((item) => (item.id === conversationId ? { ...item, unreadCount: 0 } : item)),
    );
    getChatSocket().emit('conversation:read', { conversationId });
  }, []);

  useEffect(() => {
    if (!userId) return;
    getConversations()
      .then((list) =>
        // Giữ cuộc trò chuyện vừa mở bằng ?listingId= nếu nó về trước danh sách
        setConversations((current) => [
          ...current.filter((item) => !list.some((loaded) => loaded.id === item.id)),
          ...list,
        ]),
      )
      .catch((error: Error) => toast.error(error.message));

    const socket = getChatSocket();
    const onNew = ({ message, conversation }: ChatMessageEvent) => {
      addMessages(conversation.id, [message]);
      const isOpen = conversation.id === activeIdRef.current;
      setConversations((current) =>
        moveToTop(current, isOpen ? { ...conversation, unreadCount: 0 } : conversation),
      );
      if (isOpen && message.senderId !== userId) markRead(conversation.id);
    };
    const onRead = ({ conversationId }: { conversationId: string }) =>
      setConversations((current) =>
        current.map((item) => (item.id === conversationId ? { ...item, unreadCount: 0 } : item)),
      );
    socket.on('message:new', onNew);
    socket.on('conversation:read', onRead);
    return () => {
      socket.off('message:new', onNew);
      socket.off('conversation:read', onRead);
    };
  }, [addMessages, markRead, toast, userId]);

  const selectConversation = useCallback(
    (id?: string) => {
      setActiveId(id);
      activeIdRef.current = id;
      if (!id) return;
      if (!loadedRef.current.has(id)) {
        loadedRef.current.add(id);
        getMessages(id)
          .then((list) => addMessages(id, list))
          .catch((error: Error) => {
            loadedRef.current.delete(id);
            toast.error(error.message);
          });
      }
      markRead(id);
    },
    [addMessages, markRead, toast],
  );

  /** Mở (tạo nếu chưa có) cuộc trò chuyện về 1 tin / món đồ. Ném lỗi để trang hiển thị. */
  const startConversation = useCallback(
    async (target: StartConversationRequest) => {
      const conversation = await startConversationApi(target);
      setConversations((current) =>
        current.some((item) => item.id === conversation.id) ? current : [conversation, ...current],
      );
      selectConversation(conversation.id);
    },
    [selectConversation],
  );

  /** Hiện ngay (SENDING) → ack thì thay bằng tin thật, lỗi/quá 10s thì FAILED. */
  const sendMessage = useCallback(
    (content: string) => {
      if (!activeId || !userId) return;
      const conversationId = activeId;
      const clientId = crypto.randomUUID();
      addMessages(conversationId, [
        {
          id: clientId,
          conversationId,
          senderId: userId,
          content,
          createdAt: new Date().toISOString(),
          status: MessageStatus.SENDING,
        },
      ]);

      getChatSocket()
        .timeout(SEND_TIMEOUT_MS)
        .emit(
          'message:send',
          { conversationId, content },
          (timeoutError: Error | null, ack?: SendMessageAck) => {
            setMessagesByConversation((current) => {
              const list = current[conversationId] ?? [];
              const pending = list.filter((item) => item.id !== clientId);
              const next =
                !timeoutError && ack?.ok
                  ? mergeMessages(pending, [ack.message]) // message:new có thể đã tới trước ack
                  : list.map((item) =>
                      item.id === clientId ? { ...item, status: MessageStatus.FAILED } : item,
                    );
              return { ...current, [conversationId]: next };
            });
            if (!timeoutError && ack && !ack.ok) toast.error(ack.error);
          },
        );
    },
    [activeId, addMessages, toast, userId],
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
