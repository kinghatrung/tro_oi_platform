import { z } from 'zod';

import { defineTool, type TroiApiPort } from '../core/ports.js';

/**
 * Công cụ thao tác trên giao diện (agent làm hộ người dùng): không đọc thêm dữ liệu, chỉ trả
 * `action` cho widget diễn lại. Tin / món đồ luôn được kiểm qua API trước — model không mở / lưu
 * được id bịa; đường dẫn do công cụ dựng, model không tự viết URL.
 */

export const itemFields = {
  kind: z
    .enum(['listing', 'product'])
    .describe('listing = tin nhà ở, product = món đồ Chợ ơi'),
  id: z
    .string()
    .regex(/^[a-f0-9]{24}$/, 'id gồm 24 ký tự hex')
    .describe(
      'id lấy từ "Thẻ vừa hiện" / kết quả tìm kiếm / trang chi tiết đang xem — không tự đặt',
    ),
};
const itemSchema = z.object(itemFields).strict();

/** Kiểm tin / món còn hiển thị (API 404 → lỗi trả lại cho model) → tiêu đề + trang chi tiết. */
export async function findItem(
  api: TroiApiPort,
  { kind, id }: z.infer<typeof itemSchema>,
) {
  const item = await api.get<{ title: string }>(
    kind === 'listing' ? `/listings/${id}` : `/products/${id}`,
  );
  return {
    title: item.title,
    path: kind === 'listing' ? `/phong-tro/${id}` : `/cho-oi/${id}`,
  };
}

/** Bấm vào thẻ để xem chi tiết. */
export const moTin = defineTool({
  name: 'mo_tin',
  description:
    'Mở trang chi tiết 1 tin nhà ở / món đồ trên web cho người dùng xem (bấm vào thẻ của tin đó). Dùng khi người dùng muốn xem / mở 1 kết quả, vd "xem phòng thứ 2".',
  schema: itemSchema,
  status: () => 'Đang mở tin…',
  run: async (args, api) => {
    const { title, path } = await findItem(api, args);
    return {
      forModel: { ok: true, title },
      action: { type: 'open-item', path, label: title },
    };
  },
});

/** Bấm "Lưu" trên trang chi tiết. */
const boField = z
  .boolean()
  .optional()
  .describe(
    'true = BỎ lưu (người dùng muốn xoá khỏi mục đã lưu); mặc định là lưu',
  );

export const luuTin = defineTool({
  name: 'luu_tin',
  description:
    'Lưu (hoặc bỏ lưu với bo=true) 1 tin nhà ở / món đồ ở mục "Tin đã lưu" (mở tin rồi bấm nút Lưu). Cần đăng nhập — chưa đăng nhập thì web tự chuyển tới trang đăng nhập.',
  schema: z.object({ ...itemFields, bo: boField }).strict(),
  status: ({ bo }) => (bo ? 'Đang bỏ lưu tin…' : 'Đang lưu tin…'),
  run: async ({ bo, ...item }, api) => {
    const { title, path } = await findItem(api, item);
    return {
      forModel: { ok: true, title },
      action: {
        type: 'click',
        target: 'save',
        path,
        ensure: !bo,
        label: `${bo ? 'Bỏ lưu' : 'Lưu'}: ${title}`,
      },
    };
  },
});

/** Mở khung chat với tin nhắn soạn sẵn — người dùng tự bấm gửi. */
export const nhanTin = defineTool({
  name: 'nhan_tin',
  description:
    'Soạn sẵn tin nhắn gửi chủ tin / người bán và mở khung chat với họ. Tin nhắn KHÔNG tự gửi — người dùng tự đọc lại và bấm gửi. Cần đăng nhập.',
  schema: z
    .object({
      ...itemFields,
      noiDung: z
        .string()
        .trim()
        .min(2)
        .max(500)
        .describe(
          'Tin nhắn lịch sự, ngắn gọn, xưng "em/mình", vd "Chào anh/chị, phòng còn trống không ạ?"',
        ),
    })
    .strict(),
  status: () => 'Đang soạn tin nhắn…',
  run: async ({ noiDung, ...item }, api) => {
    const { title, path } = await findItem(api, item);
    const chat = new URLSearchParams({
      [item.kind === 'listing' ? 'listingId' : 'productId']: item.id,
      text: noiDung,
    });
    return {
      forModel: {
        ok: true,
        title,
        note: 'Tin nhắn đã soạn sẵn, chờ người dùng bấm gửi',
      },
      action: {
        type: 'message',
        path,
        chatPath: `/tin-nhan?${chat}`,
        label: title,
      },
    };
  },
});

/** Bấm "Lưu tìm kiếm" ở trang kết quả nhà ở. */
export const luuTimKiem = defineTool({
  name: 'luu_tim_kiem',
  description:
    'Lưu (hoặc bỏ lưu với bo=true) bộ lọc tìm kiếm nhà ở đang mở để được báo khi có tin mới khớp (nút "Lưu tìm kiếm" ở trang kết quả). Gọi cùng / sau tim_tin. Chỉ có cho nhà ở, không có cho Chợ ơi. Cần đăng nhập.',
  schema: z.object({ bo: boField }).strict(),
  status: ({ bo }) => (bo ? 'Đang bỏ lưu tìm kiếm…' : 'Đang lưu tìm kiếm…'),
  run: ({ bo }) =>
    Promise.resolve({
      forModel: { ok: true },
      action: {
        type: 'click',
        target: 'save-search',
        ensure: !bo,
        label: bo ? 'Bỏ lưu tìm kiếm' : 'Lưu tìm kiếm',
      },
    }),
});

/** Nút đơn lẻ không cần dữ liệu thêm. */
const BUTTONS = {
  'hien-so-dien-thoai': {
    target: 'show-phone',
    needsItem: true,
    label: 'Hiện số điện thoại người đăng',
  },
  'danh-dau-da-doc': {
    target: 'mark-all-read',
    path: '/thong-bao',
    label: 'Đánh dấu tất cả thông báo đã đọc',
  },
  'tai-du-lieu': {
    target: 'export-data',
    path: '/ca-nhan',
    label: 'Tải dữ liệu cá nhân',
  },
} as const;

export const bamNut = defineTool({
  name: 'bam_nut',
  description:
    'Bấm 1 nút trên web: hien-so-dien-thoai (ở trang chi tiết 1 tin — cần kind, id), danh-dau-da-doc (đánh dấu mọi thông báo đã đọc), tai-du-lieu (tải file dữ liệu cá nhân ở trang cá nhân). Hai nút sau cần đăng nhập.',
  schema: z
    .object({
      nut: z.enum(['hien-so-dien-thoai', 'danh-dau-da-doc', 'tai-du-lieu']),
      kind: itemFields.kind.optional(),
      id: itemFields.id.optional(),
    })
    .strict(),
  status: ({ nut }) => `Đang bấm: ${BUTTONS[nut].label}…`,
  run: async ({ nut, kind, id }, api) => {
    const button = BUTTONS[nut];
    let path: string | undefined = 'path' in button ? button.path : undefined;
    if ('needsItem' in button) {
      if (!kind || !id) throw new Error('Cần kind và id của tin');
      path = (await findItem(api, { kind, id })).path;
    }
    return {
      forModel: { ok: true },
      action: {
        type: 'click',
        target: button.target,
        path,
        label: button.label,
      },
    };
  },
});

/** Công tắc nhận thông báo ở trang Thông báo (push cần trình duyệt hỏi quyền → người dùng tự bật). */
export const caiDatThongBao = defineTool({
  name: 'cai_dat_thong_bao',
  description:
    'Bật / tắt nhận thông báo qua email hoặc SMS (trang Thông báo). Mỗi lần 1 kênh. Thông báo đẩy trên trình duyệt cần người dùng tự bật (trình duyệt hỏi quyền). Cần đăng nhập.',
  schema: z
    .object({ kenh: z.enum(['email', 'sms']), bat: z.boolean() })
    .strict(),
  status: () => 'Đang đổi cài đặt thông báo…',
  run: ({ kenh, bat }) =>
    Promise.resolve({
      forModel: { ok: true },
      action: {
        type: 'click',
        target: kenh === 'email' ? 'notify-email' : 'notify-sms',
        path: '/thong-bao',
        ensure: bat,
        label: `${bat ? 'Bật' : 'Tắt'} thông báo qua ${kenh === 'email' ? 'email' : 'SMS'}`,
      },
    }),
});

export const dangXuat = defineTool({
  name: 'dang_xuat',
  description: 'Đăng xuất khỏi tài khoản trên trình duyệt này.',
  schema: z.object({}).strict(),
  status: () => 'Đang đăng xuất…',
  run: () =>
    Promise.resolve({
      forModel: { ok: true },
      action: { type: 'logout', label: 'Đăng xuất' },
    }),
});

/** Người đăng của 1 tin / món đồ (đã kiểm qua API). */
export async function findAuthor(
  api: TroiApiPort,
  { kind, id }: z.infer<typeof itemSchema>,
) {
  const item = await api.get<{
    author?: { id: string; name: string };
    seller?: { id: string; name: string };
  }>(kind === 'listing' ? `/listings/${id}` : `/products/${id}`);
  const author = item.author ?? item.seller;
  if (!author) throw new Error('Không tìm thấy người đăng tin này');
  return author;
}

export const moHoSo = defineTool({
  name: 'mo_ho_so',
  description:
    'Mở trang hồ sơ công khai của người đăng 1 tin / món đồ (các tin khác của họ, đánh giá về họ).',
  schema: itemSchema,
  status: () => 'Đang mở hồ sơ người đăng…',
  run: async (args, api) => {
    const author = await findAuthor(api, args);
    return {
      forModel: { ok: true, name: author.name, userId: author.id },
      action: {
        type: 'open-page',
        path: `/nguoi-dung/${author.id}`,
        label: `Hồ sơ ${author.name}`,
      },
    };
  },
});

/** Bấm nút sáng / tối trên thanh menu. */
export const doiGiaoDien = defineTool({
  name: 'doi_giao_dien',
  description:
    'Đổi giao diện website sang sáng hoặc tối (nút mặt trời / mặt trăng trên thanh menu).',
  schema: z
    .object({
      cheDo: z
        .enum(['sang', 'toi'])
        .describe('sang = giao diện sáng, toi = giao diện tối'),
    })
    .strict(),
  status: () => 'Đang đổi giao diện…',
  run: ({ cheDo }) =>
    Promise.resolve({
      forModel: { ok: true },
      action: {
        type: 'set-theme',
        mode: cheDo === 'toi' ? 'dark' : 'light',
        label: cheDo === 'toi' ? 'Giao diện tối' : 'Giao diện sáng',
      },
    }),
});

/** Các trang người dùng hay cần — đường dẫn cố định, model chỉ chọn tên. */
const PAGES = {
  'trang-chu': { path: '/', label: 'Trang chủ Trọ ơi' },
  'cho-oi': { path: '/cho-oi', label: 'Chợ ơi' },
  'tin-da-luu': { path: '/yeu-thich', label: 'Tin đã lưu' },
  'thong-bao': { path: '/thong-bao', label: 'Thông báo' },
  'tin-nhan': { path: '/tin-nhan', label: 'Tin nhắn' },
  'ca-nhan': { path: '/ca-nhan', label: 'Trang cá nhân' },
  'dang-tin': { path: '/dang-tin', label: 'Đăng tin cho thuê / bán nhà' },
  'dang-ban': { path: '/cho-oi/dang-ban', label: 'Đăng bán đồ cũ' },
  'quan-ly-tin': {
    path: '/kenh-nguoi-dang/tin-dang',
    label: 'Quản lý tin đã đăng',
  },
  'quan-ly-do': {
    path: '/kenh-nguoi-dang/do-ban',
    label: 'Quản lý đồ đang bán',
  },
  'tim-kiem-nha': { path: '/tim-kiem', label: 'Tìm kiếm nhà ở' },
  'tim-kiem-do': { path: '/cho-oi/tim-kiem', label: 'Tìm kiếm đồ cũ' },
  'dang-nhap': { path: '/dang-nhap', label: 'Đăng nhập' },
  'chinh-sach-bao-mat': {
    path: '/chinh-sach-bao-mat',
    label: 'Chính sách bảo mật',
  },
  'dieu-khoan': { path: '/dieu-khoan-su-dung', label: 'Điều khoản sử dụng' },
} as const;

export const moTrang = defineTool({
  name: 'mo_trang',
  description:
    'Mở 1 trang của website: trang-chu, cho-oi, tim-kiem-nha, tim-kiem-do, tin-da-luu (tin / đồ đã lưu), thong-bao, tin-nhan, ca-nhan (hồ sơ, liên kết đăng nhập, đổi số, tải dữ liệu, xoá tài khoản), dang-tin (đăng tin nhà), dang-ban (đăng bán đồ cũ), quan-ly-tin / quan-ly-do (ẩn, hiện, gia hạn, sửa, xoá tin mình đã đăng), dang-nhap, chinh-sach-bao-mat, dieu-khoan. Các trang cá nhân / đăng / quản lý / tin nhắn / thông báo cần đăng nhập.',
  schema: z
    .object({
      trang: z.enum(
        Object.keys(PAGES) as [keyof typeof PAGES, ...(keyof typeof PAGES)[]],
      ),
    })
    .strict(),
  status: ({ trang }) => `Đang mở ${PAGES[trang].label}…`,
  run: ({ trang }) =>
    Promise.resolve({
      forModel: { ok: true },
      action: { type: 'open-page', ...PAGES[trang] },
    }),
});
