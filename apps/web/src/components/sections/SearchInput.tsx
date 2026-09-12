'use client';

import { Flex, Input, Button, Space, Dropdown, Divider, type MenuProps } from 'antd';
import { Search, ChevronDown, MapPin } from 'lucide-react';

import { FloatingInput } from '@/components/common';

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
          className="text-[16px]! outline-0! border-0! flex-1 border-none! shadow-none! focus:border-none! focus:shadow-none! focus-visible:outline-none!"
        />
        <Space size={12}>
          <Dropdown
            trigger={['click']}
            placement="bottomLeft"
            popupRender={() => (
              <div
                className="bg-white rounded-lg shadow-md w-90"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-3 font-bold text-[16px] text-center">Khu vục</div>
                <Divider className="my-0!" />
                <div className="p-3 flex flex-col gap-3">
                  <FloatingInput title="Chọn tỉnh thành" className="h-12! px-4! border-2!" />
                  <FloatingInput title="Chọn quận huyện" className="h-12! px-4! border-2!" />
                  <FloatingInput title="Chọn phường/xã" className="h-12! px-4! border-2!" />
                </div>
                <Divider className="my-0!" />
                <Flex gap={12} className="p-3!">
                  <Button className="rounded-md! w-full! h-10! text-[16px]!"> Xóa lọc </Button>
                  <Button className="rounded-md! w-full! h-10! text-[16px]!" type="primary">
                    Áp dụng
                  </Button>
                </Flex>
              </div>
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
