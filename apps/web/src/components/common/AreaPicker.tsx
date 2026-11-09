'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Dropdown, Select } from 'antd';

import { PROVINCES } from '@/constants';
import { useWards } from '@/hooks/useWards';

import { CardDropdown } from './CardDropdown';

interface AreaPickerProps {
  /** Nút mở popup; nhận tên khu vực đang chọn để hiển thị. */
  children: (label: string) => ReactNode;
  /** Giữ các filter khác trên URL hiện tại (dùng ở trang tìm kiếm). */
  keepParams?: boolean;
  /** Trang nhận kết quả. */
  basePath?: string;
}

const CITY_OPTIONS = PROVINCES.map((city) => ({ value: city, label: city }));

/** Popup chọn tỉnh/thành + phường/xã → điều hướng basePath?city=&ward=. */
export function AreaPicker({
  children,
  keepParams = false,
  basePath = '/tim-kiem',
}: AreaPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [city, setCity] = useState(searchParams.get('city') ?? undefined);
  const [ward, setWard] = useState(searchParams.get('ward') ?? undefined);
  const wards = useWards(city);
  const currentCity = searchParams.get('city');
  const label = currentCity
    ? [searchParams.get('ward'), currentCity].filter(Boolean).join(', ')
    : 'Toàn quốc';

  const handleApply = useCallback(() => {
    const params = new URLSearchParams(keepParams ? searchParams.toString() : '');
    if (city) params.set('city', city);
    else params.delete('city');
    if (city && ward) params.set('ward', ward);
    else params.delete('ward');
    params.delete('page');
    setIsOpen(false);
    router.push(`${basePath}?${params.toString()}`);
  }, [basePath, city, ward, keepParams, router, searchParams]);

  const handleClear = useCallback(() => {
    setCity(undefined);
    setWard(undefined);
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
            onChange={(next) => {
              setCity(next);
              setWard(undefined); // phường thuộc tỉnh cũ
            }}
          />
          {city && (
            <Select
              allowClear
              showSearch
              size="large"
              placeholder="Tất cả phường/xã"
              options={wards.map((item) => ({ value: item, label: item }))}
              loading={wards.length === 0}
              value={ward}
              onChange={setWard}
            />
          )}
        </CardDropdown>
      )}
    >
      {children(label)}
    </Dropdown>
  );
}
