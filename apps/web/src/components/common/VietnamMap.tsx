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

/** Một điểm trên bản đồ nhiều ghim (vd các tin đã đăng). */
export interface MapMarker {
  id: string;
  point: GeoPoint;
  title: string;
  /** Dòng phụ trong popup, vd giá. */
  subtitle?: string;
  /** Link trong popup. */
  href?: string;
}

export interface VietnamMapProps {
  /** Vị trí ghim; không có → không ghim, nhìn toàn lãnh thổ. */
  value?: GeoPoint;
  /** Có → bấm lên bản đồ hoặc kéo ghim để đổi vị trí. */
  onChange?: (value: GeoPoint) => void;
  /** Chữ hiện khi bấm vào ghim. */
  popupText?: string;
  zoom?: number;
  /** Nhiều ghim (chỉ xem): gom cụm khi gần nhau, bấm ghim → popup; tự thu phóng cho thấy hết. */
  markers?: MapMarker[];
  className?: string;
}

const MARKER_SOURCE = 'map-markers';
/** Trên mức zoom này không gom cụm nữa. */
const CLUSTER_MAX_ZOOM = 14;
const MARKER_LAYERS = ['map-clusters', 'map-cluster-count', 'map-points'];

const round = (value: number) => Math.round(value * 1e6) / 1e6;
const toPoint = ({ lng, lat }: maplibregl.LngLat): GeoPoint => ({
  latitude: round(lat),
  longitude: round(lng),
});

/** Nội dung popup dựng bằng DOM + textContent (tiêu đề do người dùng nhập, không chèn HTML). */
function popupContent({ title, subtitle, href }: MapMarker) {
  const root = document.createElement('div');
  root.className = 'flex max-w-56 flex-col gap-0.5 text-sm';
  const heading = document.createElement('strong');
  heading.className = 'line-clamp-2';
  heading.textContent = title;
  root.append(heading);
  if (subtitle) {
    const line = document.createElement('span');
    line.className = 'text-body';
    line.textContent = subtitle;
    root.append(line);
  }
  if (href) {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'font-semibold';
    link.textContent = 'Xem tin →';
    root.append(link);
  }
  return root;
}

const MAX_LIST_ITEMS = 50;

/** Popup nhiều tin cùng một điểm: tiêu đề "N tin tại đây" + danh sách cuộn được. */
function listPopupContent(items: MapMarker[], total: number) {
  const root = document.createElement('div');
  const heading = document.createElement('p');
  heading.className = 'mb-2 text-sm font-bold';
  heading.textContent = `${total} tin tại vị trí này`;
  const list = document.createElement('div');
  list.className = 'flex max-h-64 flex-col divide-y divide-line overflow-y-auto pr-1';
  for (const item of items) {
    const entry = popupContent(item);
    entry.classList.add('py-2');
    list.append(entry);
  }
  root.append(heading, list);
  return root;
}

/**
 * Bản đồ chỉ trong lãnh thổ Việt Nam (gồm quần đảo Hoàng Sa, Trường Sa), nhãn tiếng Việt —
 * style xem lib/vietnamMapStyle.ts. Chỉ chạy trên trình duyệt (WebGL).
 */
export function VietnamMap({
  value,
  onChange,
  popupText,
  zoom = 15,
  markers,
  className = 'h-180 w-full',
}: VietnamMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  // Map tạo 1 lần; handler đọc onChange mới nhất qua ref
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

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
      // Bỏ ref trước khi remove: cleanup của effect ghim chạy sau sẽ không đụng map đã huỷ
      mapRef.current = null;
      markerRef.current = null;
      map.remove();
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

  // Nhiều ghim: nguồn GeoJSON gom cụm (nhẹ với hàng nghìn điểm), bấm cụm → phóng to, bấm ghim → popup
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !markers?.length) return;
    const byId = new Map(markers.map((item) => [item.id, item]));
    const color =
      getComputedStyle(document.documentElement).getPropertyValue('--brand').trim() || '#16a6a3';
    let popup: maplibregl.Popup | undefined;

    const bounds = new maplibregl.LngLatBounds();
    markers.forEach(({ point }) => bounds.extend([point.longitude, point.latitude]));
    map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 0 });

    const onClusterClick = async (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      const source = map.getSource<maplibregl.GeoJSONSource>(MARKER_SOURCE);
      if (!feature || !source || feature.geometry.type !== 'Point') return;
      const clusterId = feature.properties.cluster_id;
      const center = feature.geometry.coordinates as [number, number];
      const zoomTo = await source.getClusterExpansionZoom(clusterId);
      if (zoomTo <= CLUSTER_MAX_ZOOM) {
        map.easeTo({ center, zoom: zoomTo });
        return;
      }
      // Các tin trùng/sát toạ độ: phóng to cũng không tách được → liệt kê trong 1 popup
      const leaves = await source.getClusterLeaves(clusterId, MAX_LIST_ITEMS, 0);
      const items = leaves.flatMap((leaf) => byId.get(leaf.properties?.id) ?? []);
      popup?.remove();
      popup = new maplibregl.Popup({ offset: 18, maxWidth: '300px' })
        .setLngLat(center)
        .setDOMContent(listPopupContent(items, feature.properties.point_count))
        .addTo(map);
    };
    const onPointClick = (event: maplibregl.MapLayerMouseEvent) => {
      const item = byId.get(event.features?.[0]?.properties.id);
      if (!item) return;
      popup?.remove();
      popup = new maplibregl.Popup({ offset: 14 })
        .setLngLat([item.point.longitude, item.point.latitude])
        .setDOMContent(popupContent(item))
        .addTo(map);
    };
    const showPointer = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const hidePointer = () => {
      map.getCanvas().style.cursor = '';
    };
    const clickable = [
      ['map-clusters', onClusterClick],
      ['map-points', onPointClick],
    ] as const;

    const addLayers = () => {
      map.addSource(MARKER_SOURCE, {
        type: 'geojson',
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: CLUSTER_MAX_ZOOM,
        data: {
          type: 'FeatureCollection',
          features: markers.map((item) => ({
            type: 'Feature',
            properties: { id: item.id },
            geometry: { type: 'Point', coordinates: [item.point.longitude, item.point.latitude] },
          })),
        },
      });
      map.addLayer({
        id: 'map-clusters',
        type: 'circle',
        source: MARKER_SOURCE,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': color,
          'circle-opacity': 0.88,
          'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 50, 26],
          'circle-stroke-width': 4,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 0.8,
        },
      });
      map.addLayer({
        id: 'map-cluster-count',
        type: 'symbol',
        source: MARKER_SOURCE,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['Noto Sans Bold'],
          'text-size': 13,
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#ffffff' },
      });
      map.addLayer({
        id: 'map-points',
        type: 'circle',
        source: MARKER_SOURCE,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': color,
          'circle-radius': 8,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
        },
      });
      for (const [layer, handler] of clickable) {
        map.on('click', layer, handler);
        map.on('mouseenter', layer, showPointer);
        map.on('mouseleave', layer, hidePointer);
      }
    };

    // Chỉ thêm lớp khi style chủ quyền đã nạp (có nguồn 'sovereignty'), không phải style rỗng lúc tạo map
    const onStyleLoad = () => {
      if (!map.getSource('sovereignty')) return;
      map.off('style.load', onStyleLoad);
      addLayers();
    };
    if (map.getSource('sovereignty')) addLayers();
    else map.on('style.load', onStyleLoad);

    return () => {
      popup?.remove();
      if (mapRef.current !== map) return; // map đã huỷ (unmount)
      map.off('style.load', onStyleLoad);
      for (const [layer, handler] of clickable) {
        map.off('click', layer, handler);
        map.off('mouseenter', layer, showPointer);
        map.off('mouseleave', layer, hidePointer);
      }
      if (map.getSource(MARKER_SOURCE)) {
        MARKER_LAYERS.forEach((id) => map.getLayer(id) && map.removeLayer(id));
        map.removeSource(MARKER_SOURCE);
      }
    };
  }, [markers]);

  return <div ref={containerRef} className={className} />;
}
