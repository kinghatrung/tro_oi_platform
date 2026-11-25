import { z } from 'zod';

import { defineTool } from '../core/ports.js';
import { areaFields, MILLION, normalizeWard } from './common.js';
import { findAuthor, findItem, itemFields } from './thao-tac.js';

/**
 * Điền sẵn form trên web cho người dùng (agent làm hộ): trả `fill-form`, widget mở trang và điền
 * từng ô. KHÔNG bấm gửi — người dùng kiểm tra, tải ảnh (tin đăng) rồi tự bấm Đăng / Gửi.
 * Chỉ đưa field người dùng đã nói; giá trị đã qua schema (enum, độ dài) như form của web.
 */

/** Bỏ field trống để form không bị xoá giá trị người dùng đã nhập trước đó. */
const compact = (values: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );

const AMENITIES = [
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
] as const;

/** Form đăng tin nhà ở (/dang-tin). */
export const soanTinDang = defineTool({
  name: 'soan_tin_dang',
  description:
    'Điền sẵn form ĐĂNG TIN nhà ở (cho thuê / bán phòng, căn hộ, nhà, tìm người ở ghép) từ lời người dùng kể. Chỉ điền thông tin người dùng đã nói; tự viết tiêu đề + mô tả gọn gàng nếu họ chưa có. Người dùng tự tải ảnh (bắt buộc) và bấm Đăng. Cần đăng nhập.',
  schema: z
    .object({
      transaction: z
        .enum(['rent-room', 'buy-room'])
        .optional()
        .describe('rent-room = cho thuê, buy-room = bán'),
      category: z
        .enum(['phong-tro', 'can-ho', 'nguyen-can', 'o-ghep'])
        .optional(),
      ...areaFields,
      street: z.string().max(200).optional().describe('Số nhà, ngõ, đường'),
      giaTrieu: z
        .number()
        .min(0)
        .optional()
        .describe(
          'Giá, đơn vị TRIỆU đồng (thuê theo tháng). "3 triệu rưỡi" = 3.5; "2 tỷ" = 2000',
        ),
      area: z.number().min(1).max(10000).optional().describe('Diện tích m²'),
      bedrooms: z.number().int().min(0).max(50).optional(),
      bathrooms: z.number().int().min(0).max(50).optional(),
      floorCount: z.number().int().min(1).max(100).optional(),
      furnishing: z
        .enum(['full', 'basic', 'empty'])
        .optional()
        .describe(
          'full = đầy đủ nội thất, basic = cơ bản, empty = không nội thất',
        ),
      direction: z
        .enum([
          'east',
          'west',
          'south',
          'north',
          'north-east',
          'north-west',
          'south-east',
          'south-west',
        ])
        .optional(),
      amenities: z.array(z.enum(AMENITIES)).optional(),
      title: z.string().trim().min(10).max(120).optional(),
      description: z.string().trim().max(5000).optional(),
    })
    .strict(),
  status: () => 'Đang điền form đăng tin…',
  run: (args) => {
    const { giaTrieu, city, ward, street, ...rest } = args;
    return Promise.resolve({
      forModel: {
        ok: true,
        note: 'Đã điền sẵn — người dùng cần tải ảnh và bấm Đăng tin',
      },
      action: {
        type: 'fill-form',
        path: '/dang-tin',
        form: 'listing',
        values: compact({
          ...rest,
          price:
            giaTrieu === undefined ? undefined : Math.round(giaTrieu * MILLION),
          address: compact({ city, ward: normalizeWard(ward), street }),
        }),
        label: 'Form đăng tin',
      },
    });
  },
});

/** Form đăng bán đồ cũ (/cho-oi/dang-ban). */
export const soanDoBan = defineTool({
  name: 'soan_do_ban',
  description:
    'Điền sẵn form ĐĂNG BÁN đồ cũ trên Chợ ơi từ lời người dùng kể. Chỉ điền thông tin đã nói; tự viết tiêu đề + mô tả gọn nếu chưa có. Người dùng tự tải ảnh và bấm Đăng bán. Cần đăng nhập.',
  schema: z
    .object({
      title: z.string().trim().min(5).max(120).optional(),
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
        .optional(),
      condition: z
        .enum(['new', 'like-new', 'good', 'fair'])
        .optional()
        .describe(
          'new = mới, like-new = như mới, good = tốt, fair = trung bình',
        ),
      giaDong: z
        .number()
        .min(0)
        .optional()
        .describe('Giá, đơn vị ĐỒNG (0 = cho tặng)'),
      isNegotiable: z.boolean().optional().describe('Có thương lượng giá'),
      description: z.string().trim().max(5000).optional(),
      ...areaFields,
    })
    .strict(),
  status: () => 'Đang điền form đăng bán…',
  run: ({ giaDong, city, ward, ...rest }) =>
    Promise.resolve({
      forModel: {
        ok: true,
        note: 'Đã điền sẵn — người dùng cần tải ảnh và bấm Đăng bán',
      },
      action: {
        type: 'fill-form',
        path: '/cho-oi/dang-ban',
        form: 'product',
        values: compact({
          ...rest,
          price: giaDong,
          address: compact({ city, ward: normalizeWard(ward) }),
        }),
        label: 'Form đăng bán',
      },
    }),
});

/** Hộp sửa hồ sơ ở trang cá nhân. */
export const suaHoSo = defineTool({
  name: 'sua_ho_so',
  description:
    'Mở hộp sửa hồ sơ ở trang cá nhân và điền sẵn tên hiển thị / email / giới thiệu. Người dùng bấm Lưu. Ảnh đại diện, ảnh bìa người dùng tự tải. Cần đăng nhập.',
  schema: z
    .object({
      name: z.string().trim().min(2).max(50).optional(),
      email: z.email().optional(),
      bio: z.string().trim().max(500).optional(),
    })
    .strict(),
  status: () => 'Đang mở sửa hồ sơ…',
  run: (args) =>
    Promise.resolve({
      forModel: { ok: true, note: 'Đã điền sẵn — người dùng bấm Lưu' },
      action: {
        type: 'fill-form',
        path: '/ca-nhan',
        form: 'profile',
        open: 'edit-profile',
        values: compact(args),
        label: 'Sửa hồ sơ',
      },
    }),
});

/** Ô đánh giá ở hồ sơ người đăng. */
export const vietDanhGia = defineTool({
  name: 'viet_danh_gia',
  description:
    'Điền sẵn đánh giá (số sao + nhận xét) cho người đăng 1 tin / món đồ (kind + id) hoặc cho người dùng có id (nguoiDungId, vd từ trang /nguoi-dung/<id>). Chỉ đánh giá được người đã nhắn tin qua lại. Người dùng tự bấm Gửi. Cần đăng nhập.',
  schema: z
    .object({
      kind: itemFields.kind.optional(),
      id: itemFields.id.optional(),
      nguoiDungId: z
        .string()
        .regex(/^[a-f0-9]{24}$/)
        .optional(),
      soSao: z.number().int().min(1).max(5),
      nhanXet: z.string().trim().max(1000).optional(),
    })
    .strict(),
  status: () => 'Đang điền đánh giá…',
  run: async ({ kind, id, nguoiDungId, soSao, nhanXet }, api) => {
    let userId = nguoiDungId;
    let name: string | undefined;
    if (!userId) {
      if (!kind || !id)
        throw new Error('Cần nguoiDungId hoặc kind + id của tin');
      const author = await findAuthor(api, { kind, id });
      userId = author.id;
      name = author.name;
    } else {
      name = (await api.get<{ name: string }>(`/users/${userId}`)).name;
    }
    return {
      forModel: { ok: true, name, note: 'Đã điền sẵn — người dùng bấm Gửi' },
      action: {
        type: 'fill-form',
        path: `/nguoi-dung/${userId}`,
        form: 'review',
        values: compact({ rating: soSao, comment: nhanXet }),
        label: `Đánh giá ${name ?? ''}`.trim(),
      },
    };
  },
});

/** Hộp báo cáo tin vi phạm. */
export const baoCaoTin = defineTool({
  name: 'bao_cao_tin',
  description:
    'Mở hộp BÁO CÁO vi phạm cho 1 tin / món đồ và điền sẵn lý do + ghi chú. Người dùng tự bấm Gửi báo cáo. Cần đăng nhập.',
  schema: z
    .object({
      ...itemFields,
      lyDo: z
        .enum([
          'scam',
          'wrong-info',
          'duplicate',
          'unavailable',
          'inappropriate',
          'other',
        ])
        .describe(
          'scam = lừa đảo, wrong-info = sai thông tin, duplicate = tin trùng, unavailable = đã cho thuê / đã bán, inappropriate = nội dung không phù hợp, other = khác',
        ),
      ghiChu: z.string().trim().max(500).optional(),
    })
    .strict(),
  status: () => 'Đang mở báo cáo…',
  run: async ({ lyDo, ghiChu, ...item }, api) => {
    const { title, path } = await findItem(api, item);
    return {
      forModel: { ok: true, title, note: 'Đã điền sẵn — người dùng bấm Gửi' },
      action: {
        type: 'fill-form',
        path,
        form: 'report',
        open: 'report',
        values: compact({ reason: lyDo, note: ghiChu }),
        label: `Báo cáo: ${title}`,
      },
    };
  },
});
