'use client';

import dynamic from 'next/dynamic';

/**
 * Bản đồ lãnh thổ Việt Nam (gồm Hoàng Sa, Trường Sa; nhãn tiếng Việt) — xem ghim, hoặc chọn vị trí khi có onChange.
 * MapLibre cần WebGL nên chỉ chạy trên trình duyệt.
 */
export const VietnamMap = dynamic(() => import('./VietnamMap').then((mod) => mod.VietnamMap), {
  ssr: false,
});
export type { MapMarker } from './VietnamMap';

export * from './FloatingInput';
export * from './CardItem';
export * from './CarouselItem';
export * from './LocationCard';
export * from './ButtonDropdown';
export * from './CardDropdown';
export * from './PaginationControl';
export * from './HeaderToolbar';
export * from './SearchResultsList';
export * from './ImageLightbox';
export * from './AreaPicker';
export * from './EmptyState';
export * from './ThemeToggle';
export * from './ReportModal';
export * from './FormSection';
export * from './ProductCard';
export * from './NotificationList';
