'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Avatar, Badge, Empty, Flex, Input } from 'antd';
import { Search, UserRound } from 'lucide-react';
import type { Conversation } from '@tro-oi/shared';

import { formatRelativeTime } from '@/utils/helpers';

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  currentUserId: string;
  onSelect: (conversationId: string) => void;
}

/** Cột trái trang tin nhắn: tìm kiếm + danh sách cuộc trò chuyện. */
export function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
}: ConversationListProps) {
  const [keyword, setKeyword] = useState('');
  const visible = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    return conversations.filter(
      (item) =>
        item.otherUser.name.toLowerCase().includes(search) ||
        item.listing.title.toLowerCase().includes(search),
    );
  }, [conversations, keyword]);

  return (
    <Flex vertical className="h-full">
      <div className="border-b border-[#f0f0f0] p-3">
        <p className="mb-2 text-lg font-bold text-[#222]">Tin nhắn</p>
        <Input
          allowClear
          prefix={<Search size={16} className="text-[#8c8c8c]" />}
          placeholder="Tìm theo tên, tin đăng"
          onChange={(event) => setKeyword(event.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {visible.length === 0 ? (
          <Empty
            className="mt-10!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={keyword ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện'}
          />
        ) : (
          visible.map((item) => {
            const last = item.lastMessage;
            const isMine = last?.senderId === currentUserId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={clsx(
                  'flex w-full cursor-pointer items-center gap-3 border-0 px-3 py-3 text-left transition-colors',
                  item.id === activeId ? 'bg-[#eafbf9]' : 'bg-white hover:bg-[#f7f7f7]',
                )}
              >
                <Badge count={item.unreadCount} size="small">
                  <Avatar size={44} src={item.otherUser.avatar} icon={<UserRound size={22} />} />
                </Badge>
                <div className="min-w-0 flex-1">
                  <Flex justify="space-between" gap={8}>
                    <span className="truncate font-semibold text-[#222]">
                      {item.otherUser.name}
                    </span>
                    <span className="shrink-0 text-xs text-[#8c8c8c]">
                      {formatRelativeTime(item.updatedAt)}
                    </span>
                  </Flex>
                  <p className="truncate text-xs text-[#16a6a3]">{item.listing.title}</p>
                  <p
                    className={clsx(
                      'truncate text-sm',
                      item.unreadCount > 0 ? 'font-semibold text-[#222]' : 'text-[#8c8c8c]',
                    )}
                  >
                    {last ? `${isMine ? 'Bạn: ' : ''}${last.content}` : 'Bắt đầu trò chuyện'}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Flex>
  );
}
