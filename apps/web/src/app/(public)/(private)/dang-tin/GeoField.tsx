'use client';

import { useState } from 'react';
import { App, Button, Form } from 'antd';
import { MapPinOff, Search } from 'lucide-react';
import type { AddressInfo, GeoPoint } from '@tro-oi/shared';

import { VietnamMap } from '@/components/common';
import { geocodeAddress } from '@/lib/geocode';

/** Chính sách Nominatim: tối đa 1 yêu cầu/giây. */
const NOMINATIM_GAP_MS = 1100;

interface GeoFieldProps {
  value?: GeoPoint;
  onChange?: (value?: GeoPoint) => void;
}

/**
 * Control Form.Item cho address.geo: bấm/kéo ghim trên bản đồ, hoặc "Tìm theo địa chỉ"
 * (Nominatim) từ các ô địa chỉ cùng form rồi chỉnh lại ghim. Bỏ ghim → tin không có bản đồ.
 */
export function GeoField({ value, onChange }: GeoFieldProps) {
  const form = Form.useFormInstance<{ address?: AddressInfo }>();
  const { message } = App.useApp();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    const address = form.getFieldValue('address') as AddressInfo | undefined;
    if (!address?.city) {
      message.warning('Chọn tỉnh/thành phố trước');
      return;
    }
    const area = [address.ward, address.city].filter(Boolean).join(', ');
    setIsSearching(true);
    try {
      // OSM hay thiếu số nhà: thử đủ địa chỉ trước, không ra thì tìm theo phường/xã
      let point = address.street ? await geocodeAddress(`${address.street}, ${area}`) : null;
      if (!point) {
        if (address.street) await new Promise((resolve) => setTimeout(resolve, NOMINATIM_GAP_MS));
        point = await geocodeAddress(area);
      }
      if (point) {
        onChange?.(point);
        message.success('Đã đặt ghim gần địa chỉ — kéo ghim để chỉnh cho đúng vị trí');
      } else {
        message.warning('Không tìm thấy địa chỉ trên bản đồ, hãy bấm chọn trực tiếp');
      }
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        <Button icon={<Search size={16} />} loading={isSearching} onClick={handleSearch}>
          Tìm theo địa chỉ
        </Button>
        {value && (
          <Button icon={<MapPinOff size={16} />} onClick={() => onChange?.(undefined)}>
            Bỏ ghim
          </Button>
        )}
      </div>
      <div className="overflow-hidden rounded-lg border border-line">
        <VietnamMap value={value} onChange={(point) => onChange?.(point)} />
      </div>
      <p className="mt-1 text-xs text-subtle">
        {value
          ? `Ghim: ${value.latitude}, ${value.longitude} — kéo ghim hoặc bấm lên bản đồ để đổi`
          : 'Chưa có vị trí — bấm lên bản đồ để đặt ghim (không bắt buộc, nhưng tin có bản đồ dễ tìm hơn)'}
      </p>
    </div>
  );
}
