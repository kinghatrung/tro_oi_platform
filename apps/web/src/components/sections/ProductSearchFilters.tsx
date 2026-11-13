'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, Flex, Space, type MenuProps } from 'antd';
import { ListFilter } from 'lucide-react';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CONDITION_LABELS,
  type ProductCategory,
  type ProductCondition,
} from '@tro-oi/shared';

import { ButtonDropdown, CardDropdown } from '@/components/common';
import { PRODUCT_CONDITION_OPTIONS, PRODUCT_PRICE_RANGES } from '@/lib/constants/constantsProduct';
import { formatVietnamDate } from '@/utils/helpers';

import { CategoryStrip, PRODUCT_CATEGORY_ITEMS } from './CategoryStrip';

const toMenu = (options: readonly { value: string; label: string }[]): MenuProps['items'] =>
  options.map(({ value, label }) => ({ key: value, label }));

const CATEGORY_MENU = toMenu(
  Object.entries(PRODUCT_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
);
const CONDITION_MENU = toMenu(PRODUCT_CONDITION_OPTIONS);
const PRICE_MENU = PRODUCT_PRICE_RANGES.map(({ key, label }) => ({ key, label }));

/** Bộ lọc chọn trong dropdown, chỉ đẩy lên URL khi bấm "Áp dụng" / "Lọc" (như /tim-kiem). */
const FILTER_KEYS = ['category', 'condition', 'price'] as const;
type FilterState = Record<(typeof FILTER_KEYS)[number], string>;
const EMPTY_FILTERS = Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])) as FilterState;
const readFilters = (params: URLSearchParams) =>
  Object.fromEntries(FILTER_KEYS.map((key) => [key, params.get(key) ?? ''])) as FilterState;

/** Tiêu đề, vd "Đồ cũ nội thất Cầu Giấy, Hà Nội tháng 11/2026" / "Kết quả cho “tủ lạnh”…". */
function buildTitle(params: URLSearchParams) {
  const category = params.get('category') as ProductCategory | null;
  const area = [params.get('ward'), params.get('city')].filter(Boolean).join(', ') || 'toàn quốc';
  // Theo giờ VN: server (UTC) và trình duyệt cùng ra 1 tháng → không lệch khi hydrate
  const [, month, year] = formatVietnamDate(Date.now()).split('/');
  const subject = [
    'Đồ cũ',
    category && PRODUCT_CATEGORY_LABELS[category]?.toLowerCase(),
    area,
    `tháng ${month}/${year}`,
  ]
    .filter(Boolean)
    .join(' ');
  const keyword = params.get('keyword');
  return keyword ? `Kết quả cho “${keyword}” · ${subject}` : subject;
}

/** Thanh lọc trang /cho-oi/tim-kiem: danh mục, tình trạng, giá + dải danh mục icon (sắp xếp ở ProductResultsList). */
export function ProductSearchFilters() {
  const serializedParams = useSearchParams().toString();
  return <ProductFiltersForm key={serializedParams} serializedParams={serializedParams} />;
}

function ProductFiltersForm({ serializedParams }: { serializedParams: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = new URLSearchParams(serializedParams);
  const [filters, setFilters] = useState<FilterState>(() => readFilters(params));

  /** Đẩy bộ lọc lên URL (giữ sắp xếp, từ khoá, khu vực), về trang 1. */
  const navigate = (next: FilterState) => {
    const query = new URLSearchParams(serializedParams);
    FILTER_KEYS.forEach((key) => (next[key] ? query.set(key, next[key]) : query.delete(key)));
    query.delete('page');
    const search = query.toString();
    router.push(search ? `${pathname}?${search}` : pathname);
  };

  const pick = (key: keyof FilterState) => (value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const dropdown = (
    key: keyof FilterState,
    title: string,
    menu: MenuProps['items'],
    label: string | undefined,
  ) => (
    <ButtonDropdown
      keepOpenOnSelect
      size="small"
      dropdown
      label={label ?? title}
      className="rounded-2xl! btn-gray"
      menus={menu}
      selectedKeys={filters[key] ? [filters[key]] : []}
      onMenuClick={({ key: value }) => pick(key)(value)}
      popupRender={(content) => (
        <CardDropdown
          title={title}
          menu={content}
          footer="both"
          onClear={() => pick(key)('')}
          onApply={() => navigate(filters)}
          onClick={(event) => event.stopPropagation()}
        />
      )}
    />
  );

  return (
    <Card variant="borderless">
      <Flex gap={16} vertical>
        <h1 className="text-primary text-[16px]! first-letter:uppercase">{buildTitle(params)}</h1>

        <Flex align="center" justify="space-between" wrap gap={8}>
          <Space wrap>
            <Button
              size="small"
              className="rounded-2xl! btn-gray"
              icon={<ListFilter size={16} strokeWidth={2.5} />}
              onClick={() => navigate(filters)}
            >
              Lọc
            </Button>
            {dropdown(
              'category',
              'Danh mục',
              CATEGORY_MENU,
              PRODUCT_CATEGORY_LABELS[filters.category as ProductCategory],
            )}
            {dropdown(
              'condition',
              'Tình trạng',
              CONDITION_MENU,
              PRODUCT_CONDITION_LABELS[filters.condition as ProductCondition],
            )}
            {dropdown(
              'price',
              'Khoảng giá',
              PRICE_MENU,
              PRODUCT_PRICE_RANGES.find(({ key }) => key === filters.price)?.label,
            )}
          </Space>
          <Button
            type="link"
            className="text-sm! text-ink! font-bold!"
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              navigate(EMPTY_FILTERS);
            }}
          >
            Xóa lọc
          </Button>
        </Flex>

        <CategoryStrip items={PRODUCT_CATEGORY_ITEMS} className="bg-transparent p-0!" />
      </Flex>
    </Card>
  );
}
