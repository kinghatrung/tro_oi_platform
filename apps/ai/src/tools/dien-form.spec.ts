import type { TroiApiPort } from '../core/ports.js';
import { baoCaoTin, soanDoBan, soanTinDang, vietDanhGia } from './dien-form.js';
import { bamNut, caiDatThongBao, moHoSo } from './thao-tac.js';

const ID = 'c'.repeat(24);
const USER = 'd'.repeat(24);

/** API giả: chi tiết tin có người đăng; hồ sơ người dùng có tên. */
const api: TroiApiPort = {
  get: <T>(path: string) =>
    Promise.resolve(
      (path.startsWith('/users/')
        ? { name: 'Lan Anh' }
        : {
            title: 'Phòng trọ Cầu Giấy',
            author: { id: USER, name: 'Lan Anh' },
          }) as T,
    ),
};

describe('Điền sẵn form (người dùng tự bấm gửi)', () => {
  it('đăng tin: giá triệu → đồng, thêm "Phường", gom địa chỉ, bỏ field trống', async () => {
    const result = await soanTinDang.run(
      {
        transaction: 'rent-room',
        category: 'phong-tro',
        city: 'Hà Nội',
        ward: 'Cầu Giấy',
        giaTrieu: 3.5,
        area: 25,
        amenities: ['wifi', 'private-wc'],
      },
      api,
    );
    expect(result.action).toEqual({
      type: 'fill-form',
      path: '/dang-tin',
      form: 'listing',
      values: {
        transaction: 'rent-room',
        category: 'phong-tro',
        area: 25,
        amenities: ['wifi', 'private-wc'],
        price: 3_500_000,
        address: { city: 'Hà Nội', ward: 'Phường Cầu Giấy' },
      },
      label: 'Form đăng tin',
    });
  });

  it('đăng bán: giá đồng giữ nguyên; tiện ích lạ bị schema chặn', async () => {
    const result = await soanDoBan.run(
      { title: 'Tủ lạnh mini 90L', giaDong: 1_200_000, isNegotiable: true },
      api,
    );
    expect(result.action).toMatchObject({
      path: '/cho-oi/dang-ban',
      form: 'product',
      values: {
        title: 'Tủ lạnh mini 90L',
        price: 1_200_000,
        isNegotiable: true,
      },
    });
    expect(
      soanTinDang.schema.safeParse({ amenities: ['bể bơi'] }).success,
    ).toBe(false);
  });

  it('đánh giá người đăng của 1 tin → trang hồ sơ của họ', async () => {
    const result = await vietDanhGia.run(
      { kind: 'listing', id: ID, soSao: 5, nhanXet: 'Chủ nhà nhiệt tình' },
      api,
    );
    expect(result.action).toMatchObject({
      path: `/nguoi-dung/${USER}`,
      form: 'review',
      values: { rating: 5, comment: 'Chủ nhà nhiệt tình' },
    });
  });

  it('đã đăng nhập: chưa nhắn tin qua lại → lỗi (không báo đã điền); được đánh giá → điền', async () => {
    const asked: unknown[] = [];
    const reviewApi = (canReview: boolean): TroiApiPort => ({
      get: <T>(path: string, params?: object, token?: string) => {
        if (path === '/reviews/mine') asked.push({ params, token });
        return path === '/reviews/mine'
          ? Promise.resolve({ canReview } as T)
          : api.get<T>(path);
      },
    });
    const args = { nguoiDungId: USER, soSao: 4 };
    await expect(
      vietDanhGia.run(args, reviewApi(false), 'jwt'),
    ).rejects.toThrow('chỉ đánh giá được người đã nhắn tin qua lại');
    expect(asked).toEqual([{ params: { userId: USER }, token: 'jwt' }]);
    const ok = await vietDanhGia.run(args, reviewApi(true), 'jwt');
    expect(ok.action).toMatchObject({ form: 'review', values: { rating: 4 } });
  });

  it('báo cáo: mở hộp báo cáo ở trang tin, điền lý do', async () => {
    const result = await baoCaoTin.run(
      { kind: 'listing', id: ID, lyDo: 'scam' },
      api,
    );
    expect(result.action).toMatchObject({
      path: `/phong-tro/${ID}`,
      form: 'report',
      open: 'report',
      values: { reason: 'scam' },
    });
  });
});

describe('Bấm nút / mở hồ sơ', () => {
  it('hiện số cần tin; các nút khác có trang cố định', async () => {
    await expect(
      bamNut.run({ nut: 'hien-so-dien-thoai' }, api),
    ).rejects.toThrow('Cần kind và id');
    const phone = await bamNut.run(
      { nut: 'hien-so-dien-thoai', kind: 'listing', id: ID },
      api,
    );
    expect(phone.action).toMatchObject({
      target: 'show-phone',
      path: `/phong-tro/${ID}`,
    });
    const read = await bamNut.run({ nut: 'danh-dau-da-doc' }, api);
    expect(read.action).toMatchObject({
      target: 'mark-all-read',
      path: '/thong-bao',
    });
  });

  it('tắt email → công tắc notify-email về trạng thái tắt', async () => {
    const result = await caiDatThongBao.run({ kenh: 'email', bat: false }, api);
    expect(result.action).toMatchObject({
      target: 'notify-email',
      path: '/thong-bao',
      ensure: false,
    });
  });

  it('mở hồ sơ người đăng của tin', async () => {
    const result = await moHoSo.run({ kind: 'listing', id: ID }, api);
    expect(result.action).toEqual({
      type: 'open-page',
      path: `/nguoi-dung/${USER}`,
      label: 'Hồ sơ Lan Anh',
    });
  });
});
