import type {
  ExpressionSpecification,
  FilterSpecification,
  LayerSpecification,
  StyleSpecification,
} from 'maplibre-gl';

import territory from '@/constants/vietnam-territory.json';

/**
 * Style nền OpenFreeMap (vector OSM, miễn phí, không cần key) — được chỉnh bởi patchVietnamStyle()
 * để bản đồ thể hiện đúng chủ quyền Việt Nam.
 */
export const BASE_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Khung kéo/zoom: lãnh thổ Việt Nam gồm quần đảo Hoàng Sa, Trường Sa (+ lề). [lng, lat] */
export const VIETNAM_BOUNDS: [[number, number], [number, number]] = [
  [100.5, 5.5],
  [119.5, 24],
];
export const VIETNAM_CENTER: [number, number] = [108.2, 15.8];

type Ring = [number, number][];
const TERRITORY = territory as { type: 'MultiPolygon'; coordinates: Ring[][] };

const box = (west: number, south: number, east: number, north: number): Ring[] => [
  [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ],
];

/** Vùng biển 2 quần đảo: địa danh ở đây chỉ hiện khi có tên tiếng Việt (không hiện tên phiên âm/chữ Hán). */
const ARCHIPELAGOS = {
  type: 'MultiPolygon' as const,
  coordinates: [box(110.8, 15.5, 113.2, 17.3), box(111.2, 6.8, 118, 12.2)],
};

/** Nhãn chủ quyền luôn hiện trên bản đồ. */
const SOVEREIGNTY_LABELS = {
  type: 'FeatureCollection' as const,
  features: [
    { name: 'Quần đảo Hoàng Sa\n(Việt Nam)', coordinates: [112.0, 16.45] },
    { name: 'Quần đảo Trường Sa\n(Việt Nam)', coordinates: [114.4, 9.9] },
  ].map(({ name, coordinates }) => ({
    type: 'Feature' as const,
    properties: { name },
    geometry: { type: 'Point' as const, coordinates },
  })),
};

/** Toàn thế giới trừ lãnh thổ Việt Nam (các lỗ) → lớp làm mờ phần ngoài Việt Nam. */
const OUTSIDE_VIETNAM = {
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'Polygon' as const,
    coordinates: [box(-180, -85, 180, 85)[0], ...TERRITORY.coordinates.map(([outer]) => outer)],
  },
};

/** Chỉ chữ Latin: tên tiếng Việt, không có thì tên Latin — không bao giờ hiện chữ Hán (name:nonlatin). */
const TEXT_FIELD: ExpressionSpecification = ['coalesce', ['get', 'name:vi'], ['get', 'name:latin']];

/** Zoom gần (≥ 10): bỏ lớp làm mờ — đường bao Natural Earth chỉ chính xác cỡ km. */
const DETAIL_ZOOM = 10;

/** Thực thể tự nhiên (đảo, đá, bãi) — được giữ ở 2 quần đảo nếu có tên tiếng Việt. */
const NATURAL_PLACE: ExpressionSpecification = [
  'match',
  ['get', 'class'],
  ['island', 'islet', 'archipelago'],
  true,
  false,
];

/**
 * Trong vùng Hoàng Sa, Trường Sa: chỉ hiện đảo/đá có tên tiếng Việt, và thực thể có tên gốc Latin
 * (của Việt Nam). Ẩn mọi thứ có tên gốc chữ Hán (name:nonlatin): đơn vị hành chính Trung Quốc tự đặt
 * ("Tam Sa", "xã/khu"), sân bay, cảng, đường... họ xây trên đảo.
 */
const ARCHIPELAGO_RULE: ExpressionSpecification = [
  'any',
  ['all', ['has', 'name:vi'], NATURAL_PLACE],
  ['!', ['has', 'name:nonlatin']],
];

/**
 * Đất liền: chỉ nhãn của Việt Nam. Mọi zoom: tên gốc phải là chữ Latin — địa danh Trung Quốc (chữ Hán),
 * Lào, Campuchia đều có tên gốc không phải Latin (name:nonlatin), địa danh Việt Nam thì không.
 * Thêm: zoom xa → nằm trong đường bao lãnh thổ; zoom gần (≥ DETAIL_ZOOM) đường bao lệch cỡ km nên chỉ
 * dùng cho nhãn không tên.
 */
const MAINLAND_RULE: ExpressionSpecification = [
  'all',
  ['!', ['has', 'name:nonlatin']],
  [
    'case',
    ['>=', ['zoom'], DETAIL_ZOOM],
    // Không có tên để xét (vd biển số "G219" của đường không tên bên Trung Quốc) → theo đường bao
    ['any', ['has', 'name'], ['within', TERRITORY]],
    ['within', TERRITORY],
  ],
];

/**
 * Chỉ vẽ đường biên giới đất liền của Việt Nam (mã ISO 2 bên đường). Bỏ biên giới giữa các nước khác,
 * đường biên trên biển (OSM vẽ Hoàng Sa trong ranh giới Trung Quốc) và ranh giới hành chính bên trong
 * (OSM còn cấp huyện/tỉnh cũ, không khớp mô hình 2 cấp từ 1/7/2025).
 */
const VIETNAM_BORDER: ExpressionSpecification = [
  'all',
  ['==', ['get', 'admin_level'], 2],
  ['!=', ['get', 'maritime'], 1],
  ['any', ['==', ['get', 'adm0_l'], 'VNM'], ['==', ['get', 'adm0_r'], 'VNM']],
];

/**
 * Áp cho MỌI lớp nhãn/biểu tượng — kể cả biển số đường: feature biển số vẫn mang tên con đường,
 * nên quốc lộ Trung Quốc (tên chữ Hán) bị ẩn, đường Việt Nam giữ nguyên.
 */
const labelFilter = (sourceLayer: string | undefined): ExpressionSpecification =>
  // Tên biển/vịnh (ngoài đất liền): giữ nếu có tên tiếng Việt ("Biển Đông", "Vịnh Bắc Bộ")
  sourceLayer === 'water_name'
    ? ['has', 'name:vi']
    : ['case', ['within', ARCHIPELAGOS], ARCHIPELAGO_RULE, MAINLAND_RULE];

/**
 * Chỉnh style OpenFreeMap: nhãn tiếng Việt (không chữ Hán), ẩn nhãn ngoài lãnh thổ, chỉ vẽ biên giới
 * Việt Nam, làm mờ phần ngoài Việt Nam, thêm nhãn chủ quyền Hoàng Sa, Trường Sa.
 */
export function patchVietnamStyle(style: StyleSpecification): StyleSpecification {
  const layers = style.layers
    // Lớp ranh giới: chỉ giữ boundary_2 (cấp quốc gia), lọc còn biên giới Việt Nam
    .filter(
      (layer) =>
        !('source-layer' in layer && layer['source-layer'] === 'boundary') ||
        layer.id === 'boundary_2',
    )
    .map((layer): LayerSpecification => {
      if (layer.id === 'boundary_2' && layer.type === 'line') {
        return {
          ...layer,
          filter: ['all', layer.filter ?? true, VIETNAM_BORDER] as FilterSpecification,
        };
      }
      // Mọi nhãn/biểu tượng (cả biển số đường) đều qua bộ lọc lãnh thổ
      if (layer.type !== 'symbol') return layer;
      const usesName = JSON.stringify(layer.layout?.['text-field'] ?? '').includes('name');
      const extra = labelFilter(layer['source-layer']);
      return {
        ...layer,
        layout: usesName ? { ...layer.layout, 'text-field': TEXT_FIELD } : layer.layout,
        filter: (layer.filter ? ['all', layer.filter, extra] : extra) as FilterSpecification,
      };
    });
  const firstSymbol = layers.findIndex((layer) => layer.type === 'symbol');

  return {
    ...style,
    sources: {
      ...style.sources,
      'outside-vietnam': { type: 'geojson', data: OUTSIDE_VIETNAM },
      sovereignty: { type: 'geojson', data: SOVEREIGNTY_LABELS },
    },
    layers: [
      ...layers.slice(0, firstSymbol),
      {
        id: 'outside-vietnam',
        type: 'fill',
        source: 'outside-vietnam',
        paint: {
          'fill-color': '#ffffff',
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.75, DETAIL_ZOOM, 0],
        },
      },
      ...layers.slice(firstSymbol),
      {
        id: 'sovereignty-labels',
        type: 'symbol',
        source: 'sovereignty',
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 4, 11, 8, 15],
          'text-allow-overlap': true,
        },
        paint: { 'text-color': '#b91c1c', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5 },
      },
    ],
  };
}
