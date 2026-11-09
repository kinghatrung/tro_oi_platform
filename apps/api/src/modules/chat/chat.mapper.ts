import type { Types } from 'mongoose';

import type { UserDocument } from '../auth/schemas/user.schema.js';
import type { ConversationDocument } from './schemas/conversation.schema.js';
import type { MessageDocument } from './schemas/message.schema.js';

/** populate() cho mọi truy vấn conversation trả ra ngoài. */
export const CONVERSATION_POPULATE = [
  { path: 'target', select: 'title images price transaction' },
  { path: 'starter', select: 'name avatar role' },
  { path: 'owner', select: 'name avatar role' },
];

/** Ref đã populate hay chưa đều lấy được id dạng string. */
export const idOf = (ref: unknown) =>
  String((ref as { _id?: Types.ObjectId } | null)?._id ?? ref);

export const toMessage = (doc: MessageDocument) => ({
  id: doc.id as string,
  conversationId: idOf(doc.conversation),
  senderId: idOf(doc.sender),
  content: doc.content,
  createdAt: doc.createdAt.toISOString(),
});

interface PopulatedTarget {
  _id: Types.ObjectId;
  title: string;
  images?: string[];
  price: number;
  transaction?: string;
}

/** Conversation theo góc nhìn `viewerId`: otherUser = người còn lại, unreadCount của viewer. */
export function toConversation(doc: ConversationDocument, viewerId: string) {
  const isStarter = idOf(doc.starter) === viewerId;
  const other = (isStarter
    ? doc.owner
    : doc.starter) as unknown as UserDocument;
  // Tin / món đồ có thể đã bị xoá (populate trả null)
  const target = doc.target as unknown as PopulatedTarget | null;
  const last = doc.lastMessage;

  return {
    id: doc.id as string,
    listing: {
      type: doc.targetModel === 'Listing' ? 'listing' : 'product',
      id: target ? String(target._id) : '',
      title: target?.title ?? '(Tin đã bị xoá)',
      image: target?.images?.[0],
      price: target?.price ?? 0,
      transaction: target?.transaction,
    },
    otherUser: {
      id: idOf(other),
      name: other?.name ?? 'Người dùng',
      avatar: other?.avatar,
      role: other?.role,
    },
    lastMessage: last && {
      id: String(last.id),
      conversationId: doc.id as string,
      senderId: String(last.sender),
      content: last.content,
      createdAt: last.createdAt.toISOString(),
    },
    unreadCount: isStarter ? doc.unreadByStarter : doc.unreadByOwner,
    updatedAt: doc.updatedAt.toISOString(),
  };
}
