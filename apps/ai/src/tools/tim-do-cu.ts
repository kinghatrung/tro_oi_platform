import { z } from 'zod';

import { defineTool } from '../core/ports.js';
import {
  areaFields,
  formatVnd,
  limitField,
  normalizeWard,
  openPageField,
  priceLabel,
  searchPath,
  shortAddress,
  type Paged,
  type PublicItem,
} from './common.js';

interface Product extends PublicItem {
  category: string;
  condition: string;
  isNegotiable?: boolean;
}

const schema = z
  .object({
    keyword: z
      .string()
      .max(100)
      .optional()
      .describe('Tên món đồ, vd "tủ lạnh", "bàn học"'),
    category: z
      .enum([
        'furniture',
        'electronics',
        'appliance',
        'vehicle',
        'study',
        'kitchen',
        'fashion',
        'decor',
        'sport',
        'hobby',
        'toy',
        'baby',
        'beauty',
        'pet',
        'other',
      ])
      .optional()
      .describe(
        'furniture = nội thất, electronics = điện tử, appliance = gia dụng, vehicle = xe cộ, study = sách & học tập, kitchen = đồ bếp, fashion = thời trang, decor = trang trí & cây cảnh, sport = thể thao, hobby = nhạc cụ & sở thích, toy = đồ chơi, baby = mẹ & bé, beauty = làm đẹp, pet = đồ thú cưng',
      ),
    condition: z
      .enum(['new', 'like-new', 'good', 'fair'])
      .optional()
      .describe('new = mới, like-new = như mới, good = tốt, fair = trung bình'),
    ...areaFields,
    minPrice: z
      .number()
      .min(0)
      .optional()
      .describe('Giá thấp nhất, đơn vị ĐỒNG (vd 500000)'),
    maxPrice: z
      .number()
      .min(0)
      .optional()
      .describe('Giá cao nhất, đơn vị ĐỒNG (vd 2000000)'),
    sort: z
      .enum(['newest', 'price_asc', 'price_desc'])
      .optional()
      .describe('Mặc định newest'),
    limit: limitField,
    moTrang: openPageField,
  })
  .strict();

/** Khoảng giá trang /cho-oi/tim-kiem lọc được (trùng PRODUCT_PRICE_RANGES bên web, đơn vị đồng). */
const PRICE_PRESETS = [
  { key: 'cho-tang', max: 0 },
  { key: 'duoi-200k', max: 200_000 },
  { key: '200k-1tr', min: 200_000, max: 1_000_000 },
  { key: '1tr-5tr', min: 1_000_000, max: 5_000_000 },
  { key: 'tren-5tr', min: 5_000_000 },
] as const;

/** Trang /cho-oi/tim-kiem với cùng bộ lọc; giá chỉ đưa vào khi khớp đúng 1 khoảng của web. */
export function productSearchAction(args: z.infer<typeof schema>) {
  const ward = normalizeWard(args.ward);
  const price = PRICE_PRESETS.find(
    (preset) =>
      ('min' in preset ? preset.min : undefined) === args.minPrice &&
      ('max' in preset ? preset.max : undefined) === args.maxPrice,
  );
  // Từ khoá đồ cũ chỉ so khớp tên món → chỉ gõ từ khoá thật (không gõ tên khu vực)
  const query = args.keyword?.trim() ?? '';
  return {
    type: 'open-search' as const,
    query,
    path: searchPath('/cho-oi/tim-kiem', {
      keyword: query,
      category: args.category,
      condition: args.condition,
      city: args.city,
      ward,
      price: price?.key,
      sort: args.sort?.replace('_', '-'),
    }),
    label: [
      args.keyword ?? 'Đồ cũ',
      ward ?? args.city,
      priceLabel(args.minPrice, args.maxPrice, formatVnd),
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

/** Tìm đồ cũ Chợ ơi (GET /products) — giá tính bằng đồng. */
export const timDoCu = defineTool({
  name: 'tim_do_cu',
  description:
    'Tìm món đồ cũ đang bán trên Chợ ơi theo tên, danh mục, tình trạng, khu vực, giá. Trả về tổng số món khớp và vài món tiêu biểu.',
  schema,
  status: (args) => `Đang tìm ${args.keyword ?? 'đồ cũ'} trên Chợ ơi…`,
  run: async (args, api) => {
    const sort = args.sort ?? 'newest';
    const result = await api.get<Paged<Product>>('/products', {
      keyword: args.keyword,
      category: args.category,
      condition: args.condition,
      city: args.city,
      ward: normalizeWard(args.ward),
      minPrice: args.minPrice,
      maxPrice: args.maxPrice,
      sortBy: sort === 'newest' ? 'createdAt' : 'price',
      sortDirection: sort === 'price_asc' ? 'asc' : 'desc',
      pageSize: args.limit ?? 3,
    });
    return {
      forModel: {
        total: result.total,
        items: result.items.map((item) => ({
          id: item.id,
          title: item.title,
          priceVnd: item.price,
          condition: item.condition,
          negotiable: item.isNegotiable,
          address: shortAddress(item),
        })),
      },
      cards: result.items.map((item) => ({
        kind: 'product' as const,
        id: item.id,
        title: item.title,
        image: item.images[0],
        price: item.price,
        address: shortAddress(item),
      })),
      // 0 kết quả → không chuyển sang trang trống
      action:
        args.moTrang === false || result.total === 0
          ? undefined
          : productSearchAction(args),
    };
  },
});
