'use client';

import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Card, Space, Button, Flex, type MenuProps } from 'antd';
import { Bookmark, ListFilter, BedDouble, Building2 } from 'lucide-react';
import {
  PROPERTY_CATEGORY_LABELS,
  TRANSACTION_TYPE_LABELS,
  TransactionType,
  type PropertyCategory,
} from '@tro-oi/shared';

import { ButtonDropdown, CardDropdown, FloatingInput } from '@/components/common';
import { CATEGORIES } from '@/constants';
import { parsePriceRange, searchQueryKey } from '@/lib/searchFilters';

const transactionItems: MenuProps['items'] = [
  {
    key: TransactionType.RENT,
    label: (
      <span className="ml-2 font-semibold">{TRANSACTION_TYPE_LABELS[TransactionType.RENT]}</span>
    ),
    icon: <BedDouble size={24} />,
  },
  {
    key: TransactionType.BUY,
    label: (
      <span className="ml-2 font-semibold">{TRANSACTION_TYPE_LABELS[TransactionType.BUY]}</span>
    ),
    icon: <Building2 size={24} />,
  },
];

const propertyTypeItems: MenuProps['items'] = CATEGORIES.map(({ category, title }) => ({
  key: category,
  label: title,
}));

const BEDROOM_ITEMS: MenuProps['items'] = [1, 2, 3, 4].map((count) => ({
  key: String(count),
  label: `Từ ${count} phòng ngủ`,
}));

const FILTER_KEYS = [
  'transaction',
  'category',
  'minPrice',
  'maxPrice',
  'minArea',
  'maxArea',
  'bedrooms',
] as const;

/** Giá trị bộ lọc dạng chuỗi, đồng bộ 1-1 với query string. */
type FilterState = Record<(typeof FILTER_KEYS)[number], string>;

const EMPTY_FILTERS = Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])) as FilterState;

const readFilters = (params: URLSearchParams) =>
  Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) ?? ''])) as FilterState;

/** Tiêu đề trang theo bộ lọc, vd "Cho thuê Phòng trọ Hà Nội tháng 11/2026". */
function buildTitle(params: URLSearchParams) {
  const transaction = params.get('transaction') as TransactionType | null;
  const category = params.get('category') as PropertyCategory | null;
  const now = new Date();
  return [
    (transaction && TRANSACTION_TYPE_LABELS[transaction]) || 'Cho thuê & mua bán',
    (category && PROPERTY_CATEGORY_LABELS[category]) || 'nhà ở',
    [params.get('district'), params.get('city')].filter(Boolean).join(', ') || 'toàn quốc',
    `tháng ${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`,
  ].join(' ');
}

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
    setFilters(EMPTY_FILTERS);
    navigateWithFilters(EMPTY_FILTERS);
  };

  // shortcut: chỉ ghi nhớ trong phiên hiện tại, cần API "tìm kiếm đã lưu" để lưu lâu dài
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
          <h1 className="text-primary text-[16px]! first-letter:uppercase">
            {buildTitle(new URLSearchParams(serializedParams))}
          </h1>
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
              menus={transactionItems}
              size="small"
              dropdown
              label={TRANSACTION_TYPE_LABELS[filters.transaction as TransactionType] ?? 'Giao dịch'}
              className="rounded-2xl! btn-gray"
              popupRender={(menu) => (
                <CardDropdown
                  title="Hình thức"
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
              label={PROPERTY_CATEGORY_LABELS[filters.category as PropertyCategory] ?? 'Loại hình'}
              className="rounded-2xl! btn-gray"
              popupRender={(menu) => (
                <CardDropdown
                  title="Loại hình"
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
              label={
                filters.minPrice || filters.maxPrice
                  ? `${filters.minPrice || 0} - ${filters.maxPrice || '∞'} triệu`
                  : 'Khoảng giá'
              }
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

            <ButtonDropdown
              size="small"
              dropdown
              label={
                filters.minArea || filters.maxArea
                  ? `${filters.minArea || 0} - ${filters.maxArea || '∞'} m²`
                  : 'Diện tích'
              }
              className="rounded-2xl! btn-gray"
              popupRender={() => (
                <CardDropdown
                  title="Diện tích (m²)"
                  footer="both"
                  onClear={() =>
                    setFilters((current) => ({ ...current, minArea: '', maxArea: '' }))
                  }
                  onApply={() => navigateWithFilters(filters)}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <FloatingInput
                      title="Từ (m²)"
                      className="h-10! px-3!"
                      value={filters.minArea}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, minArea: event.target.value }))
                      }
                    />
                    <span>-</span>
                    <FloatingInput
                      title="Đến (m²)"
                      className="h-10! px-3!"
                      value={filters.maxArea}
                      onChange={(event) =>
                        setFilters((current) => ({ ...current, maxArea: event.target.value }))
                      }
                    />
                  </div>
                </CardDropdown>
              )}
            />

            <ButtonDropdown
              size="small"
              dropdown
              label={filters.bedrooms ? `${filters.bedrooms}+ PN` : 'Phòng ngủ'}
              className="rounded-2xl! btn-gray"
              menus={BEDROOM_ITEMS}
              selectedKeys={filters.bedrooms ? [filters.bedrooms] : []}
              onMenuClick={({ key }) => navigateWithFilters({ ...filters, bedrooms: key })}
              popupRender={(menu) => (
                <CardDropdown
                  title="Số phòng ngủ"
                  menu={menu}
                  footer="clear"
                  onClear={() => navigateWithFilters({ ...filters, bedrooms: '' })}
                  width={220}
                />
              )}
            />
          </Space>
          <Button type="link" className="text-sm! text-ink! font-bold!" onClick={clearAllFilters}>
            Xóa lọc
          </Button>
        </Flex>

        <Flex align="start" gap={32}>
          {CATEGORIES.map((item) => (
            <button
              key={item.category}
              type="button"
              aria-pressed={filters.category === item.category}
              onClick={() => navigateWithFilters({ ...filters, category: item.category })}
              className={`cursor-pointer max-w-21! rounded-lg border-0 bg-transparent p-1 ${
                filters.category === item.category ? 'ring-2 ring-brand' : ''
              }`}
            >
              <Space vertical align="center">
                <Image width={64} height={64} alt={item.title} src={item.icon} />
                <p className="text-body text-sm font-bold text-center">{item.title}</p>
              </Space>
            </button>
          ))}
        </Flex>
      </Flex>
    </Card>
  );
}
