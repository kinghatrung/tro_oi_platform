import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { App } from 'antd';
import {
  MessageStatus,
  type ChatMessage,
  type ChatMessageEvent,
  type Conversation,
  type SendMessageAck,
  type StartConversationRequest,
  type TypingEvent,
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
/** Không nhận thêm "typing" sau khoảng này → ẩn "đang nhập…" (client gửi mỗi 2,5s khi còn gõ). */
const TYPING_VISIBLE_MS = 4_000;

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
  // Cuộc trò chuyện mà người kia đang gõ; mỗi cái có timer tự ẩn
  const [typingIds, setTypingIds] = useState<ReadonlySet<string>>(new Set());
  const typingTimersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());
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

  const setTyping = useCallback((conversationId: string, isTyping: boolean) => {
    const timers = typingTimersRef.current;
    const mark = (on: boolean) =>
      setTypingIds((current) => {
        if (current.has(conversationId) === on) return current;
        const next = new Set(current);
        if (on) next.add(conversationId);
        else next.delete(conversationId);
        return next;
      });
    clearTimeout(timers.get(conversationId));
    timers.delete(conversationId);
    mark(isTyping);
    if (isTyping) {
      timers.set(
        conversationId,
        setTimeout(() => {
          timers.delete(conversationId);
          mark(false);
        }, TYPING_VISIBLE_MS),
      );
    }
  }, []);

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
      if (message.senderId !== userId) setTyping(conversation.id, false); // đã gửi xong
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
    const onTyping = ({ conversationId, userId: typist }: TypingEvent) => {
      if (typist !== userId) setTyping(conversationId, true);
    };
    const timers = typingTimersRef.current;
    socket.on('message:new', onNew);
    socket.on('conversation:read', onRead);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('conversation:read', onRead);
      socket.off('typing', onTyping);
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, [addMessages, markRead, setTyping, toast, userId]);

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

  /** Báo người kia mình đang gõ (ChatComposer đã giãn tần suất). */
  const notifyTyping = useCallback(() => {
    if (activeIdRef.current) {
      getChatSocket().emit('typing', { conversationId: activeIdRef.current });
    }
  }, []);

  /** Hiện ngay (SENDING) → ack thì thay bằng tin thật, lỗi/quá 10s thì FAILED. */
  const sendMessage = useCallback(
    (content: string, images: string[] = []) => {
      if (!activeId || !userId) return;
      const conversationId = activeId;
      const clientId = crypto.randomUUID();
      addMessages(conversationId, [
        {
          id: clientId,
          conversationId,
          senderId: userId,
          content,
          images,
          createdAt: new Date().toISOString(),
          status: MessageStatus.SENDING,
        },
      ]);

      getChatSocket()
        .timeout(SEND_TIMEOUT_MS)
        .emit(
          'message:send',
          { conversationId, content, images },
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
    notifyTyping,
    isOtherTyping: Boolean(activeId && typingIds.has(activeId)),
  };
}
