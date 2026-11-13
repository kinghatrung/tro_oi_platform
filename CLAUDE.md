# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

`docs/` là nguồn sự thật (quy tắc code, cấu trúc, hợp đồng API, env, mục "Chưa làm"). File này chỉ tóm tắt lệnh và bức tranh chung. Trả lời, comment, docs và giao diện bằng **tiếng Việt**.

## Lệnh thường dùng

```bash
yarn dev:api                      # NestJS watch, http://localhost:5000 (cần MongoDB + apps/api/.env.local)
yarn dev:web                      # Next.js, http://localhost:3001
yarn workspace api seed           # dữ liệu mẫu; đăng nhập dev (AUTH_DEV_LOGIN=true): admin 0900000000, người đăng 0900000001

# API (chạy trong apps/api)
yarn test                         # toàn bộ jest
yarn test moderation              # 1 file / pattern (vd moderation.spec.ts)
yarn lint                         # oxlint --type-aware
npx tsc --noEmit -p tsconfig.json # typecheck khi dev:api đang chạy (không nest build / seed lúc đó)

# Web (chạy trong apps/web) — chưa có test runner
npx tsc --noEmit -p .             # bỏ qua lỗi trong .next/ (type sinh cũ)
npx eslint src
```

- `eslint` web báo `Cannot find module 'next/dist/compiled/babel/eslint-parser'` khi `next` không được hoist lên `node_modules` gốc (hay xảy ra sau `yarn add`). Sửa: tắt dev server rồi `yarn install`; tạm thời: `NODE_PATH=<repo>/apps/web/node_modules npx eslint src`.
- Prettier: file API chạy từ `apps/api` (config riêng, printWidth 80), web/shared dùng config gốc. Luôn thêm `--end-of-line auto` — repo lẫn CRLF/LF, đổi line ending làm diff đổi cả file.

## Kiến trúc chung

- **Monorepo Yarn 1**: `apps/api` (NestJS 12 ESM + Mongoose), `apps/web` (Next 16 App Router + AntD 6 + Tailwind 4 + Zustand), `packages/shared` (type/enum, web import thẳng từ source `src/index.ts`), `apps/mobile` (Expo, mới là mẫu, rule riêng). API **không** import runtime từ shared — enum khai báo lại bằng mảng `as const` trong schema.
- **Hợp đồng response**: controller trả data thô → `ResponseInterceptor` bọc `{ code, message, data }`, `HttpExceptionFilter` cho lỗi; `apps/web/src/api/axiosClient.ts` gắn token từ cookie và unwrap. Mỗi domain một file `src/api/<domain>.ts`.
- **Xác thực**: Firebase (OTP SĐT hoặc Google/Facebook) → ID token → API (`/auth/verify-phone`, `/auth/social`) phát JWT riêng. `JwtAuthGuard` đọc lại user mỗi request (khoá / đổi quyền có hiệu lực ngay); route admin nằm dưới `/admin/*` với `AdminGuard`.
- **Realtime**: một namespace Socket.IO `/chat` (`ChatGateway`, room `user:<id>`) dùng cho cả chat lẫn thông báo; module khác phát sự kiện qua `RealtimeService` (global), không phụ thuộc ChatModule. Web mở 1 kết nối dùng chung (`lib/socket.ts`, do `MessagesButton` kết nối).
- **Thông báo**: luôn qua `NotificationService.notify` — lưu DB rồi gửi nền: realtime `notification:new`, push FCM (chỉ khi không mở web), email SMTP, SMS (chỗ cắm) theo `notifyPrefs`; kênh thiếu cấu hình tự tắt.
- **Kiểm duyệt**: admin đổi trạng thái / xoá tin người khác đi qua `recordModeration()` (`common/moderation.ts`) → nhật ký + thông báo (kèm `moderationNote`); chủ tin đổi trạng thái qua `assertOwnerStatusChange()`.
- **Web**: trang public là Server Component (SEO), trang cần đăng nhập là client và bị `src/proxy.ts` chặn khi chưa có cookie. Khu quản trị (`/quan-tri`) và Kênh người đăng (`/kenh-nguoi-dang`) dùng chung `DashboardShell`; bảng quản trị dùng `useAdminTable` + `DataTable`.
