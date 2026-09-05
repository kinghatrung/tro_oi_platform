"use client";

import { Flex, Input, Button, Space } from "antd";
import { Search } from "lucide-react";

export function SearchInput() {
  return (
    <div className="bg-white rounded-2xl shadow-md px-6 py-3 h-18">
      <Flex gap={4} align="center" className="h-full">
        <Search size={24} />
        <Input
          placeholder="Tìm sản phẩm..."
          className="text-[16px]! outline-0! border-0! flex-1 border-none! shadow-none! focus:border-none! focus:shadow-none! focus-visible:outline-none!"
        />
        <Space>
          <Button>Hà Nội</Button>
          <Button>Hà Nội</Button>
        </Space>
      </Flex>
    </div>
  );
}
