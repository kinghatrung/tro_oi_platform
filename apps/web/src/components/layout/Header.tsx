'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button, Flex, Space, Dropdown, type MenuProps } from 'antd';
import { Heart, Bell, MessageCircle, Menu, UserRound, ChevronDown } from 'lucide-react';

function Header() {
  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: <Link href="/ca-nhan">Trang cá nhân</Link>,
    },
    {
      key: 'settings',
      label: 'Cài đặt',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <Flex align="center" justify="space-between" className="py-3! h-18 px-6!">
        <Space>
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button aria-label="Menu" icon={<Menu size={20} />} />
          </Dropdown>
          <Button aria-label="Trọ ơi!">
            <Image
              width={80}
              height={80}
              alt="Logo Trọ ơi!"
              className="w-20 h-20 object-contain"
              src="/images/tro-oi-logo.svg"
            />
          </Button>
        </Space>
        <Space>
          <Button aria-label="Tin yêu thích" icon={<Heart size={20} />} />
          <Button aria-label="Thông báo" icon={<Bell size={20} />} />
          <Button icon={<MessageCircle size={16} />}>Liên hệ</Button>
          <Link
            href="/dang-nhap"
            className="inline-flex h-8 items-center rounded-md border border-[#d9d9d9] bg-white px-4 text-sm text-[#222] hover:border-[#16a6a3] hover:text-[#16a6a3]"
          >
            Đăng nhập
          </Link>
          <Button type="primary">Đăng tin</Button>
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <Button aria-label="Tài khoản">
              <UserRound size={20} />
              <ChevronDown />
            </Button>
          </Dropdown>
        </Space>
      </Flex>
    </header>
  );
}

export default Header;
