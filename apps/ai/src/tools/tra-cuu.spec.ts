import type { TroiApiPort } from '../core/ports.js';
import {
  pageSections,
  rankSections,
  resetHelpCache,
  traCuuHuongDan,
} from './huong-dan.js';
import { thongKeGia } from './thong-ke-gia.js';
import { timTin } from './tim-tin.js';

/** API giả theo đường dẫn; ghi lại tham số đã gọi. */
const fakeApi = (routes: Record<string, (params: object) => unknown>) => {
  const calls: { path: string; params: object }[] = [];
  const api: TroiApiPort = {
    get: <T>(path: string, params: object = {}) => {
      calls.push({ path, params });
      const route = routes[path];
      return route
        ? Promise.resolve(route(params) as T)
        : Promise.reject(new Error(`404 ${path}`));
    },
  };
  return { api, calls };
};

describe('Tra cứu hướng dẫn / chính sách', () => {
  beforeEach(resetHelpCache);

  it('cắt trang theo tiêu đề h2, gom đoạn + gạch đầu dòng vào mục', () => {
    expect(
      pageSections('Chính sách bảo mật', '/chinh-sach-bao-mat', [
        { type: 'p', text: 'Mở đầu' },
        { type: 'h2', text: '2. Dữ liệu thu thập' },
        { type: 'p', text: 'Số điện thoại' },
        { type: 'ul', items: ['Email', 'Ảnh'] },
      ]),
    ).toEqual([
      {
        source: 'Chính sách bảo mật',
        path: '/chinh-sach-bao-mat',
        heading: 'Chính sách bảo mật',
        text: 'Mở đầu',
      },
      {
        source: 'Chính sách bảo mật',
        path: '/chinh-sach-bao-mat',
        heading: '2. Dữ liệu thu thập',
        text: 'Số điện thoại\n- Email\n- Ảnh',
      },
    ]);
  });

  it('xếp hạng theo từ khớp, gõ không dấu vẫn ra', () => {
    const sections = [
      { source: 's', path: '', heading: 'Đăng tin', text: 'Ảnh bắt buộc' },
      {
        source: 's',
        path: '',
        heading: 'Xoá tài khoản',
        text: 'Xoá vĩnh viễn tài khoản',
      },
    ];
    expect(rankSections('lam sao xoa tai khoan', sections)[0].heading).toBe(
      'Xoá tài khoản',
    );
    expect(rankSections('thời tiết hôm nay', sections)).toEqual([]);
  });

  it('gộp trang chính sách đã đăng + hướng dẫn theo thiết lập (có duyệt tin)', async () => {
    const { api } = fakeApi({
      '/settings': () => ({
        requireListingApproval: true,
        contactEmail: 'hotro@example.vn',
      }),
      '/pages': () => [{ slug: 'chinh-sach-bao-mat', title: 'Bảo mật' }],
      '/pages/chinh-sach-bao-mat': () => ({
        title: 'Chính sách bảo mật',
        blocks: [
          { type: 'h2', text: 'Quyền của bạn' },
          { type: 'p', text: 'Bạn có quyền yêu cầu xoá dữ liệu cá nhân.' },
        ],
      }),
    });
    const posting = await traCuuHuongDan.run(
      { cauHoi: 'đăng tin có cần duyệt không' },
      api,
    );
    const first = (
      posting.forModel as { sections: { heading: string; text: string }[] }
    ).sections[0];
    expect(first.heading).toContain('Đăng tin');
    expect(first.text).toContain('cần quản trị viên duyệt');

    const privacy = await traCuuHuongDan.run(
      { cauHoi: 'quyền xoá dữ liệu cá nhân' },
      api,
    );
    // Mục của trang chính sách lọt top kèm link trang nguồn
    expect(
      (privacy.forModel as { sections: object[] }).sections,
    ).toContainEqual(
      expect.objectContaining({
        link: '/chinh-sach-bao-mat',
        heading: 'Quyền của bạn',
      }),
    );
  });
});

describe('Thống kê giá / tìm tin tự nới khu vực', () => {
  it('thống kê: phường không có tin → lấy cả tỉnh, đổi đồng → triệu', async () => {
    const { api, calls } = fakeApi({
      '/listings/price-stats': (params) =>
        'ward' in params && (params as { ward?: string }).ward
          ? []
          : [
              {
                transaction: 'rent-room',
                category: 'phong-tro',
                count: 10,
                median: 3_250_000,
                avg: 3_400_000,
                min: 1_500_000,
                max: 6_000_000,
                medianArea: 22,
              },
            ],
    });
    const result = await thongKeGia.run(
      { city: 'Hà Nội', ward: 'Cầu Giấy', category: 'phong-tro' },
      api,
    );
    expect(calls.map((call) => call.params)).toEqual([
      { city: 'Hà Nội', category: 'phong-tro', ward: 'Phường Cầu Giấy' },
      { city: 'Hà Nội', category: 'phong-tro', ward: undefined },
    ]);
    expect(result.forModel).toMatchObject({
      scope: 'Hà Nội',
      groups: [{ type: 'phòng trọ cho thuê', median: 3.3, min: 1.5, max: 6 }],
    });
  });

  it('tìm tin: phường 0 kết quả → nới ra tỉnh trong cùng lượt, trang kết quả theo tỉnh', async () => {
    const item = {
      id: 'a'.repeat(24),
      title: 'Phòng đẹp',
      price: 3_000_000,
      images: [],
      transaction: 'rent-room',
      category: 'phong-tro',
      area: 20,
    };
    const { api } = fakeApi({
      '/listings': (params) =>
        (params as { ward?: string }).ward
          ? { items: [], total: 0 }
          : { items: [item], total: 7 },
    });
    const result = await timTin.run(
      { city: 'Hà Nội', ward: 'Cầu Giấy', maxPrice: 4 },
      api,
    );
    expect(result.forModel).toMatchObject({ total: 7 });
    expect((result.forModel as { note: string }).note).toContain(
      'Phường Cầu Giấy chưa có tin khớp',
    );
    expect(result.cards).toHaveLength(1);
    expect(
      result.action?.type === 'open-search' && result.action.path,
    ).not.toContain('ward=');
  });
});
