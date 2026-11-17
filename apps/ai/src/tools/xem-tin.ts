import { z } from 'zod';

import { defineTool } from '../core/ports.js';
import { MILLION, shortAddress, type PublicItem } from './common.js';

/** Mô tả do người đăng viết: cắt ngắn và đánh dấu là dữ liệu (chống chèn lệnh vào AI). */
const DESCRIPTION_MAX = 800;

interface Detail extends PublicItem {
  description?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: string;
  amenities?: string[];
  transaction?: string;
  condition?: string;
  isNegotiable?: boolean;
}

const schema = z
  .object({
    kind: z
      .enum(['listing', 'product'])
      .describe('listing = tin nhà ở, product = món đồ Chợ ơi'),
    id: z
      .string()
      .regex(/^[a-f0-9]{24}$/, 'id gồm 24 ký tự hex')
      .describe('id lấy từ kết quả tim_tin / tim_do_cu'),
  })
  .strict();

/** Chi tiết 1 tin / món đồ (GET /listings/:id, /products/:id) — dùng khi người dùng hỏi sâu về 1 kết quả. */
export const xemTin = defineTool({
  name: 'xem_tin',
  description:
    'Xem chi tiết 1 tin nhà ở hoặc 1 món đồ (mô tả, tiện ích, nội thất, số phòng…) theo id có trong kết quả tìm kiếm trước đó.',
  schema,
  status: () => 'Đang đọc chi tiết tin…',
  run: async ({ kind, id }, api) => {
    const item = await api.get<Detail>(
      kind === 'listing' ? `/listings/${id}` : `/products/${id}`,
    );
    const description = item.description?.slice(0, DESCRIPTION_MAX);
    return {
      forModel: {
        id: item.id,
        title: item.title,
        ...(kind === 'listing'
          ? {
              priceMillion: item.price / MILLION,
              transaction: item.transaction,
            }
          : {
              priceVnd: item.price,
              condition: item.condition,
              negotiable: item.isNegotiable,
            }),
        area: item.area,
        bedrooms: item.bedrooms,
        bathrooms: item.bathrooms,
        furnishing: item.furnishing,
        amenities: item.amenities,
        address: item.address?.fullAddress ?? shortAddress(item),
        // Nội dung người đăng tự viết — prompt hệ thống dặn model chỉ coi là dữ liệu
        descriptionFromPoster: description,
      },
      cards: [
        {
          kind,
          id: item.id,
          title: item.title,
          image: item.images[0],
          price: item.price,
          transaction: item.transaction,
          area: item.area,
          address: shortAddress(item),
        },
      ],
    };
  },
});
