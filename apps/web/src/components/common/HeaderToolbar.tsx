'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import { Flex, Dropdown, type MenuProps } from 'antd';
import { ChevronDown, List, LayoutGrid } from 'lucide-react';

import { SORT_OPTIONS } from '@/constants';

export type ViewMode = 'list' | 'grid';

interface HeaderToolbarProps {
  sortKey: string;
  onSortChange: (sortKey: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  /** Nội dung bên trái, vd tổng số tin. */
  extra?: React.ReactNode;
}

const sortItems: MenuProps['items'] = SORT_OPTIONS.map(({ key, label }) => ({ key, label }));

/** Thanh công cụ danh sách: sắp xếp + chuyển dạng list/grid. */
export function HeaderToolbar({
  sortKey,
  onSortChange,
  viewMode,
  onViewModeChange,
  extra,
}: HeaderToolbarProps) {
  const sortLabel = SORT_OPTIONS.find(({ key }) => key === sortKey)?.label ?? SORT_OPTIONS[0].label;
  const sortMenu = useMemo<MenuProps>(
    () => ({
      items: sortItems,
      selectedKeys: [sortKey],
      onClick: ({ key }) => onSortChange(key),
    }),
    [onSortChange, sortKey],
  );

  return (
    <div className="bg-white rounded-t-xl border-b border-[#f0f0f0] px-4 py-2 select-none">
      <Flex align="center" justify="space-between" className="flex-wrap gap-y-2">
        <div className="text-sm text-[#595959]">{extra}</div>

        <Flex align="center" gap={16} className="h-10">
          {/* Sort dropdown */}
          <Dropdown menu={sortMenu} trigger={['click']}>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-[#222] hover:text-[#f0325e] transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              <span>{sortLabel}</span>
              <ChevronDown size={16} className="text-[#595959]" />
            </button>
          </Dropdown>

          {/* Divider */}
          <div className="h-4 w-px bg-[#e8e8e8]" />

          {/* View mode toggle (List / Grid) */}
          <div className="flex align-center bg-[#f4f4f4] rounded-full p-1 gap-1">
            {(['list', 'grid'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                aria-label={mode === 'list' ? 'Dạng danh sách' : 'Dạng lưới'}
                aria-pressed={viewMode === mode}
                onClick={() => onViewModeChange(mode)}
                className={clsx(
                  'flex items-center justify-center size-7 rounded-full transition-all cursor-pointer border-none p-0',
                  viewMode === mode
                    ? 'bg-white shadow-sm text-[#222]'
                    : 'text-[#8c8c8c] hover:text-[#222] bg-transparent',
                )}
              >
                {mode === 'list' ? <List size={18} /> : <LayoutGrid size={18} />}
              </button>
            ))}
          </div>
        </Flex>
      </Flex>
    </div>
  );
}
