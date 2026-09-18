import Link from 'next/link';
import Image from 'next/image';
import { Button, Flex, Space, type MenuProps } from 'antd';
import { FloatingInput, ButtonDropdown, CardDropdown } from '@/components/common';
import {
  Heart,
  Bell,
  MessageCircle,
  Menu,
  UserRound,
  BedDouble,
  Building2,
  House,
  UsersRound,
  Bookmark,
  Clock3,
  Star,
  Settings,
  MapPin,
} from 'lucide-react';

/**
 * Navigation bar component with dropdown menus for categories and user utilities.
 * Includes logo, menu items, notifications, and authentication buttons.
 */
function Navbar() {
  const items: MenuProps['items'] = [
    {
      key: 'buy-room',
      label: <span className="ml-2 font-semibold">Mua bán</span>,
      icon: <BedDouble size={24} />,
      children: [
        {
          key: 'apartment-buy',
          label: <span className="ml-2 font-semibold">Căn hộ</span>,
          icon: <Building2 size={24} />,
        },
        {
          key: 'whole-house',
          label: <span className="ml-2 font-semibold">Nguyên căn</span>,
          icon: <House size={24} />,
        },
      ],
    },
    {
      key: 'rent-room',
      label: <span className="ml-2 font-semibold">Cho thuê</span>,
      icon: <BedDouble size={24} />,
      children: [
        {
          key: 'boarding-room',
          label: <span className="ml-2 font-semibold">Phòng trọ</span>,
          icon: <BedDouble size={24} />,
        },
        {
          key: 'apartment-rent',
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
      ],
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
    <nav className="static top-0 z-50 w-full bg-transparent">
      <Flex align="center" justify="space-between" className="py-3! h-18 px-6!">
        {/* Dropdown danh mục */}
        <Space align="center">
          <ButtonDropdown
            aria-label="Danh mục"
            menus={items}
            popupRender={(menu) => (
              <CardDropdown title="Danh mục" menu={menu} centerTitle={false} width={280} />
            )}
            iconButton={<Menu size={20} />}
          />

          <Link href="/">
            <Button>
              <Image
                width={80}
                height={20}
                alt="Logo"
                className="object-contain"
                src="/images/tro-oi-logo.svg"
              />
            </Button>
          </Link>

          <ButtonDropdown
            popupRender={() => (
              <CardDropdown title="Khu vực" footer="both" onClick={(e) => e.stopPropagation()}>
                <FloatingInput title="Chọn tỉnh thành" className="h-12! px-4!" />
                <FloatingInput title="Chọn quận huyện" className="h-12! px-4!" />
                <FloatingInput title="Chọn phường/xã" className="h-12! px-4!" />
              </CardDropdown>
            )}
            iconLeft={<MapPin size={24} fill="#16a6a3" color="#fff" />}
            label="Chọn khu vực"
            dropdown
          />
        </Space>

        {/* Dropdown người dùng */}
        <Space>
          <Button icon={<Heart size={20} />} />
          <Button icon={<Bell size={20} />} />
          <Button icon={<MessageCircle size={16} />}>Liên hệ</Button>
          <Link href="/dang-nhap">
            <Button>Đăng nhập</Button>
          </Link>
          <Button type="primary">Đăng tin</Button>
          <ButtonDropdown
            aria-label="Tài khoản"
            dropdown
            placement="bottomRight"
            menus={menus}
            iconLeft={<UserRound size={20} />}
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
          />
        </Space>
      </Flex>
    </nav>
  );
}

export default Navbar;
