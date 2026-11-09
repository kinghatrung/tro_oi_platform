import { create } from 'zustand';

import { getChatUnreadCount } from '@/api/chat';

interface ChatState {
  /** Tổng tin nhắn chưa đọc (badge "Tin nhắn" trên Navbar). */
  unread: number;
  isConnected: boolean;
  refreshUnread: () => Promise<void>;
  setConnected: (isConnected: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  unread: 0,
  isConnected: false,
  refreshUnread: async () => set({ unread: await getChatUnreadCount() }),
  setConnected: (isConnected) => set({ isConnected }),
}));
