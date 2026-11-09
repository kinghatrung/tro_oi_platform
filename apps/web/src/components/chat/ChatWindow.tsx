'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Fragment, useEffect, useRef } from 'react';
import { Alert, Avatar, Button, Divider, Flex } from 'antd';
import { ChevronLeft, UserRound } from 'lucide-react';
import {
  ChatTargetType,
  USER_ROLE_LABELS,
  type ChatMessage,
  type Conversation,
  type ConversationListing,
} from '@tro-oi/shared';

import { EmptyState, EmptyVariant } from '@/components/common';
import { NO_IMAGE } from '@/constants';
import { formatListingPrice, formatVietnameseCurrency } from '@/utils/helpers';

import { ChatComposer } from './ChatComposer';
import { MessageBubble } from './MessageBubble';

const isProduct = (item: ConversationListing) => item.type === ChatTargetType.PRODUCT;

const targetHref = (item: ConversationListing) =>
  isProduct(item) ? `/cho-oi/${item.id}` : `/phong-tro/${item.id}`;

const targetPrice = (item: ConversationListing) => {
  if (isProduct(item) || !item.transaction) {
    return item.price === 0 ? 'Cho tặng' : formatVietnameseCurrency(item.price);
  }
  return formatListingPrice(item.price, item.transaction);
};

interface ChatWindowProps {
  conversation?: Conversation;
  messages: ChatMessage[];
  currentUserId: string;
  isConnected: boolean;
  onSend: (content: string) => void;
  /** Mobile: quay lại danh sách cuộc trò chuyện. */
  onBack?: () => void;
  /** Gợi ý câu hỏi khi chưa có tin nhắn. */
  quickQuestions?: string[];
  /** Nội dung điền sẵn vào ô soạn tin. */
  draft?: string;
}

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' });

/** Khung chat bên phải: người nhận, tin đăng liên quan, danh sách tin nhắn, ô soạn. */
export function ChatWindow({
  conversation,
  messages,
  currentUserId,
  isConnected,
  onSend,
  onBack,
  quickQuestions = [],
  draft,
}: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Luôn cuộn tới tin mới nhất
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, conversation?.id]);

  if (!conversation) {
    return (
      <Flex align="center" justify="center" className="h-full">
        <EmptyState
          variant={EmptyVariant.CHAT}
          description="Chọn một cuộc trò chuyện, hoặc bấm “Chat” ở trang tin đăng để bắt đầu."
        />
      </Flex>
    );
  }

  const { otherUser, listing } = conversation;

  return (
    <Flex vertical className="h-full">
      {/* Người nhận */}
      <Flex align="center" gap={12} className="border-b border-line px-3 py-2">
        {onBack && (
          <Button
            type="text"
            aria-label="Quay lại"
            icon={<ChevronLeft size={20} />}
            onClick={onBack}
            className="md:hidden!"
          />
        )}
        <Link href={`/nguoi-dung/${otherUser.id}`} className="flex items-center gap-3">
          <Avatar size={40} src={otherUser.avatar} icon={<UserRound size={20} />} />
          <div>
            <p className="font-semibold text-ink">{otherUser.name}</p>
            {otherUser.role && (
              <p className="text-xs text-subtle">{USER_ROLE_LABELS[otherUser.role]}</p>
            )}
          </div>
        </Link>
      </Flex>

      {/* Tin đăng đang trao đổi */}
      <Link
        href={listing.id ? targetHref(listing) : '#'}
        className="flex items-center gap-3 border-b border-line bg-soft px-3 py-2"
      >
        <div className="relative h-10 w-12 shrink-0 overflow-hidden rounded">
          <Image
            src={listing.image || NO_IMAGE}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{listing.title}</p>
          <p className="text-sm font-semibold text-price">{listing.id && targetPrice(listing)}</p>
        </div>
      </Link>

      {!isConnected && (
        <Alert
          banner
          type="warning"
          title="Mất kết nối máy chủ chat — đang thử kết nối lại, tin gửi lúc này có thể thất bại."
        />
      )}

      {/* Danh sách tin nhắn */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {messages.length === 0 ? (
          <Flex vertical align="center" gap={12} className="mt-6">
            <p className="text-sm text-subtle">Gửi câu hỏi cho {otherUser.name}</p>
            <Flex wrap gap={8} justify="center">
              {quickQuestions.map((question) => (
                <Button key={question} shape="round" onClick={() => onSend(question)}>
                  {question}
                </Button>
              ))}
            </Flex>
          </Flex>
        ) : (
          <Flex vertical gap={8}>
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const isNewDay =
                !previous || dayLabel(previous.createdAt) !== dayLabel(message.createdAt);
              return (
                <Fragment key={message.id}>
                  {isNewDay && (
                    <Divider plain className="my-2! text-xs! text-subtle!">
                      {dayLabel(message.createdAt)}
                    </Divider>
                  )}
                  <MessageBubble message={message} isMine={message.senderId === currentUserId} />
                </Fragment>
              );
            })}
          </Flex>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatComposer key={conversation.id} onSend={onSend} initialValue={draft} />
    </Flex>
  );
}
