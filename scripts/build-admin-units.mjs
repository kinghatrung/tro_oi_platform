// Sinh dữ liệu đơn vị hành chính (mô hình 2 cấp từ 1/7/2025: tỉnh/thành → phường/xã/đặc khu).
// Chạy: yarn geo:build   (cần mạng). Chạy lại khi Nhà nước điều chỉnh địa giới, rồi đối chiếu diff.
// Nguồn: provinces.open-api.vn API v2 — đối chiếu với Nghị quyết 202/2025/QH15 & danh mục của Cục Thống kê.
import { writeFileSync } from 'node:fs';

const SOURCE = 'https://provinces.open-api.vn/api/v2/?depth=2';
const ROOT = new URL('../', import.meta.url);
const HEADER = `// TỰ SINH bởi scripts/build-admin-units.mjs — không sửa tay. Nguồn: ${SOURCE}`;

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Không tải được ${SOURCE}: HTTP ${response.status}`);
const data = await response.json();

/** "Thành phố Hồ Chí Minh" → "Hồ Chí Minh" (khớp giá trị đã lưu trong tin cũ). */
const shortName = (name) => name.replace(/^(Thành phố|Tỉnh)\s+/, '');
const collator = new Intl.Collator('vi');

const provinces = data.map((province) => shortName(province.name));
const wards = Object.fromEntries(
  data.map((province) => [
    shortName(province.name),
    province.wards.map((ward) => ward.name).sort(collator.compare),
  ]),
);

const wardCount = Object.values(wards).reduce((sum, list) => sum + list.length, 0);
// Số liệu chính thức sau sắp xếp: 34 tỉnh/thành, 3.321 đơn vị cấp xã
if (provinces.length !== 34 || wardCount !== 3321) {
  throw new Error(`Số liệu lạ: ${provinces.length} tỉnh, ${wardCount} xã — kiểm tra nguồn trước khi ghi`);
}
if (new Set(provinces).size !== provinces.length) throw new Error('Trùng tên tỉnh sau khi rút gọn');

const provinceList = `[\n${provinces.map((name) => `  '${name}',`).join('\n')}\n]`;

writeFileSync(
  new URL('apps/web/src/constants/provinces.ts', ROOT),
  `${HEADER}

/** 34 tỉnh/thành (tên rút gọn, bỏ "Thành phố"/"Tỉnh"), theo thứ tự mã hành chính. */
export const PROVINCES = ${provinceList} as const;

export type Province = (typeof PROVINCES)[number];
`,
);
writeFileSync(new URL('apps/web/src/constants/wards.json', ROOT), `${JSON.stringify(wards)}\n`);
writeFileSync(
  new URL('apps/api/src/common/provinces.ts', ROOT),
  `${HEADER}
// Trùng PROVINCES bên apps/web/src/constants/provinces.ts (cùng sinh 1 lần).

/** 34 tỉnh/thành hợp lệ cho address.city (tên rút gọn). */
export const PROVINCES = ${provinceList} as const;
`,
);
console.log(`Đã ghi ${provinces.length} tỉnh/thành, ${wardCount} phường/xã/đặc khu.`);
