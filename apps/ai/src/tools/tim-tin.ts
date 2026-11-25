import { z } from 'zod';

import { defineTool } from '../core/ports.js';
import {
  areaFields,
  limitField,
  MILLION,
  normalizeWard,
  openPageField,
  priceLabel,
  searchPath,
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
    moTrang: openPageField,
  })
  .strict();

const CATEGORY_LABELS = {
  'phong-tro': 'Phòng trọ',
  'can-ho': 'Căn hộ',
  'nguyen-can': 'Nhà nguyên căn',
  'o-ghep': 'Ở ghép',
} as const;

/** Trang /tim-kiem của web với cùng bộ lọc (giá theo triệu như URL web, sort dùng dấu "-"). */
export function listingSearchAction(args: z.infer<typeof schema>) {
  const ward = normalizeWard(args.ward);
  // Chữ gõ vào ô: từ khoá, không có thì tên khu vực — từ khoá tin so khớp cả địa chỉ nên vẫn đúng
  const query =
    args.keyword?.trim() ||
    ward?.replace(/^(phường|xã|đặc khu)\s+/i, '') ||
    args.city ||
    '';
  return {
    type: 'open-search' as const,
    query,
    path: searchPath('/tim-kiem', {
      keyword: query,
      city: args.city,
      ward,
      transaction: args.transaction,
      category: args.category,
      minPrice: args.minPrice,
      maxPrice: args.maxPrice,
      minArea: args.minArea,
      maxArea: args.maxArea,
      bedrooms: args.bedrooms,
      amenities: args.amenities,
      sort: args.sort?.replace('_', '-'),
    }),
    label:
      [
        args.category ? CATEGORY_LABELS[args.category] : 'Nhà ở',
        args.keyword,
        ward ?? args.city,
        priceLabel(args.minPrice, args.maxPrice, (value) => `${value} triệu`),
      ]
        .filter(Boolean)
        .join(' · ') || 'Tìm nhà',
  };
}

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
      // 0 kết quả → không chuyển sang trang trống, câu trả lời gợi ý nới điều kiện
      action:
        args.moTrang === false || result.total === 0
          ? undefined
          : listingSearchAction(args),
    };
  },
});
