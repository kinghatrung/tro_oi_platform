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
      {/* shortcut: ảnh bìa chung theo màu thương hiệu, thêm field coverUrl cho User khi cần ảnh bìa riêng */}
      <div className="h-40 w-full rounded-t-lg bg-linear-to-r from-[#087f83] via-[#16a6a3] to-[#d9f5f3]" />

      <div className="p-5 rounded-b-lg bg-white">
        <Flex gap={20}>
          <Avatar size={138} src={user.avatar} icon={<UserRound size={64} />} />

          <Flex vertical gap={12}>
            <Space size={12} align="center">
              <h1 className="text-primary text-2xl">{user.name}</h1>
              <span className="text-secondary">{USER_ROLE_LABELS[user.role]}</span>
            </Space>

            <Space>
              <Calendar size={20} className="text-[#595959]" />
              <p className="text-[16px] text-[#595959]">
                Tham gia {formatRelativeTime(user.createdAt)}
              </p>
            </Space>

            {user.bio && (
              <Space align="start">
                <Info size={20} className="text-[#595959]" />
                <p className="text-[16px] text-[#595959] whitespace-pre-line">{user.bio}</p>
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
