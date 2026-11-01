'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Space, Avatar, Button, Flex } from 'antd';
import { List, MessageCircle, PhoneCall, UserRound } from 'lucide-react';
import { USER_ROLE_LABELS, type ListingAuthor } from '@tro-oi/shared';

import { formatRelativeTime } from '@/utils/helpers';

/** SĐT dạng +84xxxxxxxxx → 0xxxxxxxxx để hiển thị/gọi. */
const toLocalPhone = (phone: string) => phone.replace(/^\+84/, '0');

interface AgentCardProps {
  author: ListingAuthor;
  /** Tin đang xem — mở chat gắn với tin này. */
  listingId: string;
}

/** Displays the listing agent's profile, activity, and contact actions. */
export function AgentCard({ author, listingId }: AgentCardProps) {
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const phone = author.phone && toLocalPhone(author.phone);

  return (
    <section className="sticky top-4 rounded-lg bg-white p-5">
      <Flex vertical gap={12}>
        <Link href={`/nguoi-dung/${author.id}`}>
          <Space>
            <Avatar size={48} src={author.avatar} icon={<UserRound />} />
            <Space vertical size={0}>
              <p className="text-primary text-[16px]">{author.name}</p>
              {author.role && <p className="text-secondary">{USER_ROLE_LABELS[author.role]}</p>}
            </Space>
          </Space>
        </Link>
        <Flex align="center" gap={16} className="text-[#595959]! text-[16px]">
          {author.listingCount != null && (
            <Flex align="center" gap={4}>
              <List size={16} /> <span>{author.listingCount} tin đăng</span>
            </Flex>
          )}
          {author.joinedAt && <span>Tham gia {formatRelativeTime(author.joinedAt)}</span>}
        </Flex>
        <Link href={`/tin-nhan?listingId=${listingId}`}>
          <Button block icon={<MessageCircle size={20} />} className="text-[16px]! font-bold!">
            Chat với người đăng
          </Button>
        </Link>
        {phone && (
          <Flex align="center" gap={8}>
            <a
              href={`https://zalo.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full text-[16px]! text-[#222]! font-bold!">Zalo</Button>
            </a>
            {isPhoneVisible ? (
              <a href={`tel:${phone}`} className="w-full">
                <Button
                  icon={<PhoneCall size={20} />}
                  type="primary"
                  className="w-full font-bold! text-[16px]!"
                >
                  {phone}
                </Button>
              </a>
            ) : (
              <Button
                icon={<PhoneCall size={20} />}
                type="primary"
                className="w-full font-bold! text-[16px]!"
                onClick={() => setIsPhoneVisible(true)}
              >
                Hiện số {phone.slice(0, -3)}***
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </section>
  );
}
