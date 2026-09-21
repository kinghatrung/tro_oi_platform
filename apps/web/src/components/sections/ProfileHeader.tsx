'use client';

import Image from 'next/image';
import { Button, Avatar, Flex, Space } from 'antd';
import { Calendar, MapPin, Settings, Camera } from 'lucide-react';

interface ProfileHeaderProps {
  readOnly?: boolean;
  name?: string;
  avatarUrl?: string;
  coverUrl?: string;
  joinedDays?: number;
  location?: string;
  onEditProfile?: () => void;
  onShareProfile?: () => void;
  onChangeCover?: () => void;
  onChangeAvatar?: () => void;
}

export function ProfileHeader({
  readOnly = false,
  name = 'Minh Huyên',
  avatarUrl = 'https://i.pinimg.com/736x/b1/08/c3/b108c3ad91d76667c45f8b01ff1ad250.jpg',
  coverUrl = '/images/developer.png',
  joinedDays = 13,
  location = 'Chưa cung cấp',
  onEditProfile,
  onShareProfile,
  onChangeCover,
  onChangeAvatar,
}: ProfileHeaderProps) {
  return (
    <>
      <div className="relative h-[200px] w-full">
        <Image src={coverUrl} alt="Ảnh bìa" fill className="object-cover rounded-t-lg" />
        {!readOnly && onChangeCover && (
          <Button
            size="small"
            onClick={onChangeCover}
            className="absolute! right-3 bottom-3 text-[#222]! font-bold!"
          >
            Thay đổi ảnh bìa
          </Button>
        )}
      </div>

      <div className="p-5 rounded-b-lg bg-white">
        <Flex gap={20}>
          <div className="relative!">
            <Avatar size={138} src={avatarUrl} />
            {!readOnly && onChangeAvatar && (
              <Button
                aria-label="Thay đổi ảnh đại diện"
                className="absolute! bottom-0 right-0 rounded-lg!"
                shape="square"
                icon={<Camera />}
                onClick={onChangeAvatar}
              />
            )}
          </div>

          <Flex vertical gap={12}>
            <p className="text-primary text-2xl">{name}</p>

            <Space>
              <Calendar size={20} className="text-[#595959]" />
              <p className="text-[16px] text-[#595959]">Đã tham gia: {joinedDays} ngày</p>
            </Space>

            <Space size={16}>
              <Space>
                <MapPin size={20} className="text-[#595959]" />
                <p className="text-[16px] text-[#595959]">{location}</p>
              </Space>

              {!readOnly && onEditProfile && (
                <Button size="small" icon={<Settings size={20} />} onClick={onEditProfile}>
                  Chỉnh sửa trang
                </Button>
              )}

              {!readOnly && onShareProfile && (
                <Button size="small" onClick={onShareProfile}>
                  Chia sẻ
                </Button>
              )}
            </Space>
          </Flex>
        </Flex>
      </div>
    </>
  );
}
