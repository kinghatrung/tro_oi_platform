'use client';

import clsx from 'clsx';
import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Radio, Select } from 'antd';
import { LayoutGrid } from 'lucide-react';

import {
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_CONDITION_OPTIONS,
  PRODUCT_PRICE_RANGES,
  PRODUCT_SORT_OPTIONS,
} from '@/lib/constants/constantsProduct';

const ALL_OPTION = { value: '', label: 'Tất cả' };
const CATEGORY_ITEMS = [
  { ...ALL_OPTION, icon: <LayoutGrid size={26} /> },
  ...PRODUCT_CATEGORY_OPTIONS,
];
const CONDITION_OPTIONS = [ALL_OPTION, ...PRODUCT_CONDITION_OPTIONS];
const PRICE_OPTIONS = [
  ALL_OPTION,
  ...PRODUCT_PRICE_RANGES.map(({ key, label }) => ({ value: key, label })),
];
const SORT_OPTIONS = PRODUCT_SORT_OPTIONS.map(({ value, label }) => ({ value, label }));

/** Đổi 1 tham số trên URL và về trang 1. Giá trị rỗng = bỏ lọc. */
function useUpdateParam() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return useCallback(
    (key: string, value?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete('page');
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams],
  );
}

/** Hàng danh mục icon tròn ngay dưới ô tìm kiếm. */
export function MarketplaceCategories() {
  const updateParam = useUpdateParam();
  const category = useSearchParams().get('category') ?? '';

  return (
    <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
      {CATEGORY_ITEMS.map((item) => {
        const isSelected = category === item.value;
        return (
          <button
            key={item.value || 'all'}
            type="button"
            aria-pressed={isSelected}
            onClick={() => updateParam('category', item.value)}
            className="group flex cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-1"
          >
            <span
              className={clsx(
                'flex size-16 items-center justify-center rounded-full transition-colors',
                isSelected
                  ? 'bg-brand text-white'
                  : 'bg-surface text-brand shadow-sm group-hover:bg-brand-soft',
              )}
            >
              {item.icon}
            </span>
            <span
              className={clsx(
                'text-center text-sm leading-tight',
                isSelected ? 'font-bold text-brand' : 'font-medium text-ink',
              )}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Cột lọc bên trái: tình trạng, khoảng giá. */
export function MarketplaceFilters() {
  const updateParam = useUpdateParam();
  const searchParams = useSearchParams();

  return (
    <aside className="rounded-lg bg-surface p-4 lg:sticky lg:top-4">
      <p className="mb-2 font-bold text-ink">Tình trạng</p>
      <Radio.Group
        vertical
        options={CONDITION_OPTIONS}
        value={searchParams.get('condition') ?? ''}
        onChange={(event) => updateParam('condition', event.target.value)}
      />
      <p className="mt-5 mb-2 font-bold text-ink">Khoảng giá</p>
      <Radio.Group
        vertical
        options={PRICE_OPTIONS}
        value={searchParams.get('price') ?? ''}
        onChange={(event) => updateParam('price', event.target.value)}
      />
    </aside>
  );
}

/** Dropdown sắp xếp phía trên lưới sản phẩm. */
export function MarketplaceSort() {
  const updateParam = useUpdateParam();
  const sort = useSearchParams().get('sort') ?? PRODUCT_SORT_OPTIONS[0].value;

  return (
    <Select
      aria-label="Sắp xếp"
      className="min-w-40"
      options={SORT_OPTIONS}
      value={sort}
      onChange={(value) =>
        updateParam('sort', value === PRODUCT_SORT_OPTIONS[0].value ? null : value)
      }
    />
  );
}
