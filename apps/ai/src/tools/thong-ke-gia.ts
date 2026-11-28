import { z } from 'zod';

import { defineTool } from '../core/ports.js';
import { areaFields, MILLION, normalizeWard } from './common.js';

interface PriceStat {
  transaction: string;
  category: string;
  count: number;
  median: number;
  avg: number;
  min: number;
  max: number;
  medianArea?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  'phong-tro': 'phòng trọ',
  'can-ho': 'căn hộ',
  'nguyen-can': 'nhà nguyên căn',
  'o-ghep': 'ở ghép',
};

/** Đồng → triệu, 1 chữ số thập phân (3.2). */
const million = (value: number) => Math.round((value / MILLION) * 10) / 10;

/** Giá thị trường trên Trọ ơi (GET /listings/price-stats) — chỉ tính tin đang hiển thị. */
export const thongKeGia = defineTool({
  name: 'thong_ke_gia',
  description:
    'Thống kê giá nhà ở theo khu vực từ tin đang hiển thị trên Trọ ơi: giá trung vị, trung bình, thấp nhất, cao nhất, diện tích trung vị, số tin — tách theo loại (phòng trọ, căn hộ…) và cho thuê / mua bán. Dùng khi hỏi "giá phòng ở X khoảng bao nhiêu", "giá này có đắt không", so sánh giá 2 khu. Không có tin ở phường → tự nới ra cả tỉnh.',
  schema: z
    .object({
      ...areaFields,
      transaction: z.enum(['rent-room', 'buy-room']).optional(),
      category: z
        .enum(['phong-tro', 'can-ho', 'nguyen-can', 'o-ghep'])
        .optional(),
      minArea: z.number().min(0).optional().describe('m²'),
      maxArea: z.number().min(0).optional().describe('m²'),
      bedrooms: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe('Số phòng ngủ tối thiểu'),
    })
    .strict(),
  status: (args) =>
    `Đang thống kê giá${args.ward ? ` ở ${normalizeWard(args.ward)}` : args.city ? ` ở ${args.city}` : ''}…`,
  run: async ({ ward, ...args }, api) => {
    const scoped = normalizeWard(ward);
    const statsOf = (wardFilter?: string) =>
      api.get<PriceStat[]>('/listings/price-stats', {
        ...args,
        ward: wardFilter,
      });
    let stats = await statsOf(scoped);
    let scope = scoped ?? args.city ?? 'toàn quốc';
    let note: string | undefined;
    // Phường chưa có tin → nới ra cả tỉnh trong cùng lượt (đỡ 1 vòng hỏi model)
    if (stats.length === 0 && scoped) {
      stats = await statsOf(undefined);
      note = `${scoped} chưa có tin khớp — số liệu dưới đây là của ${args.city ?? 'toàn quốc'}`;
      scope = args.city ?? 'toàn quốc';
    }
    return {
      forModel: {
        scope,
        ...(note && { note }),
        unit: 'triệu đồng (thuê: theo tháng)',
        basis:
          'chỉ tính tin đang hiển thị trên Trọ ơi, không phải giá thị trường chính thức',
        groups: stats.map((stat) => ({
          type: `${CATEGORY_LABELS[stat.category] ?? stat.category} ${stat.transaction === 'buy-room' ? 'bán' : 'cho thuê'}`,
          count: stat.count,
          median: million(stat.median),
          avg: million(stat.avg),
          min: million(stat.min),
          max: million(stat.max),
          medianArea: stat.medianArea,
        })),
      },
    };
  },
});
