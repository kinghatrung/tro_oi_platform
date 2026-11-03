'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flex, Input, Button, Space } from 'antd';
import { Search, ChevronDown, MapPin } from 'lucide-react';

import { AreaPicker } from '@/components/common';

export interface SearchInputProps {
  /** Trang nhận kết quả tìm kiếm. */
  basePath?: string;
  placeholder?: string;
  submitLabel?: string;
}

/** Ô tìm kiếm trên banner: từ khoá + khu vực → basePath, giữ các bộ lọc đang chọn. */
export function SearchInput({
  basePath = '/tim-kiem',
  placeholder = 'Tìm trọ theo tên đường, khu vực...',
  submitLabel = 'Tìm trọ',
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (keyword.trim()) params.set('keyword', keyword.trim());
    else params.delete('keyword');
    params.delete('page');
    router.push(`${basePath}?${params.toString()}`);
  }, [basePath, keyword, router, searchParams]);

  return (
    <div className="bg-surface rounded-2xl shadow-md px-6 py-3 h-18">
      <Flex gap={4} align="center" className="h-full">
        <Search size={24} />
        <Input
          aria-label="Từ khoá tìm kiếm"
          placeholder={placeholder}
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          onPressEnter={handleSearch}
          className="text-[16px]! outline-0! border-0! flex-1 border-none! shadow-none! focus-visible:outline-none!"
        />
        <Space size={12}>
          <AreaPicker basePath={basePath} keepParams>
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
            {submitLabel}
          </Button>
        </Space>
      </Flex>
    </div>
  );
}
