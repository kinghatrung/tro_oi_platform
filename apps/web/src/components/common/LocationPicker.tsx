'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { GeoPoint } from '@tro-oi/shared';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
});

/** Chưa có ghim: cả Việt Nam. */
const VIETNAM_CENTER: [number, number] = [16.2, 106.3];
const PIN_ZOOM = 16;

const round = (value: number) => Math.round(value * 1e6) / 1e6;
const toPoint = ({ lat, lng }: L.LatLng): GeoPoint => ({
  latitude: round(lat),
  longitude: round(lng),
});

/** Bấm lên bản đồ = đặt ghim; ghim đổi từ bên ngoài (tìm theo địa chỉ) → bay tới. */
function MapSync({ value, onChange }: LocationPickerProps) {
  const map = useMap();
  useMapEvents({ click: (event) => onChange(toPoint(event.latlng)) });
  useEffect(() => {
    if (value) map.flyTo([value.latitude, value.longitude], Math.max(map.getZoom(), PIN_ZOOM));
  }, [map, value]);
  return null;
}

interface LocationPickerProps {
  value?: GeoPoint;
  onChange: (value: GeoPoint) => void;
  className?: string;
}

/** Bản đồ chọn vị trí: bấm hoặc kéo ghim. Thuần UI — tìm theo địa chỉ do nơi dùng xử lý. */
export function LocationPicker({
  value,
  onChange,
  className = 'h-80 w-full',
}: LocationPickerProps) {
  return (
    <MapContainer
      center={value ? [value.latitude, value.longitude] : VIETNAM_CENTER}
      zoom={value ? PIN_ZOOM : 5}
      scrollWheelZoom
      className={className}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapSync value={value} onChange={onChange} />
      {value && (
        <Marker
          position={[value.latitude, value.longitude]}
          icon={markerIcon}
          draggable
          eventHandlers={{
            dragend: (event) => onChange(toPoint((event.target as L.Marker).getLatLng())),
          }}
        />
      )}
    </MapContainer>
  );
}
