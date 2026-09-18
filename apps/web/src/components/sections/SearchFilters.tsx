'use client';

import Image from 'next/image';

import { Card, Space, Button, Flex, type MenuProps } from 'antd';
import { Bookmark, ListFilter, BedDouble } from 'lucide-react';

import { ButtonDropdown, CardDropdown, FloatingInput } from '@/components/common';

const categories = [
  {
    label: 'Phòng trọ',
    icon: '/images/01-duplex.svg',
  },
  {
    label: 'Căn hộ',
    icon: '/images/02-apartment.svg',
  },
  {
    label: 'Nguyên căn',
    icon: '/images/03-house.svg',
  },
  {
    label: 'Tìm người ở ghép',
    icon: '/images/04-family-roof.svg',
  },
];

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

const itemsCate: MenuProps['items'] = [
  {
    key: 'buy-room',
    label: <span className="ml-2 font-semibold">Mua bán</span>,
    icon: <BedDouble size={24} />,
  },
  {
    key: 'rent-room',
    label: <span className="ml-2 font-semibold">Cho thuê</span>,
    icon: <BedDouble size={24} />,
  },
];

export function SearchFilters() {
  return (
    <Card variant="borderless">
      <Flex gap={16} vertical>
        <Space size={20}>
          <p className="text-primary text-[16px]!">
            Mua Bán Bất Động Sản Hà Nội Tháng 09/2026 Giá Rẻ
          </p>
          <Button
            size="small"
            icon={<Bookmark size={20} strokeWidth={2.2} />}
            className="rounded-2xl! font-bold!"
          >
            Lưu tìm kiếm
          </Button>
        </Space>

        <Flex align="center" justify="space-between">
          <Space>
            <Button
              size="small"
              className="rounded-2xl! btn-gray"
              icon={<ListFilter size={16} strokeWidth={2.5} />}
            >
              Lọc
            </Button>

            <ButtonDropdown
              menus={itemsCate}
              size="small"
              dropdown
              label="Cho thuê"
              className="rounded-2xl! btn-gray"
              popupRender={(menu) => (
                <CardDropdown
                  title="Danh mục"
                  menu={menu}
                  footer="clear"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            />

            <ButtonDropdown
              size="small"
              dropdown
              label="Loại hình"
              className="rounded-2xl! btn-gray"
              popupRender={(menu) => (
                <CardDropdown
                  title="Loại hình bất động sản"
                  menu={menu}
                  footer="clear"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              menus={[
                { key: 'phong-tro', label: 'Phòng trọ' },
                { key: 'can-ho', label: 'Căn hộ' },
                { key: 'nguyen-can', label: 'Nguyên căn' },
                { key: 'o-ghep', label: 'Tìm người ở ghép' },
              ]}
            />

            <ButtonDropdown
              size="small"
              dropdown
              label="Giá bán"
              className="rounded-2xl! btn-gray"
              popupRender={() => (
                <CardDropdown title="Khoảng giá" footer="both" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <FloatingInput title="Từ (triệu)" className="h-10! px-3!" />
                    <span>-</span>
                    <FloatingInput title="Đến (triệu)" className="h-10! px-3!" />
                  </div>
                </CardDropdown>
              )}
            />
          </Space>
          <Button type="link" className="text-sm! text-[#222]! font-bold!">
            Xóa lọc
          </Button>
        </Flex>

        <Flex align="start" gap={32}>
          {categories.map((item) => (
            <Space key={item.label} vertical align="center" className="cursor-pointer max-w-21!">
              <Image width={64} height={64} alt={item.label} src={item.icon} />
              <p className="text-[#595959] text-sm font-bold text-center">{item.label}</p>
            </Space>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}
