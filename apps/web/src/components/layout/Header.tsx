"use client";

import Link from "next/link";
import { Button, Flex, Space, Dropdown, Divider, type MenuProps } from "antd";
import {
  Heart,
  Bell,
  MessageCircle,
  Menu,
  UserRound,
  ChevronDown,
  BedDouble,
  Building2,
  House,
  Store,
  UsersRound,
} from "lucide-react";

function Header() {
  const items: MenuProps["items"] = [
    {
      key: "boarding-room",
      label: <span className="ml-2">Phòng trọ</span>,
      icon: <BedDouble size={24} />,
    },
    {
      key: "apartment",
      label: <span className="ml-2">Căn hộ</span>,
      icon: <Building2 size={24} />,
    },
    {
      key: "whole-house",
      label: <span className="ml-2">Nguyên căn</span>,
      icon: <House size={24} />,
    },
    {
      key: "premises",
      label: <span className="ml-2">Mặt bằng</span>,
      icon: <Store size={24} />,
    },
    {
      key: "roommate",
      label: <span className="ml-2">Tìm người ở ghép</span>,
      icon: <UsersRound size={24} />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-transparent">
      <Flex align="center" justify="space-between" className="py-3! h-18 px-6!">
        <Space>
          <Dropdown
            menu={{ items }}
            trigger={["click"]}
            placement="bottomRight"
            popupRender={(menu) => (
              <div className="bg-white rounded-lg shadow-md w-70">
                <div className="p-3 font-bold text-[16px]">Danh mục</div>
                <Divider className="my-0!" />
                {menu}
              </div>
            )}
          >
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
