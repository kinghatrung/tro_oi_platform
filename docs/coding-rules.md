# Quy tắc code — Trọ Ơi!

> Áp dụng cho `apps/web`, `apps/api`, `packages/shared`. `apps/mobile` có rule riêng trong `apps/mobile/AGENTS.md`.

## 1. Nguyên tắc chung

- **Code ít nhất mà vẫn đủ**: tái sử dụng component/helper/service sẵn có trước khi viết mới. Không thêm option, abstraction, dependency "để sau dùng".
- **Mỗi file ≤ 600 dòng.** Vượt → tách component con / helper / `const.tsx` / `type.ts`.
- **TypeScript strict**, không dùng `any` (trừ khi lib bắt buộc, kèm comment lý do).
- Giao diện, message lỗi, comment: **tiếng Việt**. Tên biến/hàm: tiếng Anh.
- Comment chỉ giải thích **tại sao**, không mô tả lại code. JSDoc 1 dòng cho component/hàm export.
- Đường tắt có giới hạn đã biết → comment `// shortcut: <giới hạn>, <khi nào cần nâng cấp>`.
- **Không hard-code chuỗi phân loại** (`category`, `status`, `role`, `transaction`...). Dùng enum trong `@tro-oi/shared` (web) hoặc mảng `as const` (api — xem mục 4).
- DateTime luôn là **string ISO 8601** trong type/DTO (API trả `...Z` UTC). Hiển thị qua `formatRelativeTime` trong `apps/web/src/utils/helpers.ts`.
- Tiền tệ lưu **VND (number)**. Hiển thị qua `formatVietnameseCurrency`. Bộ lọc giá trên URL dùng đơn vị **triệu**.
- Sau khi sửa code: cập nhật `docs/` (xem [README.md](README.md)).

## 2. Format & kiểm tra

| App      | Format                                          | Kiểm tra                                                    |
| -------- | ----------------------------------------------- | ----------------------------------------------------------- |
| web      | Prettier root (`.prettierrc.json`): single quote, `printWidth 100`, `trailingComma all` | `npx tsc --noEmit` trong `apps/web`, `yarn workspace web build` |
| api      | Prettier `apps/api/.prettierrc`: single quote, `trailingComma all` (printWidth 80) | `yarn workspace api test`, `yarn workspace api build`        |
| shared   | Prettier root                                   | được typecheck khi build web                                 |

Chạy `npx prettier --write <file>` sau khi sửa file. **Giữ nguyên line ending của file** (repo lẫn CRLF/LF, `core.autocrlf=true`) để diff không đổi cả file.

> `yarn workspace web lint` hiện hỏng do môi trường (eslint-config-next không tìm thấy `next` ở root `node_modules`) — dùng `tsc` + `build` để kiểm tra.

## 3. Web (`apps/web`) — Next.js 16 App Router + Ant Design 6 + Tailwind 4 + Zustand

### 3.1 Cấu trúc & đặt file

- Route: `src/app/<route>/page.tsx` (+ `const.tsx`, `type.ts` tuỳ chọn). Slug route **tiếng Việt không dấu** (`/tim-kiem`, `/dang-tin`).
- Route group: `(public)` có header/footer; `(public)/(private)` bắt buộc đăng nhập (chặn ở `src/proxy.ts` — thêm route private mới phải thêm vào `matcher`; page gọi `useRequireUser()`); `(auth)` cho trang đăng nhập.
- Gọi API: **chỉ** qua `src/api/<domain>.ts`, mỗi file một domain, chỉ export hàm `async`. Không gọi `axios` trực tiếp trong component.
- State toàn cục: `src/stores/use<Name>Store.ts` (Zustand). Hiện có `useAuthStore` (user, token, favorites).
- Hằng số toàn app: `src/constants/index.ts`. Hằng số 1 page: `<route>/const.tsx`.
- Helper thuần: `src/utils/helpers.ts`, `src/lib/*.ts`.
- **Không tạo thư mục `hooks/`.** Hook dùng 1 nơi → inline; dùng nhiều nơi → cạnh nơi dùng hoặc trong store.

### 3.2 Server vs Client component

- Mặc định **Server Component**: page public (trang chủ, tìm kiếm, chi tiết, hồ sơ công khai) fetch data trên server để SEO.
- Thêm `'use client'` chỉ khi cần state, effect, event handler, `useRouter`, store.
- Trang cần đăng nhập (`(private)`) là client page, lấy data qua store/API sau khi mount.
- Server page fetch data qua `src/api/*` (axios chạy được cả server); bọc hàm lấy chi tiết bằng `React.cache` khi cả `generateMetadata` và page cùng dùng. Lỗi 404 → `notFound()` (kiểm tra `error instanceof ApiError && error.status === 404`).
- Client component dùng `useSearchParams` trong trang có thể static → bọc `<Suspense>` (xem `Navbar`).
- **Không** đặt `loading.tsx` ở segment có trang gọi `notFound()` (chi tiết tin, hồ sơ): response sẽ stream sớm với HTTP 200, mất status 404.
- Filter/sort/page của trang tìm kiếm **lưu trên URL** (searchParams), không lưu state cục bộ.

### 3.3 Gọi API

```ts
// src/api/listings.ts
export async function getListing(id: string) {
  const res = (await axiosClient.get(`/listings/${id}`)) as ApiResponse<Listing>;
  return res.data;
}
```

- Mọi response theo contract `ApiResponse<T> = { code, message, data }` (xem mục "Định dạng response" trong [api.md](api.md)).
- Interceptor `src/api/axiosClient.ts` đã: gắn `Authorization: Bearer <accessToken>` (cookie), trả nguyên `ApiResponse<T>`, `code >= 400` → ném `ApiError(message, code)`, xoá token khi 401.
- Hàm API trả **kiểu đã unwrap** (`Listing`, `PagedResponse<Listing>`); caller không thấy `ApiResponse`.
- Không `.catch(() => null)` nuốt lỗi. Ở client: `try/catch` → `message.error(err.message)` với `const { message } = App.useApp()`.
- Không `import { message } from 'antd'` (static, mất theme).
- Query params gửi đúng tên camelCase như [api.md](api.md); bỏ field rỗng.

### 3.4 Thứ tự trong component

```
① import: React → thư viện ngoài (kèm `import type`) → alias `@/` → relative `./`
② ngoài component: type, const, helper thuần
③ trong component: biến (ref/state/memo/store) → handler (useCallback khi truyền xuống con/AntD) → useEffect → early return → JSX
```

- JSX > ~40 dòng hoặc lặp ≥ 2 lần → tách component con.
- Ưu tiên UI: component nội bộ `src/components/` → Ant Design → HTML thuần.
- Component dùng chung (`components/common`) **thuần UI**: nhận data/callback qua props, không tự gọi API. Ngoại lệ có chủ đích: `CardItem` đọc `useAuthStore` để toggle yêu thích.

### 3.5 Đặt tên

| Đối tượng          | Convention                 | Ví dụ                         |
| ------------------ | -------------------------- | ----------------------------- |
| Component / file   | PascalCase                 | `CardItem.tsx`                |
| Helper file        | camelCase                  | `searchFilters.ts`            |
| Hook / store       | `use` + PascalCase         | `useAuthStore`                |
| Event handler      | `handle` + PascalCase      | `handleSubmit`                |
| Boolean            | `is/has/can` + PascalCase  | `isLoading`                   |
| Hằng số module     | SCREAMING_SNAKE_CASE       | `PAGE_SIZE`                   |
| Hàm API            | `search/get/getAll/create/update/delete/verb` + Domain | `searchListings`, `createListing`, `toggleFavorite` |

### 3.6 Styling

- Layout/spacing bằng Tailwind; component tương tác bằng AntD. Override AntD bằng class `!` (Tailwind 4 important) như code hiện có.
- Màu: dùng token trong `src/app/globals.css` (`text-primary`, `bg-background`...) và theme AntD `src/theme/antTheme.ts`. Màu giá tiền: `text-[#f0325e]` (đang dùng xuyên suốt). Không chế mã màu mới khi đã có token.
- Không inline style cho giá trị tĩnh.
- Ảnh: `next/image`. Ảnh từ API (`/uploads/**`) đã được whitelist trong `next.config.ts`.
- Text từ người dùng render dạng text (`whitespace-pre-line`), **không** `dangerouslySetInnerHTML` (nếu bắt buộc → sanitize).

## 4. API (`apps/api`) — NestJS 12 + Mongoose 9, ESM

- Mỗi domain một module: `src/modules/<domain>/` gồm `<domain>.module.ts`, `.controller.ts`, `.service.ts`, `dto/`, `schemas/`, `*.spec.ts`.
- **ESM**: import file nội bộ phải có đuôi `.js` (`import { X } from './x.js'`).
- Controller mỏng: nhận DTO, gọi service. Logic + truy vấn DB ở service.
- Validate input bằng `class-validator` trong DTO. `ValidationPipe` global: `whitelist + transform`. Query số dùng `@Type(() => Number)`.
- Response **bắt buộc** đúng `ApiResponse<T> = { code, message, data }`: controller **chỉ `return` data thô**; `ResponseInterceptor` bọc thành `{ code: <HTTP status>, message: 'Thành công', data }`. Lỗi: ném `HttpException` của Nest **kèm message tiếng Việt**; `HttpExceptionFilter` trả `{ code, message, data: null }`. Không tự `res.json()`. Đổi format → sửa cả `response-format.spec.ts`, `packages/shared/src/types/api.ts`, `axiosClient.ts`.
- Không trả document Mongoose trực tiếp: map qua hàm `to<Entity>()` để `id` là string, date là ISO string, đúng shape type trong `@tro-oi/shared`.
- API **không import runtime** từ `@tro-oi/shared` (package là TS source, Nest build ESM không đọc được). Giá trị enum khai báo lại bằng mảng `as const` cạnh schema, kèm comment "trùng với X bên @tro-oi/shared". Khi đổi enum phải sửa **cả hai** nơi.
- Route cần đăng nhập: `@UseGuards(JwtAuthGuard)`; lấy user bằng `@CurrentUser()` (`src/common/current-user.decorator.ts`).
- Kiểm tra quyền sở hữu (author/admin) trong service, ném `ForbiddenException`.
- id không hợp lệ (`!isValidObjectId`) → `NotFoundException`, không để Mongoose CastError thành 500.
- Secret/config chỉ đọc qua `ConfigService`; thêm biến mới → cập nhật `.env.example` + `project-structure.md`.
- Logic không tầm thường (filter, quyền, parse) → có ít nhất 1 unit test `*.spec.ts`.

## 5. Shared (`packages/shared`)

- Chỉ chứa **type, enum, label map** dùng chung web/mobile. Không chứa code phụ thuộc React/Node.
- Enum đi kèm `<ENUM>_LABELS: Record<Enum, string>` tiếng Việt; UI derive options từ đó.
- Đổi type → kiểm tra mapper `to<Entity>()` bên API vẫn khớp.

## 6. Checklist trước commit

```
[ ] File ≤ 600 dòng, đúng thư mục theo mục 3.1 / 4
[ ] Không hard-code chuỗi phân loại; enum web ↔ mảng api đồng bộ
[ ] Gọi API qua src/api/*, không nuốt lỗi, toast bằng App.useApp()
[ ] DTO có validate; route private có JwtAuthGuard; check quyền sở hữu
[ ] Date là ISO string; tiền là VND number
[ ] web: npx tsc --noEmit pass; api: yarn workspace api test pass
[ ] Đã chạy prettier trên file sửa
[ ] Đã cập nhật docs/ (api.md / project-structure.md / coding-rules.md)
```
