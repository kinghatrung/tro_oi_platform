# Bộ quy tắc cho AI khi code dự án Trọ Ơi Platform (`apps/web`)

> Tổng hợp từ: `coding-style.md`, `api-implementation.md`, `style-guide.md`, `README.md` (components), `features.md`.
> Dùng làm checklist bắt buộc trước khi AI viết/sửa code trong repo này.

---

## 0. Bối cảnh dự án (để AI hiểu domain trước khi code)

- **Trọ Ơi Platform** — nền tảng tìm kiếm nhà trọ, căn hộ, ở ghép kết hợp chợ mua bán đồ cũ dành cho sinh viên và người đi làm.
- Stack: **Next.js App Router** (Next 16, React 19), **Ant Design 6** (component tương tác) + **Tailwind CSS 4** (layout/spacing), **Zustand 5**, **Leaflet** (bản đồ vị trí), **Day.js**, giao diện **tiếng Việt** (`viVN`).
- Các domain chính đã/đang phát triển API riêng: `auth`, `housing` (phòng trọ), `marketplace` (pass đồ), `survey`, `news`, `jobs`.
- Trước khi tạo UI mới, luôn kiểm tra các component dùng chung đã có trong `src/components/`.

---

## 1. Giới hạn & cấu trúc file

- **Mỗi file ≤ 600 dòng.** Vượt ngưỡng → tách ngay: helper riêng, component con riêng, `const.tsx`, `type.ts`.
- Mỗi **page** gồm đúng 3 file:
  ```
  src/pages/<PageName>/
  ├── const.tsx   # hằng số, cấu hình cột bảng/form, options — dùng .tsx vì có JSX (render cột)
  ├── type.ts     # type/interface cục bộ của page
  └── index.tsx   # logic + JSX
  ```
- **Không tạo thư mục `hooks/` riêng.** Vị trí đặt hook theo phạm vi dùng:
  | Phạm vi | Vị trí |
  |---|---|
  | 1 page | inline trong `index.tsx` |
  | 2–3 page liên quan | file trong thư mục page cha (`useCitizenForm.ts`) |
  | Toàn app (≥3 nơi) | `src/utils/hooks.ts` |
- Mỗi file trong `lib/api/` = **một domain nghiệp vụ**, chỉ export **hàm async** (không class/singleton).

## 2. Thứ tự code bên trong component (bắt buộc)

```
① Import
② Khai báo ngoài component (type, const, helper thuần)
③ Trong component, theo đúng thứ tự:
   a. Biến      — useRef, useState, useMemo, useContext, custom hook
   b. Function  — useCallback (event handler, transform data)
   c. useEffect
   d. Early return (loading / error / empty)
   e. Return JSX
```

Quy tắc bổ sung:

- `useMemo` cho data transform và cho columns/config — luôn ở nhóm "biến", trước khi dùng trong JSX.
- `useCallback` cho mọi event handler — sau biến, trước `useEffect`.
- **Không khai báo `function handleX` thường bên trong component** — bắt buộc `useCallback`, hoặc đưa ra ngoài component nếu không cần closure.
- Không dùng `useMemo`/`useCallback` khi không cần (tránh premature optimization).
- Dùng comment phân section (`─── Import ───`, `── Biến ──`…) để chia rõ khối trong file dài.

## 3. Quy ước đặt tên

| Đối tượng                     | Convention                | Ví dụ                                                      |
| ----------------------------- | ------------------------- | ---------------------------------------------------------- |
| Thư mục page / Component file | PascalCase                | `Citizens/`, `CitizenFormModal.tsx`                        |
| Util/helper file              | camelCase                 | `exportExcel.ts`                                           |
| React component               | PascalCase                | `CitizenTable`                                             |
| Hook                          | `use` + PascalCase        | `useCitizenForm`                                           |
| Event handler                 | `handle` + PascalCase     | `handleSearch`                                             |
| Boolean state                 | `is/has/can` + PascalCase | `isLoading`, `canEdit`                                     |
| Hằng số module                | SCREAMING_SNAKE_CASE      | `DEFAULT_PAGE_SIZE`                                        |
| Type cục bộ                   | PascalCase                | `ViewMode`                                                 |
| Component con (file)          | PascalCase, mô tả rõ      | `CitizenFilterBar.tsx` (không đặt `Modal.tsx`, `form.tsx`) |

Đặt tên hàm API (`lib/api/`) theo động từ chuẩn:
| Thao tác | Tiền tố | Ví dụ |
|---|---|---|
| Tìm kiếm/phân trang | `searchX` | `searchMeetings` |
| Lấy tất cả | `getAllX` | `getAllRooms` |
| Lấy 1 bản ghi | `getX` | `getMeeting` |
| Thêm | `insertX` | `insertMeeting` |
| Cập nhật | `updateX` | `updateMeeting` |
| Xóa | `deleteX` | `deleteMeeting` |
| Đặc biệt | `verbX` | `sendMeetingInvite` |

Hook query đi kèm mutation: `useCitizenList`, `useCitizenDetail`, `useCreateCitizen`, `useUpdateCitizen`, `useDeleteCitizen`.

## 4. Import & Type

- Thứ tự import, mỗi nhóm cách nhau 1 dòng trống: **React core → third-party (kèm `import type`) → alias `@/` → relative (`./`)**.
- `interface` cho shape object (props, DTO, entity); `type` cho union/tuple/conditional/re-export alias.
- Phạm vi khai báo type: `src/types/index.ts` (shared) / `<Page>/type.ts` (page-local) / inline trong component (chỉ khi dùng 1 lần và < 3 props).
- Generic parameter đặt tên có nghĩa: `TItem`, `TRow`, không chỉ `T` khi có thể rõ hơn.

## 5. Hằng số & Enum

- Hằng số bất biến → `as const`.
- Toàn app → `src/utils/constants.ts`; chỉ dùng trong page → `<Page>/const.tsx`.
- **Cấm hard-code chuỗi/số mang ngữ nghĩa phân loại** (`type`, `status`, `role`, `mode`, `kind`…). Bắt buộc khai báo `enum` (PascalCase, key SCREAMING_SNAKE_CASE) và derive options từ enum đó — không lặp lại literal.
  ```ts
  // ❌ if (meeting.type === 'online')
  // ✅ if (meeting.type === MeetingType.ONLINE)
  ```

## 6. Tách component con & ưu tiên tái sử dụng UI

- Tách component con khi JSX **> 40 dòng**, hoặc cần props riêng, hoặc lặp lại ≥ 2 lần.
- Thứ tự ưu tiên khi dựng UI: **(1) component nội bộ trong `components/`** (kiểm tra README trước) → **(2) Ant Design** → **(3) HTML thuần**.
- 5 component dùng chung hiện có (đọc kỹ props trước khi tự viết lại):
  - `DataTable` — bọc AntD Table, có `indexColumn` (STT liên tục qua `useIndexColumn`), `totalSuffix`, tự lấp đầy chiều cao khi không truyền `scroll.y`.
  - `SearchBar` — render field theo `SearchFieldType` (Text/Select/Number/DateRange) từ mảng `fields` khai báo trong `const.tsx`.
  - `MediaUpload` — upload+preview 1 ảnh/video, không tự upload (đẩy `File` qua `onChange`, cha xử lý upload thật khi submit).
  - `FilePreviewModal` — xem trước PDF (`react-pdf`)/DOCX (`docx-preview`)/ảnh (AntD Image) client-side; `.doc` cũ và định dạng khác → nút tải; hỗ trợ `sidePanel` (thu gọn, không unmount để giữ state).
  - `RightTreeSelect` — cây quyền checkbox, thuần UI (nơi gọi tự fetch + giữ `checkedKeys`).
  - Nguyên tắc chung của mọi component dùng chung: **thuần UI**, nhận callback/config qua props, không tự gọi API/đọc store bên trong; enum thay vì hard-code chuỗi.

## 7. Styling & UI

- **Không inline style** cho giá trị tĩnh — dùng Tailwind class. Chỉ chấp nhận `style={{...}}` khi giá trị thực sự động tại runtime (vd `width: ${percent}%`).
- **Không hard-code mã màu** (hex/rgb/hsl) trong component. Dùng Tailwind class từ token khai báo trong `@theme`; thiếu token cần thiết → bổ sung token mới trước, không chế hex tại chỗ dùng. Trường hợp bắt buộc nhận prop màu (AntD `Tag`/`Badge`/`Progress`) → lấy từ token (`var(--color-...)`), không tự chế hex mới.
- **Không truyền object/array/arrow-function literal trực tiếp vào props** (tạo ref mới mỗi render, phá memoization) — luôn tách `useMemo`/`useCallback`. Ngoại lệ: hằng số tĩnh có thể khai báo ngoài component.
- Toast: **không** `import { message } from 'antd'` (static, mất context). Dùng `App.useApp()` trong component, hoặc `import { message } from '@/stores/useAppStore'` ở nơi ngoài React (proxy an toàn, no-op khi SSR).
- Render HTML động (rich text) → **luôn** `DOMPurify.sanitize()` trước khi đưa vào `dangerouslySetInnerHTML`, kể cả khi nguồn hiện là mock — bọc trong component dùng chung (vd `RichText`), không rải `sanitize` nhiều nơi. Nhớ thêm class Tailwind cho `ul/ol/strong` vì reset CSS đã bỏ style mặc định.

### Token style tham chiếu nhanh (khi cần chọn giá trị mặc định)

- Brand: primary `#1677ff`, brand đỏ chính `rgb(163,29,28)`, teal button primary `#0d4e5c` (khác `colorPrimary` global — override riêng ở `components.Button/Input/Select/Pagination/Progress`).
- Border radius mặc định AntD `8px`; card/table/pagination `12px`; avatar/tag pill `999px`/`rounded-full`.
- Shadow card `0 1px 3px 0 rgba(0,0,0,0.06)`; header `0 0.125rem 0.75rem rgba(15,23,42,0.04)`.
- Spacing theo bội số 4px/8px; padding nội dung page `1.5rem` (mobile `1rem`).
- Font chính: **Be Vietnam Pro**, fallback `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`.
- Breakpoints đang dùng: `768px` (mobile), `1024px` (tablet), `1200px` (header scroll ngang); ưu tiên breakpoint Tailwind mặc định khi viết mới.

## 8. Quy tắc gọi API (`lib/api/`)

- **Luôn cast** kết quả `axiosClient.*` sang `ApiResponse<T>` — interceptor đã flatten response.
- **Không tự `throw new Error` khi `res.success === false` và không dùng `.catch(() => null)` để nuốt lỗi.** Interceptor trong `lib/axiosClient.ts` đã tự `reject` + hiển thị toast lỗi khi backend trả `status: false`; code sau `await` chỉ cần `return res.data`.
  ```ts
  // ✅
  const res = (await axiosClient.get(`/api/Meeting/GetById/${id}`)) as ApiResponse<MeetingDto>;
  return res.data;
  // ❌ dead code, gây toast hiện 2 lần
  if (!res.success) throw new Error(res.message ?? 'Thao tác thất bại');
  ```
- Khi không cần data trả về (delete/action) → gọi `await axiosClient.*` trực tiếp, không cast.
- Hàm API luôn trả **kiểu đã unwrap** (`MeetingDto`, `PagedResponse<T>`), caller không bao giờ thấy `ApiResponse`.
- Muốn tự xử lý message lỗi → truyền `toastError: false` trong config request; caller bắt lỗi bằng `try/catch`/`.catch()` chỉ để dừng luồng, không hiển thị lại message.
- **Query string**: backend nhận PascalCase — luôn map tường minh camelCase→PascalCase trong object `params`, **không spread trực tiếp** `params` gốc vào `axiosClient.get`.
- **Mock toggle**: pattern `USE_MOCK` + `delay()`, mock data đặt ở `app/(admin)/mock/<domain>.ts`. `USE_MOCK = false` là mặc định — **không commit `USE_MOCK = true`** vào `main`.
- **`controlLoading: true`** khi cần tắt global loading spinner (background polling, component đã có skeleton riêng).

## 9. DateTime — quy tắc bắt buộc, xuyên suốt toàn app

1. Mọi field DateTime trong type/DTO (`...Date`, `...Time`, `...At` hoặc mang ngữ nghĩa thời điểm) → khai báo `string` (ISO 8601), **tuyệt đối không dùng `Date`**.
2. Lớp `lib/api/` **giữ nguyên** chuỗi ISO từ backend, không convert/không cần `Raw*`/`toXxxDto()`.
3. Backend trả chuỗi **không kèm offset** (`"2026-06-11T08:00:00"`) nhưng giá trị luôn là **UTC** (mất `Kind=Utc` khi round-trip qua DB). Parse trực tiếp bằng `dayjs(...)`/`new Date(...)` sẽ bị lệch múi giờ (vd sai 7 tiếng ở UTC+7).
4. **Luôn** parse/format qua `parseServerDate` / `formatDate` / `formatDateTime` / `formatTime` trong `lib/utils/date.ts` (an toàn cả với chuỗi đã có offset lẫn `Dayjs`/`Date` sẵn có). Không import các hàm format từ `lib/utils/stringUtils.ts` (đã chuyển sang `date.ts`).
5. Khi gửi dữ liệu từ DatePicker lên backend → `.toISOString()` trước khi đưa vào DTO. Nếu backend cần `DD/MM/YYYY HH:mm` → dùng helper trong `lib/utils/date.ts`, không format thủ công rải rác.
6. Luồng tóm tắt: `Backend (ISO string, UTC) → giữ nguyên qua lib/api → component dùng parseServerDate/formatX khi hiển thị/so sánh → .toISOString() khi gửi lại`.

## 10. Format & quy trình sau khi sửa file

- Sau **mỗi lần chỉnh sửa file** phải chạy Prettier trên file đó trước khi coi là hoàn thành:
  ```bash
  yarn prettier --write <đường-dẫn-file>
  ```
- Cấu hình Prettier: `singleQuote: true`, `semi: true`, `tabWidth: 2`, `printWidth: 120`, `trailingComma: none`, `bracketSpacing: true`.

## 11. Khi thêm component dùng chung mới

- Đặt trong `components/<PascalCase>/` theo khuôn `index.tsx` + `type.ts`.
- Nhận callback/config qua props; **không gọi API hay đọc store bên trong** (giữ thuần UI, logic để nơi gọi xử lý).
- Giá trị phân loại/trạng thái → enum, không hard-code chuỗi.
- Cập nhật bảng "Danh sách" đầu `README.md` của `components/` khi thêm mới.
- Khi thay đổi token style chung (màu brand, font, radius…) → cập nhật cả file cấu hình nguồn (`antdTheme.ts`, `globals.css`) lẫn `style-guide.md` để không lệch tài liệu.

---

## Checklist nhanh trước khi commit code

```
[ ] File < 600 dòng; page có đủ const.tsx / type.ts / index.tsx
[ ] Không tạo thư mục hooks/ riêng
[ ] Thứ tự trong component: biến → useCallback → useEffect → early return → render
[ ] Không có function thường khai báo trong component (chỉ useCallback hoặc ngoài component)
[ ] Đặt tên đúng convention (component/hook/handler/boolean/const/type)
[ ] Import đúng 4 nhóm, có \`import type\` cho type-only
[ ] Không hard-code chuỗi/số phân loại → dùng enum
[ ] JSX > 40 dòng hoặc lặp lại → tách component con
[ ] Ưu tiên component nội bộ > AntD > HTML thuần
[ ] Không inline style tĩnh, không hard-code màu hex/rgb — dùng Tailwind + token
[ ] Không truyền object/array/function literal trực tiếp vào props AntD
[ ] Toast dùng App.useApp() hoặc @/stores/useAppStore, không import message từ antd
[ ] dangerouslySetInnerHTML luôn qua DOMPurify.sanitize()
[ ] Gọi API: cast ApiResponse<T>, không throw lại khi res.success === false, không nuốt lỗi bằng .catch(() => null)
[ ] Query params map tường minh camelCase → PascalCase, không spread trực tiếp
[ ] USE_MOCK = false trước khi merge vào main
[ ] Mọi field DateTime là string ISO 8601; parse qua lib/utils/date.ts, không parse thẳng bằng dayjs()/new Date()
[ ] Đã chạy yarn prettier --write <file> sau khi sửa
```
