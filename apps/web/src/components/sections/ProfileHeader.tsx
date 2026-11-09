import Image from 'next/image';
import { Button, Avatar, Flex, Space } from 'antd';
import { Calendar, Settings, UserRound, Info } from 'lucide-react';
import { USER_ROLE_LABELS, type User } from '@tro-oi/shared';

import { formatRelativeTime } from '@/utils/helpers';

interface ProfileHeaderProps {
  user: User;
  /** Có callback → hiện nút "Chỉnh sửa trang" (hồ sơ của chính mình). */
  onEditProfile?: () => void;
}

/** Ảnh bìa + avatar + thông tin cơ bản của người dùng. */
export function ProfileHeader({ user, onEditProfile }: ProfileHeaderProps) {
  return (
    <>
      {/* Chưa có ảnh bìa → dải màu thương hiệu */}
      <div className="relative h-40 w-full overflow-hidden rounded-t-lg bg-linear-to-r from-brand-dark via-brand to-[#d9f5f3] md:h-56">
        {user.coverImage && (
          <Image
            src={user.coverImage}
            alt=""
            fill
            priority
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover"
          />
        )}
      </div>

      <div className="p-5 rounded-b-lg bg-surface">
        <Flex gap={20}>
          <Avatar size={138} src={user.avatar} icon={<UserRound size={64} />} />

          <Flex vertical gap={12}>
            <Space size={12} align="center">
              <h1 className="text-primary text-2xl">{user.name}</h1>
              <span className="text-secondary">{USER_ROLE_LABELS[user.role]}</span>
            </Space>

            <Space>
              <Calendar size={20} className="text-body" />
              <p className="text-[16px] text-body">Tham gia {formatRelativeTime(user.createdAt)}</p>
            </Space>

            {user.bio && (
              <Space align="start">
                <Info size={20} className="text-body" />
                <p className="text-[16px] text-body whitespace-pre-line">{user.bio}</p>
              </Space>
            )}

            {onEditProfile && (
              <Button
                size="small"
                icon={<Settings size={20} />}
                onClick={onEditProfile}
                className="w-fit"
              >
                Chỉnh sửa trang
              </Button>
            )}
          </Flex>
        </Flex>
      </div>
    </>
  );
}
