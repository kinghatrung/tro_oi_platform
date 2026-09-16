'use client';

import { Flex, Input, Button, Space, Dropdown, type MenuProps } from 'antd';
import { Search, ChevronDown, MapPin } from 'lucide-react';

import { FloatingInput, CardDropdown } from '@/components/common';

/**
 * Search input component with location dropdown filter.
 * Allows users to search for properties and filter by province, district, and ward.
 */
export function SearchInput() {
  return (
    <div className="bg-white rounded-2xl shadow-md px-6 py-3 h-18">
      <Flex gap={4} align="center" className="h-full">
        <Search size={24} />
        <Input
          placeholder="Tìm trọ..."
          className="text-[16px]! outline-0! border-0! flex-1 border-none! shadow-none! focus-visible:outline-none!"
        />
        <Space size={12}>
          <Dropdown
            trigger={['click']}
            placement="bottomLeft"
            popupRender={() => (
              <CardDropdown title="Khu vực" footer="both" onClick={(e) => e.stopPropagation()}>
                <FloatingInput title="Chọn tỉnh thành" className="h-12! px-4!" />
                <FloatingInput title="Chọn quận huyện" className="h-12! px-4!" />
                <FloatingInput title="Chọn phường/xã" className="h-12! px-4!" />
              </CardDropdown>
            )}
          >
            <Button className="rounded-md! h-12! text-[16px]! font-medium!">
              <Space size={8} align="center">
                <MapPin size={18} />
                Hà Nội
                <ChevronDown size={18} />
              </Space>
            </Button>
          </Dropdown>
          <Button type="primary" className="rounded-md! h-12! text-[16px]!">
            Tìm trọ
          </Button>
        </Space>
      </Flex>
    </div>
  );
}
