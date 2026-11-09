'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { GeoPoint } from '@tro-oi/shared';

import {
  BASE_STYLE_URL,
  VIETNAM_BOUNDS,
  VIETNAM_CENTER,
  patchVietnamStyle,
} from '@/lib/vietnamMapStyle';

export interface VietnamMapProps {
  /** Vị trí ghim; không có → không ghim, nhìn toàn lãnh thổ. */
  value?: GeoPoint;
  /** Có → bấm lên bản đồ hoặc kéo ghim để đổi vị trí. */
  onChange?: (value: GeoPoint) => void;
  /** Chữ hiện khi bấm vào ghim. */
  popupText?: string;
  zoom?: number;
  className?: string;
}

const round = (value: number) => Math.round(value * 1e6) / 1e6;
const toPoint = ({ lng, lat }: maplibregl.LngLat): GeoPoint => ({
  latitude: round(lat),
  longitude: round(lng),
});

/**
 * Bản đồ chỉ trong lãnh thổ Việt Nam (gồm quần đảo Hoàng Sa, Trường Sa), nhãn tiếng Việt —
 * style xem lib/vietnamMapStyle.ts. Chỉ chạy trên trình duyệt (WebGL).
 */
export function VietnamMap({
  value,
  onChange,
  popupText,
  zoom = 15,
  className = 'h-180 w-full',
}: VietnamMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  // Map tạo 1 lần; handler đọc onChange mới nhất qua ref
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current!,
      style: { version: 8, sources: {}, layers: [] },
      center: value ? [value.longitude, value.latitude] : VIETNAM_CENTER,
      zoom: value ? zoom : 4.5,
      minZoom: 4,
      maxBounds: VIETNAM_BOUNDS,
      attributionControl: { compact: true },
    });
    map.setStyle(BASE_STYLE_URL, { transformStyle: (_previous, next) => patchVietnamStyle(next) });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.on('click', (event) => onChangeRef.current?.(toPoint(event.lngLat)));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tạo map 1 lần; vị trí đồng bộ ở effect dưới
  }, []);

  // Ghim theo value (đặt từ ngoài: tìm theo địa chỉ, bấm bản đồ, kéo ghim)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    const position: [number, number] = [value.longitude, value.latitude];
    if (!markerRef.current) {
      const marker = new maplibregl.Marker({ draggable: Boolean(onChangeRef.current) })
        .setLngLat(position)
        .addTo(map);
      marker.on('dragend', () => onChangeRef.current?.(toPoint(marker.getLngLat())));
      if (popupText) marker.setPopup(new maplibregl.Popup({ offset: 30 }).setText(popupText));
      markerRef.current = marker;
    } else {
      markerRef.current.setLngLat(position);
    }
    map.easeTo({ center: position, zoom: Math.max(map.getZoom(), zoom) });
  }, [popupText, value, zoom]);

  return <div ref={containerRef} className={className} />;
}
