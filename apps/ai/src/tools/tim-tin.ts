import { z } from 'zod';

import { defineTool } from '../core/ports.js';
import {
  areaFields,
  limitField,
  MILLION,
  normalizeWard,
  shortAddress,
  type Paged,
  type PublicItem,
} from './common.js';

interface Listing extends PublicItem {
  transaction: string;
  category: string;
  area: number;
  bedrooms?: number;
}

const SORTS = {
  newest: { sortBy: 'createdAt', sortDirection: 'desc' },
  price_asc: { sortBy: 'price', sortDirection: 'asc' },
  price_desc: { sortBy: 'price', sortDirection: 'desc' },
  area_desc: { sortBy: 'area', sortDirection: 'desc' },
} as const;

const schema = z
  .object({
    keyword: z
      .string()
      .max(100)
      .optional()
      .describe(
        'Từ khoá có trong tiêu đề / địa chỉ, vd tên đường. Không đưa khu vực, giá vào đây',
      ),
    ...areaFields,
    transaction: z
      .enum(['rent-room', 'buy-room'])
      .optional()
      .describe('rent-room = cho thuê, buy-room = mua bán'),
    category: z
      .enum(['phong-tro', 'can-ho', 'nguyen-can', 'o-ghep'])
      .optional()
      .describe(
        'phong-tro = phòng trọ, can-ho = căn hộ, nguyen-can = nhà nguyên căn, o-ghep = tìm người ở ghép',
      ),
    minPrice: z
      .number()
      .min(0)
      .optional()
      .describe('Giá thấp nhất, đơn vị TRIỆU đồng (vd 3.5)'),
    maxPrice: z
      .number()
      .min(0)
      .optional()
      .describe('Giá cao nhất, đơn vị TRIỆU đồng'),
    minArea: z.number().min(0).optional().describe('Diện tích tối thiểu (m²)'),
    maxArea: z.number().min(0).optional().describe('Diện tích tối đa (m²)'),
    bedrooms: z
      .number()
      .int()
      .min(0)
      .optional()
      .describe('Số phòng ngủ tối thiểu'),
    amenities: z
      .array(
        z.enum([
          'wifi',
          'air-conditioner',
          'water-heater',
          'washing-machine',
          'fridge',
          'kitchen',
          'private-wc',
          'balcony',
          'elevator',
          'parking',
          'security',
          'free-hours',
          'pets',
        ]),
      )
      .optional()
      .describe(
        'Tiện ích bắt buộc phải có: air-conditioner = điều hoà, water-heater = nóng lạnh, private-wc = WC khép kín, free-hours = giờ giấc tự do, pets = cho nuôi thú cưng',
      ),
    sort: z
      .enum(['newest', 'price_asc', 'price_desc', 'area_desc'])
      .optional()
      .describe('Mặc định newest'),
    limit: limitField,
  })
  .strict();

/** Tìm tin nhà ở (GET /listings) — giá model gửi theo triệu, API nhận đồng. */
export const timTin = defineTool({
  name: 'tim_tin',
  description:
    'Tìm tin nhà ở đang hiển thị trên Trọ ơi (phòng trọ, căn hộ, nhà nguyên căn, ở ghép; cho thuê hoặc mua bán) theo khu vực, giá, diện tích, tiện ích. Trả về tổng số tin khớp và vài tin tiêu biểu.',
  schema,
  status: (args) =>
    `Đang tìm ${args.category === 'can-ho' ? 'căn hộ' : 'phòng'}${args.ward ? ` ở ${normalizeWard(args.ward)}` : args.city ? ` ở ${args.city}` : ''}…`,
  run: async (args, api) => {
    const sort = SORTS[args.sort ?? 'newest'];
    const result = await api.get<Paged<Listing>>('/listings', {
      keyword: args.keyword,
      city: args.city,
      ward: normalizeWard(args.ward),
      transaction: args.transaction,
      category: args.category,
      minPrice:
        args.minPrice === undefined
          ? undefined
          : Math.round(args.minPrice * MILLION),
      maxPrice:
        args.maxPrice === undefined
          ? undefined
          : Math.round(args.maxPrice * MILLION),
      minArea: args.minArea,
      maxArea: args.maxArea,
      bedrooms: args.bedrooms,
      amenities: args.amenities,
      ...sort,
      pageSize: args.limit ?? 3,
    });
    return {
      forModel: {
        total: result.total,
        items: result.items.map((item) => ({
          id: item.id,
          title: item.title,
          priceMillion: item.price / MILLION,
          transaction: item.transaction,
          area: item.area,
          bedrooms: item.bedrooms,
          address: shortAddress(item),
        })),
      },
      cards: result.items.map((item) => ({
        kind: 'listing' as const,
        id: item.id,
        title: item.title,
        image: item.images[0],
        price: item.price,
        transaction: item.transaction,
        area: item.area,
        address: shortAddress(item),
      })),
    };
  },
});
