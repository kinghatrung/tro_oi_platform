'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Flex, Input, Button, Space } from 'antd';
import { ChevronDown, CircleX, Clock, MapPin, Search } from 'lucide-react';

import { AreaPicker, useIsClient } from '@/components/common';
import { readRecentSearches, recordSearch, removeRecentSearch } from '@/lib/viewHistory';

export interface SearchInputProps {
  /** Trang nhận kết quả tìm kiếm. */
  basePath?: string;
  placeholder?: string;
  submitLabel?: string;
}

/**
 * Ô tìm kiếm trên banner: từ khoá + khu vực → basePath, giữ các bộ lọc đang chọn.
 * Dưới ô: 3 từ khoá gần nhất (lưu trên trình duyệt, riêng theo basePath) — bấm để tìm lại.
 */
export function SearchInput({
  basePath = '/tim-kiem',
  placeholder = 'Tìm trọ theo tên đường, khu vực...',
  submitLabel = 'Tìm trọ',
}: SearchInputProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '');
  // Chỉ hiện sau hydrate (localStorage không có ở server) → HTML server / client khớp
  const isClient = useIsClient();
  const [recent, setRecent] = useState(() =>
    typeof window === 'undefined' ? [] : readRecentSearches(basePath),
  );

  const handleSearch = useCallback(
    (value = keyword) => {
      const term = value.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set('keyword', term);
        recordSearch(basePath, term);
        setRecent(readRecentSearches(basePath));
      } else {
        params.delete('keyword');
      }
      params.delete('page');
      router.push(`${basePath}?${params.toString()}`);
    },
    [basePath, keyword, router, searchParams],
  );

  const handleRecentClick = (term: string) => {
    setKeyword(term);
    handleSearch(term);
  };

  const handleRecentRemove = (term: string) => {
    removeRecentSearch(basePath, term);
    setRecent(readRecentSearches(basePath));
  };

  return (
    <div className="relative">
      <div className="bg-surface rounded-2xl shadow-md px-6 py-3 h-18">
        <Flex gap={4} align="center" className="h-full">
          <Search size={24} />
          <Input
            aria-label="Từ khoá tìm kiếm"
            placeholder={placeholder}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => handleSearch()}
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
            <Button
              type="primary"
              className="rounded-md! h-12! text-[16px]!"
              onClick={() => handleSearch()}
            >
              {submitLabel}
            </Button>
          </Space>
        </Flex>
      </div>
      {/* absolute: không đẩy ô tìm kiếm (Header đặt ô vắt ngang mép banner) — trang chừa pt-22 bên dưới */}
      {isClient && recent.length > 0 && (
        <ul
          aria-label="Tìm kiếm gần đây"
          className="absolute top-full left-0 mt-2 flex flex-wrap gap-2"
        >
          {recent.map((term) => (
            <li
              key={term}
              className="flex h-8 items-center gap-1 rounded-full border border-line bg-surface pr-1 pl-3 text-sm text-ink shadow-sm"
            >
              <button
                type="button"
                onClick={() => handleRecentClick(term)}
                className="flex max-w-48 cursor-pointer items-center gap-1.5"
              >
                <Clock size={14} className="shrink-0 text-subtle" aria-hidden />
                <span className="truncate">{term}</span>
              </button>
              <button
                type="button"
                aria-label={`Xoá "${term}" khỏi tìm kiếm gần đây`}
                onClick={() => handleRecentRemove(term)}
                className="flex size-6 cursor-pointer items-center justify-center rounded-full text-subtle hover:bg-soft hover:text-ink"
              >
                <CircleX size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
