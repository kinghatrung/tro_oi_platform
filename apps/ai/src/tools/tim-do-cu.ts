import { z } from 'zod';

import { defineTool } from '../core/ports.js';
import {
  areaFields,
  limitField,
  normalizeWard,
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
  })
  .strict();

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
    };
  },
});
