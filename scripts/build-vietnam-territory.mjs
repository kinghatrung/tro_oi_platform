// Sinh đường bao lãnh thổ Việt Nam (đất liền + đảo, gồm quần đảo Hoàng Sa và Trường Sa) cho bản đồ web.
// Chạy: yarn geo:territory (cần mạng).
// Nguồn: Natural Earth 1:10m, bản "quan điểm Việt Nam" (POV vnm — Hoàng Sa, Trường Sa thuộc Việt Nam).
// Natural Earth là public domain. Đây là ranh giới tham khảo để làm mờ vùng ngoài lãnh thổ, không phải dữ liệu đo đạc.
import { writeFileSync } from 'node:fs';

const SOURCE =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries_vnm.geojson';
const OUT = new URL('../apps/web/src/constants/vietnam-territory.json', import.meta.url);

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Không tải được ${SOURCE}: HTTP ${response.status}`);
const { features } = await response.json();
const vietnam = features.find((feature) => feature.properties.ADM0_A3 === 'VNM');
if (!vietnam) throw new Error('Không thấy Việt Nam trong dữ liệu');

const polygons =
  vietnam.geometry.type === 'Polygon' ? [vietnam.geometry.coordinates] : vietnam.geometry.coordinates;

/** Đếm đa giác nằm gọn trong 1 vùng — để chắc chắn dữ liệu có 2 quần đảo. */
const countIn = (minLng, maxLng, minLat, maxLat) =>
  polygons.filter(([ring]) =>
    ring.every(([lng, lat]) => lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat),
  ).length;
if (countIn(111, 113, 15.5, 17.5) === 0 || countIn(111, 118, 6, 12) === 0) {
  throw new Error('Dữ liệu thiếu quần đảo Hoàng Sa hoặc Trường Sa — không ghi');
}

// ~100m: đủ cho lớp làm mờ, giảm dung lượng; bỏ điểm trùng sau khi làm tròn
const round = (value) => Math.round(value * 1000) / 1000;
const simplifyRing = (ring) =>
  ring
    .map(([lng, lat]) => [round(lng), round(lat)])
    .filter((point, index, all) => index === 0 || point[0] !== all[index - 1][0] || point[1] !== all[index - 1][1]);

const geometry = {
  type: 'MultiPolygon',
  coordinates: polygons
    .map((polygon) => polygon.map(simplifyRing))
    .filter(([outer]) => outer.length >= 4),
};
writeFileSync(OUT, `${JSON.stringify(geometry)}\n`);
console.log(`Đã ghi ${geometry.coordinates.length} đa giác (${(JSON.stringify(geometry).length / 1024).toFixed(0)} KB).`);
