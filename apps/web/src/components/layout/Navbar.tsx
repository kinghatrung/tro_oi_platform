'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Button, Flex, Space, type MenuProps } from 'antd';
import {
  Heart,
  MessageCircle,
  Menu,
  UserRound,
  BedDouble,
  Building2,
  House,
  UsersRound,
  LogOut,
  MapPin,
  ChevronDown,
  FilePlus2,
  LayoutDashboard,
  ShieldCheck,
} from 'lucide-react';
import { PropertyCategory, TransactionType, UserRole } from '@tro-oi/shared';

import { useSiteSettings } from '@/app/providers';
import { ButtonDropdown, CardDropdown, AreaPicker, ThemeToggle } from '@/components/common';
import { useAuthStore } from '@/stores/useAuthStore';

const CATEGORY_ICONS: Record<PropertyCategory, React.ReactNode> = {
  [PropertyCategory.ROOM]: <BedDouble size={24} />,
  [PropertyCategory.APARTMENT]: <Building2 size={24} />,
  [PropertyCategory.WHOLE_HOUSE]: <House size={24} />,
  [PropertyCategory.ROOMMATE]: <UsersRound size={24} />,
};

const categoryItem = (transaction: TransactionType, category: PropertyCategory, label: string) => ({
  key: `${transaction}|${category}`,
  label: <span className="ml-2 font-semibold">{label}</span>,
  icon: CATEGORY_ICONS[category],
});

const CATEGORY_MENU: MenuProps['items'] = [
  {
    key: TransactionType.RENT,
    label: <span className="ml-2 font-semibold">Cho thuê</span>,
    icon: <BedDouble size={24} />,
    children: [
      categoryItem(TransactionType.RENT, PropertyCategory.ROOM, 'Phòng trọ'),
      categoryItem(TransactionType.RENT, PropertyCategory.APARTMENT, 'Căn hộ'),
      categoryItem(TransactionType.RENT, PropertyCategory.WHOLE_HOUSE, 'Nguyên căn'),
      categoryItem(TransactionType.RENT, PropertyCategory.ROOMMATE, 'Tìm người ở ghép'),
    ],
  },
  {
    key: TransactionType.BUY,
    label: <span className="ml-2 font-semibold">Mua bán</span>,
    icon: <Building2 size={24} />,
    children: [
      categoryItem(TransactionType.BUY, PropertyCategory.APARTMENT, 'Căn hộ'),
      categoryItem(TransactionType.BUY, PropertyCategory.WHOLE_HOUSE, 'Nguyên căn'),
    ],
  },
];

const menuLabel = (text: string) => (
  <span className="ml-2 text-body text-[16px] font-bold">{text}</span>
);

const USER_MENU: MenuProps['items'] = [
  {
    key: '/ca-nhan',
    label: menuLabel('Trang cá nhân'),
    icon: <UserRound size={20} />,
  },
  {
    key: '/kenh-nguoi-dang',
    label: menuLabel('Kênh người đăng'),
    icon: <LayoutDashboard size={20} />,
  },
  {
    key: '/dang-tin',
    label: menuLabel('Đăng tin mới'),
    icon: <FilePlus2 size={20} />,
  },
  {
    key: '/yeu-thich',
    label: menuLabel('Tin đã lưu'),
    icon: <Heart fill="currentColor" size={20} />,
  },
  { key: 'logout', label: menuLabel('Đăng xuất'), icon: <LogOut size={20} /> },
];

const ADMIN_MENU_ITEM = {
  key: '/quan-tri',
  label: menuLabel('Trang quản trị'),
  icon: <ShieldCheck size={20} />,
};

const AREA_BUTTON = (label: string) => (
  <Button>
    <span className="inline-flex items-center gap-1.5">
      <MapPin size={24} fill="var(--brand)" color="var(--surface)" />
      <span className="text-[16px] text-ink">{label}</span>
      <ChevronDown size={16} />
    </span>
  </Button>
);

/**
 * Navigation bar component with dropdown menus for categories and user utilities.
 * Tải phiên đăng nhập (user + tin đã lưu) khi mount.
 */
function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const loadSession = useAuthStore((state) => state.loadSession);
  const logout = useAuthStore((state) => state.logout);
  const settings = useSiteSettings();
  const isHousingSection = !pathname.startsWith('/cho-oi');
  const userMenu = user?.role === UserRole.ADMIN ? [ADMIN_MENU_ITEM, ...USER_MENU!] : USER_MENU;
  const postHref = isHousingSection ? '/dang-tin' : '/cho-oi/dang-ban';

  const handleCategoryClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      const [transaction, category] = key.split('|');
      router.push(`/tim-kiem?${new URLSearchParams({ transaction, category })}`);
    },
    [router],
  );

  const handleUserMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      if (key !== 'logout') {
        router.push(key);
        return;
      }
      logout();
      // reload toàn trang: xoá state client và tránh trang private tự redirect sang /dang-nhap
      window.location.assign('/');
    },
    [logout, router],
  );

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  return (
    <nav className="static top-0 z-50 w-full bg-transparent">
      <Flex align="center" justify="space-between" className="py-3! h-18 px-6!">
        {/* Dropdown danh mục */}
        <Space align="center">
          <ButtonDropdown
            aria-label="Danh mục"
            menus={CATEGORY_MENU}
            onMenuClick={handleCategoryClick}
            popupRender={(menu) => (
              <CardDropdown title="Danh mục" menu={menu} centerTitle={false} width={280} />
            )}
            iconButton={<Menu size={20} />}
          />

          <Link href="/" aria-label="Trang chủ Trọ ơi">
            <Button>
              <Image
                width={80}
                height={20}
                alt={settings.siteName}
                className="brand-art object-contain"
                src={settings.logoUrl}
              />
            </Button>
          </Link>

          {/* useSearchParams trong AreaPicker cần Suspense để trang tĩnh build được */}
          <Suspense fallback={AREA_BUTTON('Chọn khu vực')}>
            <AreaPicker basePath={isHousingSection ? '/tim-kiem' : '/cho-oi'}>
              {AREA_BUTTON}
            </AreaPicker>
          </Suspense>
        </Space>

        <Flex gap={32} align="center">
          <Link
            href="/"
            className={`text-[16px] font-bold tracking-tight transition-all text-ink ${
              isHousingSection ? 'opacity-100' : 'opacity-40 hover:opacity-70'
            }`}
          >
            Trọ ơi!
          </Link>

          {settings.enableMarketplace && (
            <Link
              href="/cho-oi"
              className={`text-[16px] font-bold tracking-tight transition-all text-ink ${
                isHousingSection ? 'opacity-40 hover:opacity-70' : 'opacity-100'
              }`}
            >
              Chợ ơi!
            </Link>
          )}
        </Flex>

        {/* Dropdown người dùng */}
        <Space>
          <ThemeToggle />
          <Link href="/yeu-thich" aria-label="Tin đã lưu">
            <Button icon={<Heart size={20} />} />
          </Link>
          <Link href="/tin-nhan">
            <Button icon={<MessageCircle size={16} />}>Tin nhắn</Button>
          </Link>
          {!user && (
            <Link href="/dang-nhap">
              <Button>Đăng nhập</Button>
            </Link>
          )}
          <Link href={postHref}>
            <Button type="primary">{isHousingSection ? 'Đăng tin' : 'Đăng bán'}</Button>
          </Link>
          <ButtonDropdown
            aria-label="Tài khoản"
            dropdown
            placement="bottomRight"
            menus={user ? userMenu : undefined}
            onMenuClick={handleUserMenuClick}
            iconLeft={
              user ? (
                <Avatar size={24} src={user.avatar}>
                  {user.name.charAt(0)}
                </Avatar>
              ) : (
                <UserRound size={20} />
              )
            }
            popupRender={(menu) => (
              <div className="bg-soft rounded-lg shadow-md w-100 p-4 border-4 border-white">
                <div className="bg-surface p-4 rounded-lg">
                  {user ? (
                    <Flex align="center" gap={12}>
                      <Avatar size={48} src={user.avatar}>
                        {user.name.charAt(0)}
                      </Avatar>
                      <div>
                        <p className="text-ink font-bold text-lg">{user.name}</p>
                        <p className="text-subtle font-medium">{user.phone}</p>
                      </div>
                    </Flex>
                  ) : (
                    <Flex vertical gap={16}>
                      <div>
                        <p className="text-ink font-bold text-lg">Tìm trọ nhanh, ở trọ vui</p>
                        <p className="text-subtle font-medium text-[16px]">Đăng nhập cái đã!</p>
                      </div>

                      <Link href="/dang-nhap" className="w-full">
                        <Button className="rounded-md! w-full! h-10! text-[16px]!" type="primary">
                          Đăng nhập / Đăng ký
                        </Button>
                      </Link>
                    </Flex>
                  )}
                </div>

                {user && (
                  <>
                    <div className="pt-3 pb-2 pl-2">
                      <span className="text-subtle font-bold">Tiện ích</span>
                    </div>
                    {menu}
                  </>
                )}
              </div>
            )}
          />
        </Space>
      </Flex>
    </nav>
  );
}

export default Navbar;
