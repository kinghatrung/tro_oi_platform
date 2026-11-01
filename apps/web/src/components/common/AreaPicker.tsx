'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dropdown, Select } from 'antd';

import { CITIES } from '@/constants';

import { CardDropdown } from './CardDropdown';
import { FloatingInput } from './FloatingInput';

interface AreaPickerProps {
  /** Nút mở popup; nhận tên khu vực đang chọn để hiển thị. */
  children: (label: string) => ReactNode;
  /** Giữ các filter khác trên URL hiện tại (dùng ở trang tìm kiếm). */
  keepParams?: boolean;
}

const CITY_OPTIONS = CITIES.map((city) => ({ value: city, label: city }));

/** Popup chọn tỉnh/thành + quận → điều hướng /tim-kiem?city=&district=. */
export function AreaPicker({ children, keepParams = false }: AreaPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [city, setCity] = useState(searchParams.get('city') ?? undefined);
  const [district, setDistrict] = useState(searchParams.get('district') ?? '');
  const currentCity = searchParams.get('city');
  const label = currentCity
    ? [searchParams.get('district'), currentCity].filter(Boolean).join(', ')
    : 'Toàn quốc';

  const handleApply = useCallback(() => {
    const params = new URLSearchParams(keepParams ? searchParams.toString() : '');
    if (city) params.set('city', city);
    else params.delete('city');
    if (city && district.trim()) params.set('district', district.trim());
    else params.delete('district');
    params.delete('page');
    setIsOpen(false);
    router.push(`/tim-kiem?${params.toString()}`);
  }, [city, district, keepParams, router, searchParams]);

  const handleClear = useCallback(() => {
    setCity(undefined);
    setDistrict('');
  }, []);

  return (
    <Dropdown
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={['click']}
      placement="bottomLeft"
      popupRender={() => (
        <CardDropdown
          title="Khu vực"
          footer="both"
          onClear={handleClear}
          onApply={handleApply}
          onClick={(e) => e.stopPropagation()}
        >
          <Select
            allowClear
            showSearch
            size="large"
            placeholder="Chọn tỉnh thành"
            options={CITY_OPTIONS}
            value={city}
            onChange={setCity}
            getPopupContainer={(node) => node.parentElement ?? document.body}
          />
          {city && (
            <FloatingInput
              title="Quận/huyện"
              className="h-12! px-4!"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
            />
          )}
        </CardDropdown>
      )}
    >
      {children(label)}
    </Dropdown>
  );
}
