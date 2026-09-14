'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  popupText?: string;
  className?: string;
}

/** Displays an OpenStreetMap centered on a property's coordinates. */
export function LocationMap({
  latitude,
  longitude,
  zoom = 16,
  popupText = 'Vị trí',
  className = 'h-full w-full',
}: LocationMapProps) {
  return (
    <MapContainer center={[latitude, longitude]} zoom={zoom} scrollWheelZoom className={className}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={markerIcon}>
        <Popup>{popupText}</Popup>
      </Marker>
    </MapContainer>
  );
}
