# Cấu trúc dự án — Trọ Ơi!

Nền tảng tìm phòng trọ / căn hộ / nguyên căn / ở ghép (thuê & mua bán). Monorepo **Yarn 1 workspaces**.

```
tro-oi/
├── apps/
│   ├── api/        # NestJS 12 + MongoDB (Mongoose) — REST API, port 5000
│   ├── web/        # Next.js 16 (App Router) + AntD 6 + Tailwind 4 — port 3001
│   └── mobile/     # Expo / React Native (chưa phát triển, có AGENTS.md riêng)
├── packages/
│   └── shared/     # @tro-oi/shared — type, enum, label map dùng chung
├── docs/           # Tài liệu cho người & AI (file này)
├── CLAUDE.md / AGENTS.md  # Trỏ AI tới docs/
└── package.json    # scripts: dev:web, dev:api, dev:mobile
```

## Chạy dự án

```bash
yarn install
# MongoDB local: mongodb://localhost:27017/tro-oi
cp apps/api/.env.example apps/api/.env.local   # điền giá trị
yarn workspace api seed      # (tuỳ chọn) tạo user + tin đăng mẫu
yarn dev:api                 # http://localhost:5000
yarn dev:web                 # http://localhost:3001
```

## Biến môi trường

### `apps/api/.env.local` (mẫu: `.env.example`)

| Biến                     | Bắt buộc | Mô tả                                                     |
| ------------------------ | -------- | --------------------------------------------------------- |
| `MONGODB_URI`            | ✔        | Chuỗi kết nối MongoDB                                      |
| `JWT_SECRET`             | ✔        | Khoá ký JWT                                               |
| `JWT_EXPIRES_IN`         |          | Mặc định `7d`                                             |
| `PORT`                   |          | Mặc định `5000`                                           |
| `WEB_ORIGIN`             |          | CORS origin, mặc định `http://localhost:3001` (nhiều origin ngăn cách bởi dấu phẩy) |
| `API_PUBLIC_URL`         |          | URL công khai của API để tạo link ảnh upload, mặc định `http://localhost:5000` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | | Firebase Admin — cần cho `/auth/verify-phone` |
| `AUTH_DEV_LOGIN`         |          | `true` để bật `/auth/dev-login` (đăng nhập bằng SĐT không OTP). **Không bật ở production** |

### `apps/web/.env.local` (mẫu: `.env.example`)

| Biến                                   | Mô tả                                                    |
| -------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                  | URL API, mặc định `http://localhost:5000`                |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Client. **Bỏ trống → trang đăng nhập dùng `/auth/dev-login`** |

---

## `apps/api`

```
src/
├── main.ts                     # bootstrap: CORS, cookie-parser, ValidationPipe, interceptor/filter, static /uploads
├── app.module.ts               # Config + Mongoose + các module
├── seed.ts                     # script tạo dữ liệu mẫu (yarn workspace api seed)
├── common/
│   ├── response.interceptor.ts # thành công → { code, message: 'Thành công', data }
│   ├── http-exception.filter.ts# lỗi → { code, message (tiếng Việt), data: null }
│   ├── response-format.spec.ts # test contract ApiResponse
│   ├── current-user.decorator.ts # @CurrentUser() → { sub, phone, role }
│   └── status-rules.ts         # assertOwnerStatusChange(): chủ tin không tự duyệt tin chờ (có test)
└── modules/
    ├── auth/                   # verify-phone, dev-login, FirebaseService
    │   ├── jwt-auth.guard.ts   # kiểm token + đọc role/isBlocked từ DB mỗi request
    │   ├── admin.guard.ts      # chỉ role admin — dùng SAU JwtAuthGuard
    │   └── schemas/user.schema.ts  # User (phone, name, email, bio, avatar, role, isBlocked, favoriteListingIds)
    ├── user/                   # /users: me, favorites, hồ sơ công khai
    ├── listing/                # /listings (Trọ ơi): tìm kiếm, stats, CRUD, duyệt tin theo settings
    │   ├── listing.filter.ts   # build Mongo filter/sort từ query (có unit test)
    │   └── listing.mapper.ts   # toListing(): document → Listing (shared type)
    ├── product/                # /products (Chợ ơi): tìm kiếm, CRUD, duyệt tin theo settings
    │   ├── product.filter.ts   # (có unit test)
    │   └── product.mapper.ts   # toProduct()
    ├── report/                 # POST /reports — người dùng báo cáo tin vi phạm
    ├── settings/               # GET /settings — thiết lập website (singleton, cache bộ nhớ)
    ├── admin/                  # /admin/* — thống kê, người dùng, tin, báo cáo, lưu thiết lập
    └── upload/                 # POST /uploads (multer, lưu apps/api/uploads/)
```

- Collections: `users`, `listings`, `products`, `reports`, `settings`.
- Quan hệ: `Listing.author`, `Product.seller`, `Report.reporter → User._id`; `User.favoriteListingIds → Listing._id[]`; `Report.targetId → Listing | Product`.
- **Tài khoản admin:** `yarn workspace api seed` luôn đảm bảo SĐT `0900000000` là admin (dev-login được). Production: đặt `role: 'admin'` cho user thật bằng mongosh, rồi dùng trang `/quan-tri/nguoi-dung` để cấp quyền cho người khác.
- Chi tiết endpoint: [api.md](api.md).

---

## `apps/web`

```
src/
├── app/
│   ├── layout.tsx                     # đọc thiết lập website + cookie theme → metadata, data-theme, --brand
│   ├── providers.tsx                  # Client: SiteSettings context (useSiteSettings), theme (useThemeMode), ConfigProvider
│   ├── not-found.tsx, error.tsx       # trang 404 (có header/footer) và trang lỗi (nút Thử lại)
│   ├── page.tsx                       # Trang chủ (server, fetch listings + stats)
│   ├── (auth)/dang-nhap/              # Đăng nhập OTP (Firebase) / dev-login
│   ├── (chat)/tin-nhan/               # Chat (UI): layout riêng chỉ có header, full màn hình, không cuộn trang;
│   │                                  #   page + useChat.ts (điểm nối backend, xem chat-plan.md). Cần đăng nhập (proxy.ts)
│   ├── cho-oi/page.tsx                # Chợ ơi: đầu trang giống trang chủ (Header), dưới ô tìm: danh mục, lọc + lưới, CTA
│   └── (public)/                      # layout: SubHeader + Breadcrumb + Footer
│       ├── tim-kiem/                  # Tìm kiếm (server, filter qua URL) + loading.tsx skeleton
│       ├── phong-tro/[slug]/          # Chi tiết tin, slug = listing id
│       ├── nguoi-dung/[id]/           # Hồ sơ công khai người đăng
│       ├── cho-oi/[id]/               # Chi tiết món đồ Chợ ơi
│       └── (private)/                 # cần đăng nhập (chặn ở src/proxy.ts), layout force-dynamic
│           ├── ca-nhan/               # Hồ sơ của tôi + xem tin (ProfileEditModal.tsx)
│           ├── yeu-thich/             # Tin đã lưu
│           ├── dang-tin/              # Đăng / sửa tin (?id=): 6 bước + PostSidebar (xem trước, checklist), CategoryPicker
│           ├── cho-oi/dang-ban/       # Đăng / sửa món đồ Chợ ơi (?id=)
│           └── kenh-nguoi-dang/       # Kênh người đăng: layout sidebar (SellerSidebar)
│               ├── page.tsx           #   Tổng quan: thống kê tin/lượt xem/lượt lưu, top tin
│               ├── tin-dang/          #   Quản lý tin: bảng lọc (cả Chờ duyệt)/tìm/sắp xếp, sửa/ẩn/xoá
│               ├── do-ban/            #   Đồ đang bán (Chợ ơi): đã bán, ẩn/hiện, sửa, xoá
│               ├── useMyListings.ts   #   hook dùng chung: GET /listings/mine + ẩn/hiện/xoá
│               └── const.tsx          #   menu sidebar, màu Tag theo trạng thái
│   └── (admin)/quan-tri/              # Trang quản trị (AdminShell: sidebar + header), chỉ admin
│       ├── page.tsx                   #   Tổng quan (GET /admin/stats)
│       ├── nguoi-dung/                #   Người dùng: tìm, đổi vai trò, khoá/mở khoá
│       ├── tin-tro/, tin-cho/         #   Duyệt / ẩn / xoá tin Trọ ơi, Chợ ơi
│       ├── bao-cao/                   #   Báo cáo vi phạm: ẩn tin + đóng báo cáo / bỏ qua
│       ├── thiet-lap/                 #   Thiết lập website (tên, logo, favicon, màu, theme, banner, thông báo, bật/tắt tính năng)
│       └── useAdminTable.ts           #   hook bảng phân trang phía server
├── proxy.ts                           # Next 16 proxy (middleware): thiếu cookie accessToken → /dang-nhap?redirect=
├── api/                               # axiosClient (token cookie, ApiError) + 1 file / domain: auth, users, listings, products, reports, settings, admin, uploads
├── stores/useAuthStore.ts             # user, favorites, login/logout/toggleFavorite + hook useRequireUser()
├── components/
│   ├── layout/                        # Header (banner: trang chủ, Chợ ơi), SubHeader, Navbar, Container, Footer
│   ├── common/                        # UI thuần dùng lại (xem bảng dưới)
│   ├── chat/                          # UI chat thuần: ConversationList, ChatWindow, MessageBubble, ChatComposer
│   └── sections/                      # Khối giao diện theo trang
├── constants/index.ts                 # CATEGORIES, CITIES, SORT_OPTIONS, NO_IMAGE (ảnh dự phòng)
├── lib/siteSettings.ts                # loadSiteSettings() cho Server Component (cache/request, fallback khi API lỗi)
├── lib/constants/constantsProduct.tsx # icon danh mục, màu Tag, khoảng giá, sort của Chợ ơi
├── lib/searchFilters.ts               # toSearchRequest() / toProductSearchRequest(): searchParams → request (bỏ giá trị sai)
├── lib/constants/constantsRoom.tsx    # buildPropertyFeatures(listing), câu hỏi mẫu
├── utils/helpers.ts                   # formatNumber, formatRelativeTime, formatVietnameseCurrency, formatListingPrice
├── lib/firebase.ts                    # khởi tạo Firebase client (null khi chưa cấu hình)
├── theme/antTheme.ts                  # theme AntD gốc (sáng, màu teal)
├── theme/buildTheme.ts                # buildAntTheme(primaryColor, isDark): đổi màu chủ đạo / darkAlgorithm
└── app/globals.css                    # token màu theo theme (--surface, --ink, --brand...) → class bg-surface, text-ink...
```

### Route

| URL                     | Loại          | Data                                                  |
| ----------------------- | ------------- | ----------------------------------------------------- |
| `/`                     | Server        | `GET /listings` (mua bán, cho thuê mới), `GET /listings/stats` |
| `/tim-kiem`             | Server        | `GET /listings` từ searchParams: `keyword, city, district, transaction, category, minPrice, maxPrice (triệu), minArea, maxArea, bedrooms, sort, page` |
| `/phong-tro/[id]`       | Server        | `GET /listings/:id`, tin tương tự, tin khác của người đăng |
| `/nguoi-dung/[id]`      | Server        | `GET /users/:id`, `GET /listings?authorId=`           |
| `/dang-nhap`            | Client        | `POST /auth/verify-phone` hoặc `/auth/dev-login`      |
| `/ca-nhan` 🔒           | Client        | store user, `GET /listings/mine`, `PATCH /users/me` |
| `/kenh-nguoi-dang` 🔒   | Client        | `GET /listings/mine` → thống kê                      |
| `/tin-nhan` 🔒          | Client        | `GET /listings/:id` (mở chat theo `?listingId=`); tin nhắn **chỉ lưu cục bộ** cho tới khi làm backend chat |
| `/kenh-nguoi-dang/tin-dang` 🔒 | Client | `GET /listings/mine`, `PATCH/DELETE /listings/:id` |
| `/yeu-thich` 🔒         | Client        | store favorites (`GET /users/me/favorites`)           |
| `/dang-tin` 🔒          | Client        | `POST /uploads`, `POST /listings`, `PATCH /listings/:id` |
| `/cho-oi`               | Server        | `GET /products` từ searchParams: `keyword, category, condition, city, district, price (khoảng), sort, page`. Tắt Chợ ơi → trang báo tạm đóng |
| `/cho-oi/[id]`          | Server        | `GET /products/:id`, đồ tương tự                      |
| `/cho-oi/dang-ban` 🔒   | Client        | `POST /uploads`, `POST/PATCH /products`               |
| `/kenh-nguoi-dang/do-ban` 🔒 | Client   | `GET /products/mine`, `PATCH/DELETE /products/:id`    |
| `/quan-tri/*` 🔒 admin  | Client        | `/admin/*`, `PATCH/DELETE /listings|products/:id`, `PUT /admin/settings` |

Breadcrumb (`BreadcrumbItem`) tự sinh từ URL theo `ROUTE_LABELS` — thêm route mới thì thêm nhãn vào đó.

`/`, `/tim-kiem`, `/phong-tro/[id]`, `/nguoi-dung/[id]` render động (fetch API mỗi request). `generateMetadata` dùng chung kết quả với page qua `React.cache`. API trả 404 → `notFound()`.

### Component dùng chung (`components/common`)

| Component          | Vai trò                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `CardItem`         | Thẻ tin đăng (`listing: Listing`, `column` = dạng hàng ngang), nút Lưu nối store |
| `CarouselItem`     | Carousel thẻ tin, 5 thẻ / slide                                          |
| `SearchResultsList`| Toolbar sort + view mode (list/grid) + danh sách + phân trang URL       |
| `HeaderToolbar`    | Sort dropdown + toggle list/grid                                         |
| `PaginationControl`| Phân trang đồng bộ `?page=`                                              |
| `AreaPicker`       | Popup chọn tỉnh/thành + quận → điều hướng `/tim-kiem`                    |
| `ButtonDropdown`, `CardDropdown` | Nút mở dropdown / khung popup có header-footer             |
| `FloatingInput`    | Input label nổi                                                          |
| `LocationCard`, `LocationMap` | Ảnh khu vực; bản đồ Leaflet (client-only)                    |
| `ImageLightbox`    | Xem ảnh toàn màn hình + thông tin tin đăng                               |
| `ProductCard`      | Thẻ món đồ Chợ ơi                                                        |
| `ReportModal`      | Báo cáo tin (Trọ ơi/Chợ ơi) → `POST /reports`. Tự gọi API (ngoại lệ có chủ đích) |
| `ThemeToggle`      | Nút sáng/tối (ẩn khi admin tắt `allowThemeToggle`)                       |
| `FormSection`      | Khối form có số bước (đăng tin, đăng bán)                                |
| `EmptyState`      | Trạng thái rỗng theo bộ nhận diện (`EmptyVariant`: SEARCH, LISTING, FAVORITE, CHAT → `public/images/empty/*.svg`). **Dùng thay `<Empty>` của AntD** |

### Luồng đăng nhập

1. `/dang-nhap`: nhập SĐT → Firebase gửi OTP (reCAPTCHA invisible) → nhập OTP → lấy ID token → `POST /auth/verify-phone`. Không có Firebase config → `POST /auth/dev-login`.
2. Lưu `accessToken` vào cookie (7 ngày) + `useAuthStore`.
3. `Navbar` gọi `useAuthStore.loadSession()` khi mount: có cookie → `GET /users/me` + `GET /users/me/favorites`.
4. `src/proxy.ts` chặn `/ca-nhan`, `/yeu-thich`, `/dang-tin`, `/kenh-nguoi-dang`, `/tin-nhan`, `/cho-oi/dang-ban`, `/quan-tri` khi chưa có cookie; layout `(auth)` đẩy về `/` khi đã có cookie.
5. Cookie còn nhưng token hết hạn: `loadSession` lỗi → xoá cookie; trang private dùng `useRequireUser()` tự chuyển sang `/dang-nhap`.
6. API trả 401 ở bất kỳ request nào → interceptor xoá cookie.
7. Đăng xuất: `logout()` + `window.location.assign('/')` (reload sạch state).
8. Admin khoá tài khoản → mọi request có token trả 403 ngay (guard đọc DB), đăng nhập lại cũng bị chặn.

### Thiết lập website & theme

1. `app/layout.tsx` gọi `loadSiteSettings()` (`GET /settings`, cache theo request; API lỗi → `FALLBACK_SETTINGS`).
2. Metadata: title `"{siteName}: {tagline}"`, template `"%s | {siteName}"` (page chỉ đặt phần `%s`), description, favicon.
3. `<html data-theme>` = cookie `theme` (nếu `allowThemeToggle`) hoặc `defaultTheme`; `style="--brand: primaryColor"`.
4. `globals.css`: token màu đổi theo `[data-theme='dark']`; `--brand-soft/--brand-dark` sinh bằng `color-mix` từ `--brand`.
5. `providers.tsx`: `buildAntTheme(primaryColor, isDark)` cho AntD; `ThemeToggle` ghi cookie + đổi `data-theme` ngay.
6. Server Component đọc thiết lập bằng `loadSiteSettings()` (Header, Footer, Promote); Client Component dùng `useSiteSettings()` (Navbar, trang đăng nhập...).
7. Admin lưu ở `/quan-tri/thiet-lap` → `router.refresh()` → layout đọc lại, áp dụng ngay.

### Theme theo khu vực

- Trọ ơi dùng `primaryColor` + token mặc định; **Chợ ơi** (`/cho-oi/*`) dùng `marketplaceColor` + nền ấm riêng, banner `public/images/cho-oi-hero.svg`.
- `providers.tsx` xác định khu vực từ URL: gắn `data-section="market"` và truyền màu vào `buildAntTheme`. `globals.css` (`body:has([data-section='market'])`) đổi token CSS, nên popup AntD gắn vào `body` cũng theo.
- `buildAntTheme` sinh lại toàn bộ dải sắc từ màu được chọn (`SHADE_RECIPES`); thêm sắc teal mới vào `antTheme.ts` thì phải thêm vào bảng này.
- Mỗi theme (khu vực + sáng/tối) có `cssVar.key` riêng trong `providers.tsx`. **Không bỏ:** dùng chung key thì nút AntD giữ màu cũ khi đổi theme không tải lại trang.
- Logo, hình `EmptyState` là ảnh teal: class `brand-art` xoay sắc trong khu Chợ ơi.

### Duyệt tin

- `requireListingApproval` / `requireProductApproval` bật → tin mới `pending`, không hiện công khai.
- Chủ tin không đổi được trạng thái tin `pending`; admin duyệt ở `/quan-tri/tin-tro`, `/quan-tri/tin-cho`.

---

## `packages/shared`

`src/types/`: `api` (ApiResponse, PagedResponse), `common`, `user`, `auth`, `housing` (Listing), `marketplace` (ProductItem), `report`, `settings` (SiteSettings, ThemeMode), `admin` (AdminStats, query...), `chat`, `upload`; `news`, `jobs`, `survey` mới có type, chưa có API.

Web dùng qua `transpilePackages: ['@tro-oi/shared']`; package trỏ thẳng `src/index.ts`. API **không** import shared (xem coding-rules mục 4).

## Ảnh

- Ảnh người dùng upload: `POST /uploads` → lưu `apps/api/uploads/`, URL tuyệt đối theo `API_PUBLIC_URL`.
- `next.config.ts` whitelist `NEXT_PUBLIC_API_URL` + `/uploads/**` cho `next/image`. Dev bật `dangerouslyAllowLocalIP` (API ở localhost); **production phải đặt API ở domain công khai**, nếu không `next/image` trả 400 với ảnh upload.
- Ảnh tĩnh của web (`/images/*`, `/logo/*`) nằm trong `apps/web/public` — dữ liệu seed dùng các ảnh này.

---

## Chưa làm (backlog)

- Tin tức, việc làm, khảo sát: mới có type ở shared.
- Chat cho Chợ ơi (chat hiện chỉ gắn với tin Trọ ơi), yêu thích món đồ Chợ ơi.
- Nhật ký thao tác admin (audit log), gửi thông báo cho người dùng khi tin bị duyệt/từ chối.
- Settings cache trong bộ nhớ 1 process API — chạy nhiều instance cần cache dùng chung.
- Chat realtime: **UI xong**, backend + WebSocket theo [chat-plan.md](chat-plan.md).
- Thông báo, đánh giá người dùng (đã gỡ UI đánh giá vì chưa có backend).
- Ảnh bìa hồ sơ riêng (đang dùng dải màu chung), ứng dụng mobile / link tải app.
- Đăng nhập Google/Facebook (nút hiển thị nhưng chưa nối).
- Hết hạn tin tự động, tiện ích (amenities), video.
- Lưu tìm kiếm (hiện chỉ nhớ trong phiên), lịch sử xem tin.
- Dữ liệu tỉnh/thành cố định trong `CITIES` (`apps/web/src/constants`), quận/huyện nhập tay.
- Geocoding: bản đồ chỉ hiện khi tin có `address.geo`.
- Trang tĩnh: chính sách sử dụng / bảo mật.
