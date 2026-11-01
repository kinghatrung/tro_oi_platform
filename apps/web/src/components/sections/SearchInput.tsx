'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flex, Input, Button, Space } from 'antd';
import { Search, ChevronDown, MapPin } from 'lucide-react';

import { AreaPicker } from '@/components/common';

/** Ô tìm kiếm trang chủ: từ khoá + khu vực → /tim-kiem. */
export function SearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (keyword.trim()) params.set('keyword', keyword.trim());
    router.push(`/tim-kiem?${params.toString()}`);
  }, [keyword, router]);

  return (
    <div className="bg-white rounded-2xl shadow-md px-6 py-3 h-18">
      <Flex gap={4} align="center" className="h-full">
        <Search size={24} />
        <Input
          aria-label="Từ khoá tìm kiếm"
          placeholder="Tìm trọ theo tên đường, khu vực..."
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onPressEnter={handleSearch}
          className="text-[16px]! outline-0! border-0! flex-1 border-none! shadow-none! focus-visible:outline-none!"
        />
        <Space size={12}>
          <AreaPicker>
            {(label) => (
              <Button className="rounded-md! h-12! text-[16px]! font-medium!">
                <Space size={8} align="center">
                  <MapPin size={18} />
                  {label}
                  <ChevronDown size={18} />
                </Space>
              </Button>
            )}
          </AreaPicker>
          <Button type="primary" className="rounded-md! h-12! text-[16px]!" onClick={handleSearch}>
            Tìm trọ
          </Button>
        </Space>
      </Flex>
    </div>
  );
}
