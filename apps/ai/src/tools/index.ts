import {
  baoCaoTin,
  soanDoBan,
  soanTinDang,
  suaHoSo,
  vietDanhGia,
} from './dien-form.js';
import {
  bamNut,
  caiDatThongBao,
  dangXuat,
  doiGiaoDien,
  luuTimKiem,
  luuTin,
  moHoSo,
  moTin,
  moTrang,
  nhanTin,
} from './thao-tac.js';
import { traCuuHuongDan } from './huong-dan.js';
import { thongKeGia } from './thong-ke-gia.js';
import { timDoCu } from './tim-do-cu.js';
import { timTin } from './tim-tin.js';
import { xemTin } from './xem-tin.js';

/** Mọi công cụ AI được dùng. Thêm khả năng mới = thêm 1 file + 1 dòng ở đây. */
export const TOOLS = [
  timTin,
  timDoCu,
  xemTin,
  thongKeGia,
  traCuuHuongDan,
  // Thao tác trên giao diện (agent làm hộ)
  moTin,
  moHoSo,
  luuTin,
  nhanTin,
  luuTimKiem,
  bamNut,
  caiDatThongBao,
  doiGiaoDien,
  moTrang,
  dangXuat,
  // Điền sẵn form — người dùng tự bấm gửi
  soanTinDang,
  soanDoBan,
  suaHoSo,
  vietDanhGia,
  baoCaoTin,
];
