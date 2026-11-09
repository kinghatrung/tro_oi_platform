import type {
  ApiResponse,
  ChatMessage,
  Conversation,
  StartConversationRequest,
} from '@tro-oi/shared';

import axiosClient from './axiosClient';

/** REST của chat. Gửi tin / đánh dấu đã đọc đi qua Socket.IO (src/lib/socket.ts). */

export async function getConversations() {
  const res = (await axiosClient.get('/conversations')) as ApiResponse<Conversation[]>;
  return res.data;
}

export async function getChatUnreadCount() {
  const res = (await axiosClient.get('/conversations/unread-count')) as ApiResponse<{
    count: number;
  }>;
  return res.data.count;
}

export async function startConversation(body: StartConversationRequest) {
  const res = (await axiosClient.post('/conversations', body)) as ApiResponse<Conversation>;
  return res.data;
}

/** Cũ → mới; `before` (ISO) để tải tin cũ hơn. */
export async function getMessages(id: string, before?: string) {
  const res = (await axiosClient.get(`/conversations/${id}/messages`, {
    params: { before },
  })) as ApiResponse<ChatMessage[]>;
  return res.data;
}
