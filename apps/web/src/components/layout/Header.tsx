'use client';

import Link from 'next/link';
import { Button, Flex, Space, Dropdown, type MenuProps } from 'antd';
import { Heart, Bell, MessageCircle, Menu, UserRound, ChevronDown } from 'lucide-react';

function Header() {
  const items: MenuProps['items'] = [
    {
      key: 'profile',
      label: 'Trang cá nhân',
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
            <Button icon={<Menu size={20} />} />
          </Dropdown>
          <Link href="/">
            <Button>
              <img className="w-20 h-20 object-contain" src="/images/tro-oi-logo.svg" />
            </Button>
          </Link>
        </Space>
        <Space>
          <Button icon={<Heart size={20} />} />
          <Button icon={<Bell size={20} />} />
          <Button icon={<MessageCircle size={16} />}>Liên hệ</Button>
          <Link href="/dang-nhap">
            <Button>Đăng nhập</Button>
          </Link>
          <Button type="primary">Đăng tin</Button>
          <Button>
            <UserRound size={20} />
            <ChevronDown />
          </Button>
        </Space>
      </Flex>
    </header>
  );
}

export default Header;
