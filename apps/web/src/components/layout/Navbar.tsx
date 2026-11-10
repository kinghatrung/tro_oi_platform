'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Avatar, Button, Flex, type MenuProps } from 'antd';
import {
  Bell,
  Heart,
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
  Plus,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { PropertyCategory, TransactionType, UserRole } from '@tro-oi/shared';

import { useSiteSettings } from '@/app/providers';
import { ButtonDropdown, CardDropdown, AreaPicker, ThemeToggle } from '@/components/common';
import { useAuthStore } from '@/stores/useAuthStore';

import { MessagesButton } from './MessagesButton';
import { NotificationBell } from './NotificationBell';

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

/** Màn < lg không có cặp chữ "Trọ ơi! / Chợ ơi!" → vào Chợ ơi từ menu danh mục. */
const MARKETPLACE_MENU_ITEM = {
  key: '/cho-oi',
  label: <span className="ml-2 font-semibold">Chợ ơi – pass đồ</span>,
  icon: <ShoppingBag size={24} />,
};

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
  {
    key: '/thong-bao',
    label: menuLabel('Thông báo'),
    icon: <Bell size={20} />,
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
  const postLabel = isHousingSection ? 'Đăng tin' : 'Đăng bán';
  const categoryMenu = settings.enableMarketplace
    ? [...CATEGORY_MENU!, MARKETPLACE_MENU_ITEM]
    : CATEGORY_MENU;

  const handleCategoryClick = useCallback<NonNullable<MenuProps['onClick']>>(
    ({ key }) => {
      if (key.startsWith('/')) return router.push(key);
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
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- cố ý tải lại toàn trang
      window.location.assign('/');
    },
    [logout, router],
  );

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  return (
    <nav className="static top-0 z-50 w-full bg-transparent">
      {/* Màn hẹp ẩn bớt nút (đều có lối khác: menu danh mục / tài khoản, ô khu vực trong thanh tìm kiếm) */}
      <Flex
        align="center"
        justify="space-between"
        gap={6}
        className="py-3! h-18 px-2! sm:px-3! md:px-6!"
      >
        {/* Dropdown danh mục */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ButtonDropdown
            aria-label="Danh mục"
            menus={categoryMenu}
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
          <div className="hidden lg:block">
            <Suspense fallback={AREA_BUTTON('Chọn khu vực')}>
              <AreaPicker basePath={isHousingSection ? '/tim-kiem' : '/cho-oi'}>
                {AREA_BUTTON}
              </AreaPicker>
            </Suspense>
          </div>
        </div>

        <Flex gap={32} align="center" className="hidden! lg:flex!">
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
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <Link href="/yeu-thich" aria-label="Tin đã lưu" className="hidden sm:block">
            <Button icon={<Heart size={20} />} />
          </Link>
          {user && (
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
          )}
          <MessagesButton isLoggedIn={Boolean(user)} />
          {!user && (
            <Link href="/dang-nhap" className="hidden sm:block">
              <Button>Đăng nhập</Button>
            </Link>
          )}
          <Link href={postHref}>
            {/* 2 bản (icon / chữ) bật tắt bằng CSS: nút chỉ-icon của antd mới gọn 40px */}
            <Button
              type="primary"
              aria-label={postLabel}
              icon={<Plus size={18} />}
              className="sm:hidden!"
            />
            <Button type="primary" className="hidden! sm:inline-flex!">
              {postLabel}
            </Button>
          </Link>
          <ButtonDropdown
            aria-label="Tài khoản"
            iconRight={<ChevronDown size={16} className="hidden sm:block" />}
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
        </div>
      </Flex>
    </nav>
  );
}

export default Navbar;
