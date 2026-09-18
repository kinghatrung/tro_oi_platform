'use client';

import { useState } from 'react';
import { Flex, Switch, Dropdown, type MenuProps } from 'antd';
import { ChevronDown, List, LayoutGrid } from 'lucide-react';
import clsx from 'clsx';

interface SearchHeaderToolbarProps {
  onTabChange?: (tabKey: string) => void;
  onVideoOnlyChange?: (checked: boolean) => void;
  onSortChange?: (sortKey: string) => void;
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

const sortItems: MenuProps['items'] = [
  { key: 'newest', label: 'Tin mới nhất' },
  { key: 'price-asc', label: 'Giá thấp đến cao' },
  { key: 'price-desc', label: 'Giá cao đến thấp' },
  { key: 'area-desc', label: 'Diện tích lớn nhất' },
];

const tabOptions = [
  { key: 'all', label: 'Tất cả' },
  { key: 'personal', label: 'Cá nhân' },
  { key: 'broker', label: 'Môi giới' },
];

export function SearchHeaderToolbar({
  onTabChange,
  onVideoOnlyChange,
  onSortChange,
  onViewModeChange,
}: SearchHeaderToolbarProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [sortLabel, setSortLabel] = useState('Tin mới nhất');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    onTabChange?.(key);
  };

  const handleSortMenuClick: MenuProps['onClick'] = (e) => {
    const selectedItem = sortItems.find((item) => item?.key === e.key);
    if (selectedItem && 'label' in selectedItem) {
      setSortLabel(selectedItem.label as string);
    }
    onSortChange?.(e.key);
  };

  const handleViewModeChange = (mode: 'list' | 'grid') => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  return (
    <div className="bg-white rounded-t-xl border-b border-[#f0f0f0] px-4 py-2 select-none">
      <Flex align="center" justify="space-between" className="flex-wrap gap-y-2">
        {/* Left: Tab filters */}
        <Flex gap={24} align="center" className="h-10">
          {tabOptions.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabClick(tab.key)}
                className={clsx(
                  'relative h-full text-sm font-semibold transition-colors cursor-pointer border-none bg-transparent p-0',
                  isActive ? 'text-[#222]' : 'text-[#595959] hover:text-[#222]',
                )}
              >
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f0325e] rounded-t-sm" />
                )}
              </button>
            );
          })}
        </Flex>

        {/* Right options: Video toggle, Sort, View mode toggle */}
        <Flex align="center" gap={16} className="h-10">
          {/* Tin có video */}
          <Flex align="center" gap={8} className="cursor-pointer">
            <span className="text-xs md:text-sm font-medium text-[#222]">Tin có video</span>
            <Switch size="small" onChange={onVideoOnlyChange} className="bg-[#d9d9d9]" />
          </Flex>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-[#e8e8e8]" />

          {/* Sort dropdown */}
          <Dropdown menu={{ items: sortItems, onClick: handleSortMenuClick }} trigger={['click']}>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-[#222] hover:text-[#f0325e] transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              <span>{sortLabel}</span>
              <ChevronDown size={16} className="text-[#595959]" />
            </button>
          </Dropdown>

          {/* Divider */}
          <div className="h-4 w-[1px] bg-[#e8e8e8]" />

          {/* View mode toggle (List / Grid) */}
          <div className="flex align-center bg-[#f4f4f4] rounded-full p-1 gap-1">
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              className={clsx(
                'flex items-center justify-center size-7 rounded-full transition-all cursor-pointer border-none p-0',
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-[#222]'
                  : 'text-[#8c8c8c] hover:text-[#222] bg-transparent',
              )}
            >
              <List size={18} />
            </button>

            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              className={clsx(
                'flex items-center justify-center size-7 rounded-full transition-all cursor-pointer border-none p-0',
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-[#222]'
                  : 'text-[#8c8c8c] hover:text-[#222] bg-transparent',
              )}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </Flex>
      </Flex>
    </div>
  );
}
