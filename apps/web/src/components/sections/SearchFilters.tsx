import { Card, Space, Button, Flex, type MenuProps } from 'antd';
import { Bookmark, ListFilter } from 'lucide-react';

import { ButtonDropdown } from '@/components/common';

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

export function SearchFilters() {
  return (
    <Card variant="borderless">
      <Flex gap={8} vertical>
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
              menus={items}
              size="small"
              dropdown
              label="Cho thuê"
              className="rounded-2xl! btn-gray"
            />

            <ButtonDropdown
              size="small"
              dropdown
              label="Loại hình"
              className="rounded-2xl! btn-gray"
            />

            <ButtonDropdown
              size="small"
              dropdown
              label="Giá bán"
              className="rounded-2xl! btn-gray"
            />

            <ButtonDropdown
              size="small"
              dropdown
              label="Đăng bởi"
              className="rounded-2xl! btn-gray"
            />
          </Space>
          <p className="text-sm text-[#222] font-bold">Xóa lọc</p>
        </Flex>
      </Flex>
    </Card>
  );
}
