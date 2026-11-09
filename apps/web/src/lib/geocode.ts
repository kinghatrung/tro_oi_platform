import type { GeoPoint } from '@tro-oi/shared';

/**
 * Địa chỉ → toạ độ qua Nominatim (OpenStreetMap). Chỉ gọi khi người dùng bấm "Tìm theo địa chỉ":
 * chính sách Nominatim giới hạn 1 yêu cầu/giây, không dùng để geocode hàng loạt.
 * Không tìm thấy → null.
 */
export async function geocodeAddress(query: string): Promise<GeoPoint | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'vn',
    'accept-language': 'vi',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!response.ok) throw new Error('Dịch vụ bản đồ đang bận, thử lại sau ít giây');
  const [first] = (await response.json()) as { lat: string; lon: string }[];
  return first ? { latitude: Number(first.lat), longitude: Number(first.lon) } : null;
}
