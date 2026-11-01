import type { ReactNode } from 'react';
import { Home, Ruler, Building2, BedDouble, Sofa, Bath, Layers, Compass } from 'lucide-react';
import {
  DIRECTION_LABELS,
  FURNISHING_STATUS_LABELS,
  PROPERTY_CATEGORY_LABELS,
  TRANSACTION_TYPE_LABELS,
  type Listing,
} from '@tro-oi/shared';

import { formatVietnameseCurrency } from '@/utils/helpers';

export interface PropertyFeatureItem {
  icon: ReactNode;
  label: string;
  value: string;
}

export const SAMPLE_QUESTIONS: string[] = [
  'Phòng còn trống không ạ?',
  'Giá đã bao gồm điện nước chưa?',
  'Thời hạn thuê tối thiểu bao lâu?',
  'Có thể hẹn giờ đến xem phòng không ạ?',
];

/** Bảng "Đặc điểm bất động sản" — chỉ hiển thị field tin đăng có giá trị. */
export function buildPropertyFeatures(listing: Listing): PropertyFeatureItem[] {
  const features: (PropertyFeatureItem | false | undefined)[] = [
    {
      icon: <Home size={18} />,
      label: 'Loại hình',
      value: `${TRANSACTION_TYPE_LABELS[listing.transaction]} ${PROPERTY_CATEGORY_LABELS[listing.category].toLowerCase()}`,
    },
    listing.area != null && {
      icon: <Ruler size={18} />,
      label: 'Diện tích',
      value: `${listing.area} m²`,
    },
    listing.pricePerSquareMeter != null && {
      icon: <Building2 size={18} />,
      label: 'Giá/m²',
      value: `${formatVietnameseCurrency(listing.pricePerSquareMeter)}/m²`,
    },
    listing.bedrooms != null && {
      icon: <BedDouble size={18} />,
      label: 'Số phòng ngủ',
      value: `${listing.bedrooms} phòng`,
    },
    listing.bathrooms != null && {
      icon: <Bath size={18} />,
      label: 'Số phòng vệ sinh',
      value: `${listing.bathrooms} phòng`,
    },
    listing.floorCount != null && {
      icon: <Layers size={18} />,
      label: 'Số tầng',
      value: `${listing.floorCount} tầng`,
    },
    listing.direction && {
      icon: <Compass size={18} />,
      label: 'Hướng',
      value: DIRECTION_LABELS[listing.direction],
    },
    listing.furnishing && {
      icon: <Sofa size={18} />,
      label: 'Tình trạng nội thất',
      value: FURNISHING_STATUS_LABELS[listing.furnishing],
    },
  ];
  return features.filter((item): item is PropertyFeatureItem => Boolean(item));
}
