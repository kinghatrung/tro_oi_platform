import { z } from 'zod';

import { defineTool, type TroiApiPort } from '../core/ports.js';

/**
 * Hỏi đáp chính sách / hướng dẫn sử dụng (RAG đơn giản, không cần embedding): nguồn = trang chính
 * sách admin đăng (GET /pages, cắt theo mục h2) + hướng dẫn soạn sẵn bên dưới (khớp hành vi thật
 * của web/API) + thiết lập hiện hành (có duyệt tin không, liên hệ). Xếp hạng theo từ / cặp từ khớp.
 * shortcut: so khớp từ khoá, không hiểu từ đồng nghĩa — kho lớn hơn vài chục mục thì dùng embedding.
 */

export interface HelpSection {
  source: string;
  /** Trang nguồn trên web ('' = không có trang riêng). */
  path: string;
  heading: string;
  text: string;
}

interface Settings {
  contactEmail?: string;
  contactPhone?: string;
  enableMarketplace?: boolean;
  requireListingApproval?: boolean;
  requireProductApproval?: boolean;
  requireReviewApproval?: boolean;
}

type Block =
  { type: 'h2' | 'h3' | 'p'; text: string } | { type: 'ul'; items: string[] };

const GUIDE = 'Hướng dẫn sử dụng';

/** Hướng dẫn soạn sẵn; phần phụ thuộc thiết lập (duyệt tin…) điền lúc chạy. */
const guide = (settings: Settings): HelpSection[] =>
  [
    {
      heading: 'Đăng tin nhà ở (cho thuê / bán phòng, căn hộ, nhà, ở ghép)',
      path: '/dang-tin',
      text: `Bấm "Đăng tin" (cần đăng nhập). Chọn loại giao dịch, loại nhà, tỉnh/thành và phường/xã (đơn vị hành chính mới, không còn quận/huyện), giá, diện tích, tiện ích, tiêu đề 10–120 ký tự, mô tả. Ảnh bắt buộc, tối đa 20 ảnh; video là link YouTube hoặc tải lên tối đa 50MB. ${settings.requireListingApproval ? 'Tin mới cần quản trị viên duyệt trước khi hiển thị.' : 'Tin hiển thị ngay sau khi đăng.'} Tin hiển thị 30 ngày.`,
    },
    {
      heading: 'Gia hạn, sửa, ẩn, xoá tin đăng — tin hết hạn',
      path: '/kenh-nguoi-dang/tin-dang',
      text: 'Vào Kênh người đăng → Tin đăng. Mỗi tin hiển thị 30 ngày kể từ lần hiển thị gần nhất; còn 3 ngày bạn nhận thông báo "Tin sắp hết hạn", hết hạn tin chuyển sang "Hết hạn". Gia hạn = hiện lại tin, được thêm 30 ngày. Tại đây cũng sửa, ẩn hoặc xoá tin, xem lượt xem và số người đã lưu.',
    },
    {
      heading: 'Đăng bán đồ cũ trên Chợ ơi',
      path: '/cho-oi/dang-ban',
      text: `${settings.enableMarketplace === false ? 'Chợ ơi đang tạm tắt. ' : ''}Bấm "Đăng bán" ở Chợ ơi (cần đăng nhập): tên món 5–120 ký tự, danh mục, tình trạng, giá (0 = cho tặng, có thể bật "thương lượng"), 1–10 ảnh, tỉnh/thành. ${settings.requireProductApproval ? 'Món mới cần quản trị viên duyệt.' : 'Món hiển thị ngay.'} Bán xong thì đánh dấu "Đã bán" ở Kênh người đăng → Đồ bán.`,
    },
    {
      heading: 'Đăng nhập, tài khoản liên kết',
      path: '/dang-nhap',
      text: 'Đăng nhập bằng số điện thoại (mã OTP qua SMS) hoặc Google / Facebook — lần đầu đăng nhập là tạo tài khoản. Ở trang cá nhân có thể thêm / đổi số điện thoại, liên kết Google hoặc Facebook để đăng nhập cách nào cũng vào cùng tài khoản.',
    },
    {
      heading: 'Lưu tin, lưu tìm kiếm, thông báo tin mới',
      path: '/yeu-thich',
      text: 'Bấm "Lưu" ở trang tin để xem lại trong "Tin đã lưu". Ở trang kết quả tìm kiếm bấm "Lưu tìm kiếm" — có tin mới khớp bộ lọc bạn sẽ được báo. Chọn kênh nhận thông báo (trên web, thông báo đẩy của trình duyệt, email, SMS) ở trang Thông báo.',
    },
    {
      heading: 'Nhắn tin với người đăng',
      path: '/tin-nhan',
      text: 'Ở trang tin bấm nhắn tin / liên hệ để mở cuộc trò chuyện về đúng tin đó (cần đăng nhập). Mỗi tin nhắn gửi kèm được tối đa 4 ảnh. Có thể bấm "Hiện số" để gọi điện cho người đăng.',
    },
    {
      heading: 'Đánh giá người đăng',
      path: '',
      text: `Chỉ đánh giá được người đã nhắn tin qua lại với bạn (không tự đánh giá mình): vào trang hồ sơ của họ, chọn 1–5 sao và viết nhận xét. ${settings.requireReviewApproval ? 'Đánh giá cần quản trị viên duyệt trước khi hiện.' : ''}`.trim(),
    },
    {
      heading: 'Báo cáo tin vi phạm, lừa đảo',
      path: '',
      text: 'Ở trang tin bấm menu ⋮ → Báo cáo (món đồ Chợ ơi: nút "Báo cáo"), chọn lý do: lừa đảo, sai thông tin, tin trùng, đã cho thuê / đã bán, nội dung không phù hợp, khác. Quản trị viên xem xét và xử lý. Cảnh giác: không chuyển tiền cọc trước khi xem nhà / gặp người bán.',
    },
    {
      heading: 'Tải dữ liệu cá nhân, xoá tài khoản',
      path: '/ca-nhan',
      text: 'Trang cá nhân → "Dữ liệu & tài khoản": "Tải dữ liệu của tôi" tải về toàn bộ dữ liệu Trọ ơi lưu về bạn; "Xoá tài khoản" xoá vĩnh viễn tài khoản cùng tin đăng, món đồ (không khôi phục được).',
    },
    {
      heading: 'Liên hệ ban quản trị, hỗ trợ',
      path: '',
      text: `Liên hệ Trọ ơi${settings.contactEmail ? ` qua email ${settings.contactEmail}` : ''}${settings.contactPhone ? `, hotline ${settings.contactPhone}` : ''}.`,
    },
  ].map((section) => ({ ...section, source: GUIDE }));

/** Cắt trang chính sách thành mục theo tiêu đề h2/h3. */
export function pageSections(
  title: string,
  path: string,
  blocks: Block[],
): HelpSection[] {
  const sections: HelpSection[] = [];
  for (const block of blocks) {
    if (block.type === 'h2' || block.type === 'h3' || sections.length === 0) {
      sections.push({
        source: title,
        path,
        heading:
          block.type === 'h2' || block.type === 'h3' ? block.text : title,
        text: '',
      });
      if (block.type !== 'ul' && block.type !== 'p') continue;
    }
    const text =
      block.type === 'ul'
        ? block.items.map((item) => `- ${item}`).join('\n')
        : block.text;
    const last = sections[sections.length - 1];
    last.text = last.text ? `${last.text}\n${text}` : text;
  }
  return sections;
}

/** Chữ thường, bỏ dấu (người dùng hay gõ không dấu) → mảng từ. */
const words = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOP.has(word));

const STOP = new Set(
  'la co the toi ban minh thi cua cho va voi nhu the nao gi khong duoc nhe a oi trong khi neu de lam sao bao nhieu may cac nhung mot nay do'.split(
    ' ',
  ),
);

/** Điểm = từ khớp (tiêu đề ×3) + cặp từ liền nhau khớp ×2 (tiếng Việt ghép 2 âm tiết: "bảo mật"). */
export function rankSections(question: string, sections: HelpSection[]) {
  const query = [...new Set(words(question))];
  const pairs = query.slice(1).map((word, i) => `${query[i]} ${word}`);
  return sections
    .map((section) => {
      const head = words(section.heading);
      const body = words(section.text);
      const text = ` ${[...head, ...body].join(' ')} `;
      const score =
        query.reduce(
          (sum, word) =>
            sum +
            (head.includes(word) ? 3 : 0) +
            Math.min(body.filter((w) => w === word).length, 3),
          0,
        ) +
        pairs.filter((pair) => text.includes(` ${pair} `)).length * 2;
      return { section, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ section }) => section);
}

const CACHE_MS = 5 * 60_000;
let cache: { at: number; sections: HelpSection[] } | undefined;

/** Mọi mục tra cứu; trang chính sách đổi ít → nhớ 5 phút cho câu trả lời nhanh. */
async function loadSections(api: TroiApiPort) {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.sections;
  const [settings, pages] = await Promise.all([
    api.get<Settings>('/settings').catch(() => ({})),
    api
      .get<{ slug: string; title: string }[]>('/pages')
      .catch(() => [] as { slug: string; title: string }[]),
  ]);
  const pageSectionsList = await Promise.all(
    pages.map((page) =>
      api
        .get<{ title: string; blocks: Block[] }>(`/pages/${page.slug}`)
        .then((full) => pageSections(full.title, `/${page.slug}`, full.blocks))
        .catch(() => []),
    ),
  );
  const sections = [...guide(settings), ...pageSectionsList.flat()];
  cache = { at: Date.now(), sections };
  return sections;
}

const MAX_SECTIONS = 3;
const MAX_CHARS = 1500;

export const traCuuHuongDan = defineTool({
  name: 'tra_cuu_huong_dan',
  description:
    'Tra cứu điều khoản sử dụng, chính sách bảo mật (dữ liệu cá nhân) và hướng dẫn dùng Trọ ơi: cách đăng tin / đăng bán, gia hạn tin hết hạn, duyệt tin, đăng nhập, lưu tìm kiếm, thông báo, nhắn tin, đánh giá, báo cáo lừa đảo, xoá tài khoản, liên hệ. Trả lời CHỈ dựa trên các mục trả về, kèm link trang nguồn.',
  schema: z
    .object({
      cauHoi: z
        .string()
        .trim()
        .min(2)
        .max(300)
        .describe('Câu hỏi của người dùng, giữ nguyên ý'),
    })
    .strict(),
  status: () => 'Đang tra cứu hướng dẫn…',
  run: async ({ cauHoi }, api) => {
    const sections = await loadSections(api);
    const found = rankSections(cauHoi, sections).slice(0, MAX_SECTIONS);
    if (found.length === 0) {
      return {
        forModel: {
          found: 0,
          note: 'Không có mục nào khớp — nói chưa có thông tin, gợi ý liên hệ ban quản trị; KHÔNG tự bịa chính sách',
          topics: [...new Set(sections.map((section) => section.heading))],
        },
      };
    }
    return {
      forModel: {
        found: found.length,
        sections: found.map((section) => ({
          source: section.source,
          ...(section.path && { link: section.path }),
          heading: section.heading,
          text: section.text.slice(0, MAX_CHARS),
        })),
      },
    };
  },
});

/** Cho test: xoá bộ nhớ đệm. */
export const resetHelpCache = () => {
  cache = undefined;
};
