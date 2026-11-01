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
│   └── current-user.decorator.ts # @CurrentUser() → JwtPayload
└── modules/
    ├── auth/                   # verify-phone, dev-login, JwtAuthGuard, FirebaseService
    │   └── schemas/user.schema.ts  # User (phone, name, email, bio, avatar, role, favoriteListingIds)
    ├── user/                   # /users: me, favorites, hồ sơ công khai
    ├── listing/                # /listings: tìm kiếm, stats, CRUD
    │   ├── schemas/listing.schema.ts
    │   ├── listing.filter.ts   # build Mongo filter/sort từ query (có unit test)
    │   └── listing.mapper.ts   # toListing(): document → Listing (shared type)
    └── upload/                 # POST /uploads (multer, lưu apps/api/uploads/)
```

- Collections: `users`, `listings`.
- Quan hệ: `Listing.author → User._id`; `User.favoriteListingIds → Listing._id[]`.
- Chi tiết endpoint: [api.md](api.md).

---

## `apps/web`

```
src/
├── app/
│   ├── layout.tsx, providers.tsx      # font, AntdRegistry, ConfigProvider (viVN, theme)
│   ├── not-found.tsx, error.tsx       # trang 404 (có header/footer) và trang lỗi (nút Thử lại)
│   ├── page.tsx                       # Trang chủ (server, fetch listings + stats)
│   ├── (auth)/dang-nhap/              # Đăng nhập OTP (Firebase) / dev-login
│   └── (public)/                      # layout: SubHeader + Breadcrumb + Footer
│       ├── tim-kiem/                  # Tìm kiếm (server, filter qua URL) + loading.tsx skeleton
│       ├── phong-tro/[slug]/          # Chi tiết tin, slug = listing id
│       ├── nguoi-dung/[id]/           # Hồ sơ công khai người đăng
│       ├── cho-oi/                    # Chợ đồ cũ — placeholder
│       └── (private)/                 # cần đăng nhập (chặn ở src/proxy.ts), layout force-dynamic
│           ├── ca-nhan/               # Hồ sơ của tôi + xem tin (ProfileEditModal.tsx)
│           ├── yeu-thich/             # Tin đã lưu
│           ├── dang-tin/              # Đăng / sửa tin (?id=), const.tsx = options form
│           └── kenh-nguoi-dang/       # Kênh người đăng: layout sidebar (SellerSidebar)
│               ├── page.tsx           #   Tổng quan: thống kê tin/lượt xem/lượt lưu, top tin
│               ├── tin-dang/          #   Quản lý tin: bảng lọc/tìm/sắp xếp, sửa/ẩn/xoá
│               ├── useMyListings.ts   #   hook dùng chung: GET /listings/mine + ẩn/hiện/xoá
│               └── const.tsx          #   menu sidebar, màu Tag theo trạng thái
├── proxy.ts                           # Next 16 proxy (middleware): thiếu cookie accessToken → /dang-nhap?redirect=
├── api/                               # axiosClient (token cookie, ApiError) + 1 file / domain: auth, users, listings, uploads
├── stores/useAuthStore.ts             # user, favorites, login/logout/toggleFavorite + hook useRequireUser()
├── components/
│   ├── layout/                        # Header (trang chủ), SubHeader, Navbar, Container, Footer
│   ├── common/                        # UI thuần dùng lại (xem bảng dưới)
│   └── sections/                      # Khối giao diện theo trang
├── constants/index.ts                 # CATEGORIES, CITIES, SORT_OPTIONS
├── lib/searchFilters.ts               # toSearchRequest(): searchParams → SearchListingRequest (bỏ giá trị sai)
├── lib/constants/constantsRoom.tsx    # buildPropertyFeatures(listing), câu hỏi mẫu
├── utils/helpers.ts                   # formatNumber, formatRelativeTime, formatVietnameseCurrency, formatListingPrice
├── lib/firebase.ts                    # khởi tạo Firebase client (null khi chưa cấu hình)
└── theme/antTheme.ts, app/globals.css # token màu, font, component override
```

### Route

| URL                     | Loại          | Data                                                  |
| ----------------------- | ------------- | ----------------------------------------------------- |
| `/`                     | Server        | `GET /listings` (mua bán, cho thuê mới), `GET /listings/stats` |
| `/tim-kiem`             | Server        | `GET /listings` từ searchParams: `keyword, city, district, transaction, category, minPrice, maxPrice (triệu), sort, page` |
| `/phong-tro/[id]`       | Server        | `GET /listings/:id`, tin tương tự, tin khác của người đăng |
| `/nguoi-dung/[id]`      | Server        | `GET /users/:id`, `GET /listings?authorId=`           |
| `/dang-nhap`            | Client        | `POST /auth/verify-phone` hoặc `/auth/dev-login`      |
| `/ca-nhan` 🔒           | Client        | store user, `GET /listings/mine`, `PATCH /users/me` |
| `/kenh-nguoi-dang` 🔒   | Client        | `GET /listings/mine` → thống kê                      |
| `/kenh-nguoi-dang/tin-dang` 🔒 | Client | `GET /listings/mine`, `PATCH/DELETE /listings/:id` |
| `/yeu-thich` 🔒         | Client        | store favorites (`GET /users/me/favorites`)           |
| `/dang-tin` 🔒          | Client        | `POST /uploads`, `POST /listings`, `PATCH /listings/:id` |
| `/cho-oi`               | Static        | placeholder                                           |

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

### Luồng đăng nhập

1. `/dang-nhap`: nhập SĐT → Firebase gửi OTP (reCAPTCHA invisible) → nhập OTP → lấy ID token → `POST /auth/verify-phone`. Không có Firebase config → `POST /auth/dev-login`.
2. Lưu `accessToken` vào cookie (7 ngày) + `useAuthStore`.
3. `Navbar` gọi `useAuthStore.loadSession()` khi mount: có cookie → `GET /users/me` + `GET /users/me/favorites`.
4. `src/proxy.ts` chặn `/ca-nhan`, `/yeu-thich`, `/dang-tin`, `/kenh-nguoi-dang` khi chưa có cookie; layout `(auth)` đẩy về `/` khi đã có cookie.
5. Cookie còn nhưng token hết hạn: `loadSession` lỗi → xoá cookie; trang private dùng `useRequireUser()` tự chuyển sang `/dang-nhap`.
6. API trả 401 ở bất kỳ request nào → interceptor xoá cookie.
7. Đăng xuất: `logout()` + `window.location.assign('/')` (reload sạch state).

---

## `packages/shared`

`src/types/`: `api` (ApiResponse, PagedResponse), `common` (GeoPoint, AddressInfo, SortDirection...), `user`, `auth`, `housing` (Listing + enum), `upload`, và `marketplace`, `news`, `jobs`, `survey` (mới có type, chưa có API).

Web dùng qua `transpilePackages: ['@tro-oi/shared']`; package trỏ thẳng `src/index.ts`. API **không** import shared (xem coding-rules mục 4).

## Ảnh

- Ảnh người dùng upload: `POST /uploads` → lưu `apps/api/uploads/`, URL tuyệt đối theo `API_PUBLIC_URL`.
- `next.config.ts` whitelist `NEXT_PUBLIC_API_URL` + `/uploads/**` cho `next/image`. Dev bật `dangerouslyAllowLocalIP` (API ở localhost); **production phải đặt API ở domain công khai**, nếu không `next/image` trả 400 với ảnh upload.
- Ảnh tĩnh của web (`/images/*`, `/logo/*`) nằm trong `apps/web/public` — dữ liệu seed dùng các ảnh này.

---

## Chưa làm (backlog)

- Chợ đồ cũ (`/cho-oi`), tin tức, việc làm, khảo sát: mới có type ở shared.
- Chat, thông báo, đánh giá người dùng (UI đánh giá đang hiển thị trạng thái rỗng).
- Đăng nhập Google/Facebook (nút hiển thị nhưng chưa nối).
- Duyệt tin (tin đăng mới `active` ngay), hết hạn tin tự động, tiện ích (amenities), video.
- Lưu tìm kiếm (hiện chỉ nhớ trong phiên), lịch sử xem tin.
- Khung chat trong `ImageLightbox` chưa gửi được tin nhắn.
- Bộ lọc diện tích / số phòng ngủ: API đã hỗ trợ, UI tìm kiếm chưa có.
- Dữ liệu tỉnh/thành cố định trong `CITIES` (`apps/web/src/constants`), quận/huyện nhập tay.
- Geocoding: bản đồ chỉ hiện khi tin có `address.geo`.
- Trang tĩnh: chính sách sử dụng / bảo mật.
