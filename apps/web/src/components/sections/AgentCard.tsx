'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Space, Avatar, Button, Flex } from 'antd';
import { List, MessageCircle, PhoneCall, Star, UserRound } from 'lucide-react';
import { USER_ROLE_LABELS, type ListingAuthor, type ProductSeller } from '@tro-oi/shared';

import { getReviews } from '@/api/reviews';
import { RelativeTime } from '@/components/common';
import { formatNumber } from '@/utils/helpers';

/** SĐT dạng +84xxxxxxxxx → 0xxxxxxxxx để hiển thị/gọi. */
const toLocalPhone = (phone: string) => phone.replace(/^\+84/, '0');

interface AgentCardProps {
  /** Người đăng tin Trọ ơi hoặc người bán Chợ ơi. */
  author: ListingAuthor | ProductSeller;
  /** Có → hiện nút chat (chat hiện chỉ gắn với tin Trọ ơi). */
  chatHref?: string;
}

/** Thẻ người đăng: hồ sơ, hoạt động, nút liên hệ (chat, Zalo, gọi). */
export function AgentCard({ author, chatHref }: AgentCardProps) {
  const role = 'role' in author ? author.role : undefined;
  const listingCount = 'listingCount' in author ? author.listingCount : undefined;
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const phone = author.phone && toLocalPhone(author.phone);
  const [rating, setRating] = useState<{ average: number | null; total: number }>();

  // Điểm đánh giá: chỉ cần tổng hợp (pageSize 1), lỗi mạng → không hiện dòng sao
  useEffect(() => {
    let isCurrent = true;
    getReviews(author.id, 1, 1)
      .then((page) => isCurrent && setRating({ average: page.average, total: page.total }))
      .catch(() => undefined);
    return () => {
      isCurrent = false;
    };
  }, [author.id]);

  return (
    <section className="sticky top-4 rounded-lg bg-surface p-5">
      <Flex vertical gap={12}>
        <Link href={`/nguoi-dung/${author.id}`}>
          <Space>
            <Avatar size={48} src={author.avatar} icon={<UserRound />} />
            <Space vertical size={0}>
              <p className="text-primary text-[16px]">{author.name}</p>
              {role && <p className="text-secondary">{USER_ROLE_LABELS[role]}</p>}
            </Space>
          </Space>
        </Link>
        {rating && (
          <Link
            href={`/nguoi-dung/${author.id}#danh-gia`}
            className="flex items-center gap-1.5 text-body! hover:text-ink!"
          >
            {rating.total > 0 && rating.average !== null ? (
              <>
                <Star
                  size={16}
                  className="fill-[var(--status-warning)] text-[var(--status-warning)]"
                  aria-hidden
                />
                <b className="text-ink">{rating.average.toFixed(1)}</b>
                <span>· {formatNumber(rating.total)} đánh giá</span>
              </>
            ) : (
              <>
                <Star size={16} className="text-subtle" aria-hidden />
                <span>Chưa có đánh giá</span>
              </>
            )}
          </Link>
        )}
        <Flex align="center" gap={16} className="text-body! text-[16px]">
          {listingCount != null && (
            <Flex align="center" gap={4}>
              <List size={16} /> <span>{listingCount} tin đăng</span>
            </Flex>
          )}
          {author.joinedAt && (
            <span>
              Tham gia <RelativeTime date={author.joinedAt} />
            </span>
          )}
        </Flex>
        {chatHref && (
          <Link href={chatHref}>
            <Button block icon={<MessageCircle size={20} />} className="text-[16px]! font-bold!">
              Chat với người đăng
            </Button>
          </Link>
        )}
        {phone && (
          <Flex align="center" gap={8}>
            <a
              href={`https://zalo.me/${phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button className="w-full text-[16px]! text-ink! font-bold!">Zalo</Button>
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
