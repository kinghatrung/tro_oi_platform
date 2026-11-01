import type { TransactionType } from './housing';
import type { UserRole } from './user';

/** Trạng thái gửi của tin nhắn phía client. */
export enum MessageStatus {
  /** Đã hiện trên UI, chờ server xác nhận (ack). */
  SENDING = 'sending',
  SENT = 'sent',
  FAILED = 'failed',
}

/** Người còn lại trong cuộc trò chuyện (người tìm trọ ↔ người đăng). */
export interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role?: UserRole;
}

/** Tin đăng mà cuộc trò chuyện đang nói tới (rút gọn). */
export interface ConversationListing {
  id: string;
  title: string;
  image?: string;
  price: number;
  transaction: TransactionType;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  /** ISO 8601. */
  createdAt: string;
  /** Chỉ có ở client (tin mình gửi); server trả về luôn coi là đã gửi. */
  status?: MessageStatus;
}

/** Một cuộc trò chuyện 1-1 gắn với 1 tin đăng. */
export interface Conversation {
  id: string;
  listing: ConversationListing;
  otherUser: ChatParticipant;
  lastMessage?: ChatMessage;
  unreadCount: number;
  /** ISO 8601 — thời điểm tin nhắn cuối, dùng để sắp xếp danh sách. */
  updatedAt: string;
}
