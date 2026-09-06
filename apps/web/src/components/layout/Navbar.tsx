'use client';

import Link from 'next/link';
import { Button, Flex, Space, Dropdown, Divider, type MenuProps } from 'antd';
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
  UsersRound,
  Bookmark,
  Clock3,
  Star,
  Settings,
} from 'lucide-react';

function Navbar() {
  const items: MenuProps['items'] = [
    {
      key: 'boarding-room',
      label: <span className="ml-2 font-semibold">Phòng trọ</span>,
      icon: <BedDouble size={24} />,
    },
    {
      key: 'apartment',
      label: <span className="ml-2 font-semibold">Căn hộ</span>,
      icon: <Building2 size={24} />,
    },
    {
      key: 'whole-house',
      label: <span className="ml-2 font-semibold">Nguyên căn</span>,
      icon: <House size={24} />,
    },
    {
      key: 'roommate',
      label: <span className="ml-2 font-semibold">Tìm người ở ghép</span>,
      icon: <UsersRound size={24} />,
    },
  ];

  const menus: MenuProps['items'] = [
    {
      key: 'saved',
      label: <span className="ml-2 text-[#595959] text-[16px] font-bold">Tin đã lưu</span>,
      icon: <Heart fill="#595959" color="#595959" size={20} />,
    },
    {
      key: 'search',
      label: <span className="ml-2 text-[#595959] text-[16px] font-bold">Tìm kiếm đã lưu</span>,
      icon: <Bookmark fill="#595959" color="#595959" size={20} />,
    },
    {
      key: 'history',
      label: <span className="ml-2 text-[#595959] text-[16px] font-bold">Lịch sử xem tin</span>,
      icon: <Clock3 fill="#595959" color="#595959" size={20} />,
    },
    {
      key: 'for-me',
      label: <span className="ml-2 text-[#595959] text-[16px] font-bold">Đánh giá từ tôi</span>,
      icon: <Star fill="#595959" color="#595959" size={20} />,
    },
    {
      key: 'settings',
      label: <span className="ml-2 text-[#595959] text-[16px] font-bold">Đăng xuất</span>,
      icon: <Settings fill="#595959" color="#595959" size={20} />,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full bg-transparent">
      <Flex align="center" justify="space-between" className="py-3! h-18 px-6!">
        <Space>
          <Dropdown
            menu={{ items }}
            trigger={['click']}
            placement="bottomLeft"
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
          <Dropdown
            menu={{ items: menus }}
            trigger={['click']}
            placement="bottomRight"
            popupRender={(menu) => (
              <div className="bg-[#f7f7f7] rounded-lg shadow-md w-100 p-4 border-4 border-white">
                <div className="bg-white p-4 rounded-lg">
                  <Flex vertical gap={16}>
                    <div>
                      <p className="text-[#222] font-bold text-lg">Mua thì hời, bán thì lời</p>
                      <p className="text-[#8c8c8c] font-medium text-[16px]">Đăng nhập cái đã!</p>
                    </div>

                    <Flex gap={12}>
                      <Link href="/dang-nhap" className="w-full">
                        <Button className="rounded-md! w-full! h-10! text-[16px]!">
                          Tạo tài khoản
                        </Button>
                      </Link>
                      <Link href="/dang-nhap" className="w-full">
                        <Button className="rounded-md! w-full! h-10! text-[16px]!" type="primary">
                          Đăng nhập
                        </Button>
                      </Link>
                    </Flex>
                  </Flex>
                </div>

                <div className="pt-3 pb-2 pl-2">
                  <span className="text-[#8c8c8c] font-bold">Tiện ích</span>
                </div>
                {menu}
              </div>
            )}
          >
            <Button>
              <UserRound size={20} />
              <ChevronDown />
            </Button>
          </Dropdown>
        </Space>
      </Flex>
    </nav>
  );
}

export default Navbar;
