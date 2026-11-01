'use client';

import { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, Menu, type MenuProps } from 'antd';

import { SELLER_MENU } from './const';

/** Menu điều hướng Kênh người đăng, highlight theo URL hiện tại. */
export function SellerSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const items = useMemo<MenuProps['items']>(
    () => SELLER_MENU.map(({ key, label, icon }) => ({ key, label, icon })),
    [],
  );

  return (
    <Card variant="borderless" classNames={{ body: 'p-2!' }} className="lg:sticky lg:top-4">
      <p className="text-primary px-4 pt-2 pb-3">Kênh người đăng</p>
      <Menu
        mode="inline"
        className="border-e-0!"
        items={items}
        selectedKeys={[pathname]}
        onClick={({ key }) => router.push(key)}
      />
    </Card>
  );
}
