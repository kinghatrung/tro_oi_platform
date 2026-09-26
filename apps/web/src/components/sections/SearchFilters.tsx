'use client';

import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { parsePriceRange, searchQueryKey } from '@/lib/searchFilters';

import { Card, Space, Button, Flex, type MenuProps } from 'antd';
import { Bookmark, ListFilter, BedDouble } from 'lucide-react';

import { ButtonDropdown, CardDropdown, FloatingInput } from '@/components/common';

const categories = [
  {
    key: 'phong-tro',
    label: 'Phòng trọ',
    icon: '/images/01-duplex.svg',
  },
  {
    key: 'can-ho',
    label: 'Căn hộ',
    icon: '/images/02-apartment.svg',
  },
  {
    key: 'nguyen-can',
    label: 'Nguyên căn',
    icon: '/images/03-house.svg',
  },
  {
    key: 'o-ghep',
    label: 'Tìm người ở ghép',
    icon: '/images/04-family-roof.svg',
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

const propertyTypeItems: MenuProps['items'] = categories.map(({ key, label }) => ({ key, label }));

interface FilterState {
  transaction: string;
  category: string;
  minPrice: string;
  maxPrice: string;
}

const readFilters = (params: URLSearchParams): FilterState => ({
  transaction: params.get('transaction') ?? '',
  category: params.get('category') ?? '',
  minPrice: params.get('minPrice') ?? '',
  maxPrice: params.get('maxPrice') ?? '',
});

export function SearchFilters() {
  const serializedParams = useSearchParams().toString();
  const [savedQuery, setSavedQuery] = useState<string | null>(null);
  const queryKey = searchQueryKey(new URLSearchParams(serializedParams));

  return (
    <SearchFiltersForm
      key={serializedParams}
      serializedParams={serializedParams}
      saved={savedQuery === queryKey}
      onSavedChange={setSavedQuery}
    />
  );
}

interface SearchFiltersFormProps {
  serializedParams: string;
  saved: boolean;
  onSavedChange: (query: string) => void;
}

function SearchFiltersForm({ serializedParams, saved, onSavedChange }: SearchFiltersFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState<FilterState>(() =>
    readFilters(new URLSearchParams(serializedParams)),
  );

  const [priceError, setPriceError] = useState(false);

  const navigateWithFilters = (nextFilters: FilterState) => {
    const { valid } = parsePriceRange(nextFilters.minPrice, nextFilters.maxPrice);
    setPriceError(!valid);
    if (!valid) return null;
    const params = new URLSearchParams(serializedParams);

    (Object.entries(nextFilters) as [keyof FilterState, string][]).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.delete('page');

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
    return params;
  };

  const clearAllFilters = () => {
    const cleared = { transaction: '', category: '', minPrice: '', maxPrice: '' };
    setFilters(cleared);
    navigateWithFilters(cleared);
  };

  const saveSearch = () => {
    const params = navigateWithFilters(filters);
    if (params) onSavedChange(searchQueryKey(params));
  };

  return (
    <Card variant="borderless">
      <Flex gap={16} vertical>
        {priceError && (
          <p role="alert" className="text-red-600">
            Khoảng giá không hợp lệ. Vui lòng nhập số không âm và giá tối đa không nhỏ hơn giá tối
            thiểu.
          </p>
        )}
        <Space size={20}>
          <p className="text-primary text-[16px]!">
            Mua Bán Bất Động Sản Hà Nội Tháng 09/2026 Giá Rẻ
          </p>
          <Button
            size="small"
            icon={<Bookmark size={20} strokeWidth={2.2} />}
            className="rounded-2xl! font-bold!"
            onClick={saveSearch}
          >
            {saved ? 'Đã lưu tìm kiếm' : 'Lưu tìm kiếm'}
          </Button>
        </Space>

        <Flex align="center" justify="space-between">
          <Space>
            <Button
              size="small"
              className="rounded-2xl! btn-gray"
              icon={<ListFilter size={16} strokeWidth={2.5} />}
              onClick={() => navigateWithFilters(filters)}
            >
              Lọc
            </Button>

            <ButtonDropdown
              menus={itemsCate}
              size="small"
              dropdown
              label={
                filters.transaction
                  ? filters.transaction === 'buy-room'
                    ? 'Mua bán'
                    : 'Cho thuê'
                  : 'Giao dịch'
              }
              className="rounded-2xl! btn-gray"
              popupRender={(menu) => (
                <CardDropdown
                  title="Danh mục"
                  menu={menu}
                  footer="both"
                  onClear={() => setFilters((current) => ({ ...current, transaction: '' }))}
                  onApply={() => navigateWithFilters(filters)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              selectedKeys={filters.transaction ? [filters.transaction] : []}
              onMenuClick={({ key }) => setFilters((current) => ({ ...current, transaction: key }))}
            />

            <ButtonDropdown
              size="small"
              dropdown
              label={categories.find(({ key }) => key === filters.category)?.label ?? 'Loại hình'}
              className="rounded-2xl! btn-gray"
              popupRender={(menu) => (
                <CardDropdown
                  title="Loại hình bất động sản"
                  menu={menu}
                  footer="both"
                  onClear={() => setFilters((current) => ({ ...current, category: '' }))}
                  onApply={() => navigateWithFilters(filters)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              menus={propertyTypeItems}
              selectedKeys={filters.category ? [filters.category] : []}
              onMenuClick={({ key }) => setFilters((current) => ({ ...current, category: key }))}
            />

            <ButtonDropdown
              size="small"
              dropdown
              label="Giá bán"
              className="rounded-2xl! btn-gray"
              popupRender={() => (
                <CardDropdown
                  title="Khoảng giá"
                  footer="both"
                  onClear={() =>
                    setFilters((current) => ({ ...current, minPrice: '', maxPrice: '' }))
                  }
                  onApply={() => navigateWithFilters(filters)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <FloatingInput
                      title="Từ (triệu)"
                      className="h-10! px-3!"
                      value={filters.minPrice}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, minPrice: event.target.value }))
                      }
                    />
                    <span>-</span>
                    <FloatingInput
                      title="Đến (triệu)"
                      className="h-10! px-3!"
                      value={filters.maxPrice}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, maxPrice: event.target.value }))
                      }
                    />
                  </div>
                </CardDropdown>
              )}
            />
          </Space>
          <Button
            type="link"
            className="text-sm! text-[#222]! font-bold!"
            onClick={clearAllFilters}
          >
            Xóa lọc
          </Button>
        </Flex>

        <Flex align="start" gap={32}>
          {categories.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={filters.category === item.key}
              onClick={() => setFilters((current) => ({ ...current, category: item.key }))}
              className={`cursor-pointer max-w-21! rounded-lg border-0 bg-transparent p-1 ${
                filters.category === item.key ? 'ring-2 ring-[#16a6a3]' : ''
              }`}
            >
              <Space vertical align="center">
                <Image width={64} height={64} alt={item.label} src={item.icon} />
                <p className="text-[#595959] text-sm font-bold text-center">{item.label}</p>
              </Space>
            </button>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}
