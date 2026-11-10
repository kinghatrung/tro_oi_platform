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
# DB có dữ liệu trước 1/7/2025 (quận/huyện): yarn workspace api migrate:admin-units (chạy lại an toàn)
# Cập nhật danh mục tỉnh/phường khi địa giới thay đổi: yarn geo:build (cần mạng)
# Đường bao lãnh thổ cho bản đồ (Natural Earth, quan điểm Việt Nam): yarn geo:territory (cần mạng)
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
| `API_PUBLIC_URL`         |          | URL công khai của API để tạo link ảnh upload (khi lưu ổ đĩa), mặc định `http://localhost:5000` |
| `REDIS_URL`              |          | Redis cho chat realtime khi chạy nhiều instance (Socket.IO redis-adapter). Bỏ trống = 1 instance. Không kết nối được → API không khởi động |
| `S3_BUCKET`              |          | Bật lưu ảnh lên dịch vụ tương thích S3 (R2, MinIO, AWS). Bỏ trống = ổ đĩa `apps/api/uploads` |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | khi có `S3_BUCKET` | Khoá truy cập + URL công khai đọc ảnh (domain bucket/CDN). Thiếu → API báo lỗi lúc khởi động |
| `S3_REGION`, `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE` |  | Mặc định `auto` / AWS / `false`. R2: endpoint `https://<account>.r2.cloudflarestorage.com`; MinIO: `S3_FORCE_PATH_STYLE=true` |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | | Firebase Admin — cần cho `/auth/verify-phone` |
| `AUTH_DEV_LOGIN`         |          | `true` để bật `/auth/dev-login` (đăng nhập bằng SĐT không OTP). **Không bật ở production** |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | | Email thông báo qua SMTP (nodemailer). Bỏ trống `SMTP_HOST` = tắt kênh email |
| `SMS_PROVIDER`           |          | Bỏ trống = tắt SMS; `log` = chỉ ghi log (số đã che) để thử luồng. Nhà cung cấp thật: thêm nhánh trong `SmsService` |

### `apps/web/.env.local` (mẫu: `.env.example`)

| Biến                                   | Mô tả                                                    |
| -------------------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`                  | URL API, mặc định `http://localhost:5000`                |
| `NEXT_PUBLIC_UPLOAD_URL`               | = `S3_PUBLIC_URL` của API khi ảnh lưu trên S3 (whitelist cho `next/image`). Bỏ trống nếu ảnh lưu trên API |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase Client. **Bỏ trống → trang đăng nhập dùng `/auth/dev-login`** |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Thông báo đẩy (FCM): Sender ID ở Project Settings > General, VAPID key ở Cloud Messaging > Web Push certificates. Bỏ trống → ẩn công tắc push |

---

## `apps/api`

```
src/
├── main.ts                     # bootstrap: CORS, cookie-parser, ValidationPipe, interceptor/filter, static /uploads
├── app.module.ts               # Config + Mongoose + các module
├── seed.ts                     # script tạo dữ liệu mẫu (yarn workspace api seed)
├── migrate-admin-units.ts      # chuyển địa chỉ cũ sang 2 cấp (yarn workspace api migrate:admin-units), logic ở common/admin-units-migration.ts (có test)
├── common/
│   ├── response.interceptor.ts # thành công → { code, message: 'Thành công', data }
│   ├── http-exception.filter.ts# lỗi → { code, message (tiếng Việt), data: null }
│   ├── response-format.spec.ts # test contract ApiResponse
│   ├── current-user.decorator.ts # @CurrentUser() → { sub, phone, role }
│   ├── status-rules.ts         # assertOwnerStatusChange(): chủ tin không tự duyệt tin chờ (có test)
│   ├── moderation.ts           # admin xử lý tin người khác → nhãn nhật ký + thông báo chủ tin (có test)
│   └── provinces.ts            # 34 tỉnh/thành hợp lệ cho address.city — TỰ SINH bởi yarn geo:build
└── modules/
    ├── auth/                   # verify-phone, dev-login, FirebaseService
    │   ├── jwt-auth.guard.ts   # kiểm token + đọc role/isBlocked từ DB mỗi request
    │   ├── admin.guard.ts      # chỉ role admin — dùng SAU JwtAuthGuard
    │   └── schemas/user.schema.ts  # User (phone, name, email, bio, avatar, role, isBlocked, favoriteListingIds, favoriteProductIds, savedSearches)
    ├── user/                   # /users: me, favorites, favorite-products, saved-searches, hồ sơ công khai
    ├── listing/                # /listings (Trọ ơi): tìm kiếm, stats, CRUD, duyệt tin theo settings, hết hạn + nhắc hạn,
    │                           #   báo tin mới khớp tìm kiếm đã lưu (saved-search-match.ts, có test)
    │   ├── listing.filter.ts   # build Mongo filter/sort từ query (có unit test)
    │   └── listing.mapper.ts   # toListing(): document → Listing (shared type)
    ├── product/                # /products (Chợ ơi): tìm kiếm, CRUD, duyệt tin theo settings
    │   ├── product.filter.ts   # (có unit test)
    │   └── product.mapper.ts   # toProduct()
    ├── report/                 # POST /reports — người dùng báo cáo tin / món đồ / đánh giá vi phạm
    ├── settings/               # GET /settings — thiết lập website (singleton, cache bộ nhớ)
    ├── chat/                   # /conversations (REST) + ChatGateway Socket.IO /chat, ChatIoAdapter (CORS) — chat tin Trọ ơi & món Chợ ơi: ảnh (≤4, chỉ URL của StorageService), "typing", push khi người nhận không mở web
    ├── realtime/               # RealtimeService (global): emitToUser / isOnline qua namespace /chat (ChatGateway gắn server) — module khác phát sự kiện không phụ thuộc ChatModule
    ├── page/                   # /pages + /admin/pages/:slug — trang chính sách do admin soạn (page-content.ts tách khối, có test)
    ├── review/                 # /reviews — đánh giá người dùng (chỉ giữa 2 người đã nhắn tin)
    ├── notification/           # /notifications — notify() lưu rồi gửi nền: realtime "notification:new" luôn; push (FCM, chỉ khi không mở web); email (SMTP); SMS (chỗ cắm) theo notifyPrefs. channels/: PushService, MailService, SmsService (thiếu cấu hình → tắt). Cài đặt kênh + token push
    ├── audit/                  # AuditService: nhật ký thao tác admin (đọc qua GET /admin/audit-logs)
    ├── admin/                  # /admin/* — thống kê, người dùng, tin, báo cáo, lưu thiết lập, nhật ký
    └── upload/                 # POST /uploads (multer bộ nhớ) → StorageService: S3 nếu có S3_BUCKET, ngược lại ổ đĩa apps/api/uploads/
```

- Collections: `users`, `listings`, `products`, `reports`, `settings`, `notifications` (TTL 90 ngày), `audit_logs`, `conversations`, `messages`, `reviews`, `pages`.
- Quan hệ: `Listing.author`, `Product.seller`, `Report.reporter`, `Notification.user`, `AuditLog.actor`, `Conversation.starter/owner`, `Message.sender`, `Review.reviewer/target → User._id`; `Conversation.target → Listing | Product` (refPath `targetModel`); `User.favoriteListingIds → Listing._id[]`, `User.favoriteProductIds → Product._id[]`; `Report.targetId → Listing | Product`. `User.savedSearches` là mảng con nhúng.
- **Tài khoản admin:** `yarn workspace api seed` luôn đảm bảo SĐT `0900000000` là admin (dev-login được). Production: đặt `role: 'admin'` cho user thật bằng mongosh, rồi dùng trang `/quan-tri/nguoi-dung` để cấp quyền cho người khác.
- Chi tiết endpoint: [api.md](api.md).

---

## `apps/web`

```
src/
├── app/
│   ├── layout.tsx                     # đọc thiết lập website + cookie theme → metadata, data-theme, --brand
│   ├── providers.tsx                  # Client: SiteSettings context (useSiteSettings), theme (useThemeMode), ConfigProvider
│   ├── not-found.tsx, error.tsx       # trang 404 (có header/footer) và trang lỗi "cúp điện" (SVG động — keyframes error-swing/flicker trong globals.css; nút Thử lại gọi `retry()` để fetch lại, mã lỗi digest + email liên hệ)
│   ├── page.tsx                       # Trang chủ (server, fetch listings + stats)
│   ├── (auth)/dang-nhap/              # Đăng nhập OTP (Firebase) / dev-login
│   ├── (chat)/tin-nhan/               # Chat (UI): layout riêng chỉ có header, full màn hình, không cuộn trang;
│   │                                  #   page + useChat.ts (REST src/api/chat.ts + socket src/lib/socket.ts). Cần đăng nhập (proxy.ts)
│   ├── cho-oi/page.tsx                # Chợ ơi: đầu trang giống trang chủ (Header), dưới ô tìm: danh mục, lọc + lưới, CTA
│   └── (public)/                      # layout: SubHeader + Breadcrumb + Footer
│       ├── tim-kiem/                  # Tìm kiếm (server, filter qua URL) + loading.tsx skeleton
│       ├── phong-tro/[slug]/          # Chi tiết tin, slug = listing id
│       ├── dieu-khoan-su-dung/, chinh-sach-bao-mat/  # Trang chính sách (ContentPage, server); chưa đăng → 404
│       ├── nguoi-dung/[id]/           # Hồ sơ công khai người đăng + đánh giá (ProfileReviews)
│       ├── cho-oi/[id]/               # Chi tiết món đồ Chợ ơi
│       └── (private)/                 # cần đăng nhập (chặn ở src/proxy.ts), layout force-dynamic
│           ├── ca-nhan/               # Hồ sơ của tôi + xem tin (ProfileEditModal.tsx: tên, email, giới thiệu, ảnh đại diện, ảnh bìa)
│           ├── yeu-thich/             # Đã lưu: tab Tin Trọ ơi + Đồ Chợ ơi + Tìm kiếm
│           ├── thong-bao/             # Tất cả thông báo (phân trang), đánh dấu đã đọc
│           ├── dang-tin/              # Đăng / sửa tin (?id=): 6 bước (Hình ảnh có link video YouTube; Vị trí: tỉnh → phường/xã + GeoField ghim bản đồ) + PostSidebar (xem trước, checklist), CategoryPicker
│           └── cho-oi/dang-ban/       # Đăng / sửa món đồ Chợ ơi (?id=): tỉnh → phường/xã + GeoField ghim vị trí gần đúng (tuỳ chọn)
│   └── (seller)/kenh-nguoi-dang/      # Kênh người đăng toàn màn hình (cần đăng nhập, chặn ở src/proxy.ts), layout force-dynamic
│       ├── SellerShell.tsx            #   DashboardShell + thẻ người dùng đầu sidebar
│       ├── page.tsx                   #   Tổng quan: lời chào, số liệu, bản đồ tin đăng (VietnamMap markers), tin xem nhiều nhất, Cần chú ý, đồ bán Chợ ơi
│       ├── tin-dang/                  #   Quản lý tin: bảng lọc (cả Chờ duyệt)/tìm/sắp xếp, cột Hiệu quả + Thời hạn, sửa/ẩn/gia hạn/xoá
│       ├── do-ban/                    #   Đồ đang bán (Chợ ơi), bố cục như tin-dang: lọc trạng thái, tìm theo tên, cột món đồ (danh mục · tình trạng · tỉnh), lượt xem, thời gian; đã bán, ẩn/hiện, sửa, xoá
│       ├── useMyListings.ts           #   hook dùng chung: GET /listings/mine + ẩn/hiện/xoá
│       └── const.tsx                  #   menu sidebar, màu Tag theo trạng thái
│   └── (admin)/quan-tri/              # Trang quản trị toàn màn hình, chỉ admin (UI dùng chung ở components/admin)
│       ├── AdminShell.tsx             #   Chặn không phải admin, rồi DashboardShell (components/admin/layout)
│       ├── const.tsx                  #   ADMIN_MENU (key = URL), ADMIN_BASE
│       ├── page.tsx                   #   Tổng quan (GET /admin/stats): chọn kỳ 7/30/90 ngày, việc cần xử lý (chờ duyệt, báo cáo), 4 thẻ số liệu + sparkline, biểu đồ hoạt động theo ngày (xem dạng bảng được), cơ cấu: vai trò (thanh phân đoạn), trạng thái tin (thanh mảnh + danh sách có icon, màu trạng thái), loại hình / danh mục (cột), tỉnh (lollipop nhấn tỉnh đứng đầu)
│       ├── nguoi-dung/                #   Người dùng: FilterBar (từ khoá + lọc nâng cao vai trò/trạng thái), UserFormDrawer sửa vai trò/khoá
│       ├── tin-tro/, tin-cho/         #   Duyệt / ẩn / xoá tin Trọ ơi, Chợ ơi (ModerationActions)
│       ├── ban-do/                    #   Bản đồ tin: chuyển Trọ ơi (GET /admin/listings/map) / Chợ ơi (GET /admin/products/map); lọc trạng thái / loại hình hoặc danh mục / tỉnh (đổi nguồn → xoá bộ lọc), ghim gom cụm, popup link trang công khai khi đang hiển thị
│       ├── bao-cao/                   #   Báo cáo vi phạm: ẩn tin + đóng báo cáo / bỏ qua
│       ├── nhat-ky/                   #   Nhật ký thao tác admin (lọc nhanh theo loại đối tượng)
│       ├── trang-chinh-sach/          #   Soạn & đăng Điều khoản / Chính sách bảo mật (chèn bản nháp mẫu, chặn đăng khi còn [[...]];
│       │                              #   nội dung chưa lưu giữ thành bản nháp theo từng trang trong localStorage, nút Bỏ bản nháp)
│       ├── thiet-lap/                 #   Thiết lập website trong FormPageLayout (tab Chung, Giao diện, Trang chủ & thông báo, Tính năng)
│       └── useAdminTable.ts           #   hook bảng phân trang phía server + runAction (báo kết quả, tự reload); loading bật ở nơi đổi query, effect chỉ gọi API
├── proxy.ts                           # Next 16 proxy (middleware): thiếu cookie accessToken → /dang-nhap?redirect=
├── api/                               # axiosClient (token cookie, ApiError) + 1 file / domain: auth, users, listings, products, reports, settings, admin, uploads, notifications, chat, reviews, pages
├── stores/useAuthStore.ts             # user, favorites, favoriteProducts, savedSearches, login/logout/toggleFavorite(Product)/toggleSavedSearch + hook useRequireUser()
├── stores/useChatStore.ts             # tổng tin nhắn chưa đọc + trạng thái kết nối socket (MessagesButton ghi, trang /tin-nhan đọc)
├── lib/socket.ts                      # getChatSocket(): 1 kết nối Socket.IO /chat dùng chung, token đọc lại mỗi lần kết nối
├── stores/useNotificationStore.ts     # số chưa đọc + thông báo mới nhất (chuông), markRead/markAllRead dùng chung với /thong-bao, receive() cho thông báo realtime
├── hooks/useSaveToggle.ts             # handler nút Lưu (tin, món đồ, tìm kiếm): chưa đăng nhập → /dang-nhap, lỗi → toast
├── lib/youtube.ts                     # YOUTUBE_URL_PATTERN (trùng api) + youtubeEmbedUrl(): link → iframe youtube-nocookie
├── lib/viewHistory.ts                 # lịch sử đã xem (localStorage, 15 mục): recordView()/readViewHistory() cho tin Trọ ơi, recordProductView()/readProductHistory() cho món Chợ ơi
├── components/
│   ├── layout/                        # Header (banner: trang chủ, Chợ ơi), SubHeader, Navbar (+ NotificationBell: nhận "notification:new" qua socket (badge + toast), hỏi lại khi kết nối lại và mỗi 5 phút dự phòng; MessagesButton: mở socket chat, badge tin nhắn; co theo màn: < lg ẩn ô khu vực + cặp "Trọ ơi!/Chợ ơi!" (Chợ ơi vào từ menu danh mục), < sm ẩn sáng/tối, Tin đã lưu, chuông, Đăng nhập; Tin nhắn / Đăng tin thành nút chỉ-icon), Container, Footer
│   ├── common/                        # UI thuần dùng lại (xem bảng dưới)
│   ├── chat/                          # UI chat thuần: ConversationList, ChatWindow (dòng "đang nhập…"), MessageBubble (ảnh → ImageLightbox), ChatComposer (đính kèm ≤4 ảnh qua POST /uploads, báo typing ≤1 lần/2,5s)
│   └── sections/                      # Khối giao diện theo trang
├── constants/index.ts                 # CATEGORIES, PROVINCES (re-export), FEATURED_CITIES (lưới trang chủ), SORT_OPTIONS, NO_IMAGE
├── constants/vietnam-territory.json  # đường bao lãnh thổ VN gồm Hoàng Sa, Trường Sa (TỰ SINH bởi yarn geo:territory)
├── constants/provinces.ts, wards.json # 34 tỉnh/thành + 3.321 phường/xã/đặc khu theo tỉnh — TỰ SINH bởi yarn geo:build, không sửa tay
├── hooks/useWards.ts                  # useWards(tỉnh): phường/xã của tỉnh, tải wards.json lười (chunk riêng)
├── lib/geocode.ts                     # geocodeAddress(): địa chỉ → toạ độ qua Nominatim (chỉ khi người dùng bấm)
├── lib/siteSettings.ts                # loadSiteSettings() cho Server Component (cache/request, fallback khi API lỗi)
├── lib/constants/constantsProduct.tsx # icon danh mục, màu Tag, khoảng giá, sort của Chợ ơi
├── lib/searchFilters.ts               # toSearchRequest() / toProductSearchRequest(): searchParams → request (bỏ giá trị sai)
├── lib/constants/policyTemplates.ts  # BẢN NHÁP Điều khoản / Chính sách bảo mật (mô tả đúng cách hệ thống xử lý dữ liệu, ô pháp lý [[...]])
├── lib/constants/constantsRoom.tsx    # buildPropertyFeatures(listing), AMENITY_ITEMS (icon + nhãn tiện ích), câu hỏi mẫu
├── utils/helpers.ts                   # formatNumber, formatRelativeTime, formatVietnameseCurrency, formatListingPrice
├── lib/firebase.ts                    # getFirebaseApp() / getFirebaseAuth() (null khi chưa cấu hình)
├── lib/push.ts                        # thông báo đẩy FCM: canUsePush, enablePush (xin quyền → đăng ký public/push-sw.js → token → PUT /notifications/push-tokens), disablePush
├── (public/push-sw.js)               # service worker push: hiện thông báo từ data FCM { title, body, link, tag }, bấm → mở link trong site
├── lib/pushToken.ts                   # token push của trình duyệt (localStorage) + forgetPushToken() khi đăng xuất (không import Firebase → nhẹ bundle chung)
├── theme/antTheme.ts                  # theme AntD gốc (sáng, màu teal)
├── theme/buildTheme.ts                # buildAntTheme(primaryColor, isDark): đổi màu chủ đạo / darkAlgorithm
└── app/globals.css                    # token màu theo theme (--surface, --ink, --brand...) → class bg-surface, text-ink...
```

### Route

| URL                     | Loại          | Data                                                  |
| ----------------------- | ------------- | ----------------------------------------------------- |
| `/`                     | Server        | `GET /listings` (mua bán, cho thuê mới), `GET /listings/stats`; "Tin bạn đã xem" đọc localStorage phía client |
| `/tim-kiem`             | Server        | `GET /listings` từ searchParams: `keyword, city, ward, transaction, category, minPrice, maxPrice (triệu), minArea, maxArea, bedrooms, amenities (wifi,parking), sort, page`. Khu vực: `city` (1 trong 34 tỉnh) + `ward` (phường/xã, khớp chính xác). Nút "Lưu tìm kiếm" → `POST/DELETE /users/me/saved-searches` |
| `/phong-tro/[id]`       | Server        | `GET /listings/:id`, tin tương tự, tin khác của người đăng |
| `/nguoi-dung/[id]`      | Server        | `GET /users/:id`, `GET /listings?authorId=`, `GET /reviews?userId=`; client: `GET /reviews/mine`, `PUT/DELETE /reviews` |
| `/dang-nhap`            | Client        | `POST /auth/verify-phone` hoặc `/auth/dev-login`      |
| `/ca-nhan` 🔒           | Client        | store user, `GET /listings/mine`, `PATCH /users/me`; "Dữ liệu & tài khoản" (`AccountSection`): `GET /users/me/export` → file JSON, `DELETE /users/me` (gõ "XOA TAI KHOAN") → đăng xuất |
| `/kenh-nguoi-dang` 🔒   | Client        | `GET /listings/mine` + `GET /products/mine` → lời chào, số liệu, tin xem nhiều nhất, "Cần chú ý" (tin hết hạn / còn ≤ 7 ngày / chờ duyệt), tóm tắt đồ bán Chợ ơi. bản đồ các tin có vị trí (`address.geo`). Khung toàn màn hình (DashboardShell), sidebar có thẻ người dùng |
| `/tin-nhan` 🔒          | Client        | `GET /conversations`, `POST /conversations` (mở theo `?listingId=` hoặc `?productId=`, `?text=` điền sẵn), `GET /conversations/:id/messages`; gửi/nhận/đã đọc qua Socket.IO `/chat` |
| `/kenh-nguoi-dang/tin-dang` 🔒 | Client | `GET /listings/mine`, `PATCH/DELETE /listings/:id` |
| `/yeu-thich` 🔒         | Client        | store favorites + favoriteProducts + savedSearches (`GET /users/me/favorites`, `/favorite-products`, `/saved-searches`) |
| `/thong-bao` 🔒         | Client        | `GET /notifications`, `PATCH /notifications/:id/read`, `/read-all`; khối "Cách nhận thông báo" (`NotificationSettings`): `GET/PATCH /notifications/preferences`, bật push trên trình duyệt này; thông báo mới qua socket chèn đầu trang 1 |
| `/dang-tin` 🔒          | Client        | `POST /uploads`, `POST /listings`, `PATCH /listings/:id` |
| `/cho-oi`               | Server        | Bố cục như trang chủ Trọ ơi: dải danh mục icon 3D (`public/images/cho-oi/<category>.png`, Fluent Emoji — MIT; tràn khung → nút mũi tên cuộn) → "Đồ bạn đã xem" (localStorage) → tab "Dành cho bạn" (client: danh mục xem nhiều nhất + đồ mới) / "Mới nhất" (`GET /products` từ searchParams: `keyword, category, condition, city, ward, price (khoảng, `cho-tang` = 0đ), sort, page` + ô lọc tình trạng/giá/sắp xếp). Có query → mở sẵn tab "Mới nhất". Tắt Chợ ơi → trang báo tạm đóng |
| `/dieu-khoan-su-dung`, `/chinh-sach-bao-mat` | Server | `GET /pages/:slug` (404 → notFound). Chân trang lấy link từ `GET /pages` |
| `/cho-oi/[id]`          | Server        | `GET /products/:id`, đồ tương tự; nút "Chat với người đăng" → `/tin-nhan?productId=` |
| `/cho-oi/dang-ban` 🔒   | Client        | `POST /uploads`, `POST/PATCH /products`               |
| `/kenh-nguoi-dang/do-ban` 🔒 | Client   | `GET /products/mine`, `PATCH/DELETE /products/:id`    |
| `/quan-tri/*` 🔒 admin  | Client        | `/admin/*`, `PATCH/DELETE /listings|products/:id`, `PUT /admin/settings` |

Breadcrumb (`BreadcrumbItem`) tự sinh từ URL theo `ROUTE_LABELS` — thêm route mới thì thêm nhãn vào đó.

`/`, `/tim-kiem`, `/phong-tro/[id]`, `/nguoi-dung/[id]` render động (fetch API mỗi request). `generateMetadata` dùng chung kết quả với page qua `React.cache`. API trả 404 → `notFound()`.

### Component dùng chung (`components/common`)

| Component          | Vai trò                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| `CardItem`         | Thẻ tin đăng (`listing: Listing`, `column` = dạng hàng ngang), nút Lưu nối store |
| `CarouselItem`     | Carousel 5 thẻ / slide; `renderItem` vẽ thẻ (CardItem hoặc ProductCard); mũi tên lệch -32px ra ngoài thẻ, màn < xl -16px để không tràn màn hình |
| `SearchResultsList`| Toolbar sort + view mode (list/grid) + danh sách + phân trang URL       |
| `HeaderToolbar`    | Sort dropdown + toggle list/grid                                         |
| `PaginationControl`| Phân trang đồng bộ `?page=`                                              |
| `AreaPicker`       | Popup chọn tỉnh/thành + quận → điều hướng `/tim-kiem`                    |
| `ButtonDropdown`, `CardDropdown` | Nút mở dropdown / khung popup có header-footer             |
| `FloatingInput`    | Input label nổi                                                          |
| `LocationCard`   | Ảnh khu vực + số lượng (`unit`: "tin đăng" / "món đồ"); ghép thành lưới 1 lớn + 4 nhỏ bằng `LocationMosaic` (sections/LocationGrid) |
| `VietnamMap`     | Bản đồ duy nhất của web (MapLibre, client-only): `value` = ghim, có `onChange` → bấm/kéo ghim để chọn vị trí; `markers` = nhiều ghim chỉ xem: nguồn GeoJSON gom cụm (bấm cụm → phóng to; cụm trùng toạ độ không tách được → popup danh sách), bấm ghim → popup tiêu đề/dòng phụ/link, tự thu phóng vừa hết. Cao mặc định `h-120` (480px); modal chi tiết tin `75vh`. Style chủ quyền ở `lib/vietnamMapStyle.ts` |
| `ImageLightbox`    | Xem ảnh toàn màn hình + thông tin tin đăng                               |
| `ProductCard`      | Thẻ món đồ Chợ ơi, cùng kiểu thẻ tin Trọ ơi (thời gian + số ảnh trên ảnh) |
| `NotificationList` | Danh sách thông báo (icon theo `kind`, chấm = chưa đọc) — chuông Navbar và `/thong-bao` |
| `RelativeTime`     | "x giờ trước" an toàn khi SSR: server + lần hydrate in ngày `dd/mm/yyyy` giờ VN (`formatVietnamDate`), sau hydrate mới đổi sang tương đối |
| `useIsClient`      | Hook: `false` lúc SSR/hydrate, `true` sau đó — đọc localStorage / thời gian hiện tại mà không lệch HTML |
| `ReportModal`      | Báo cáo tin (Trọ ơi/Chợ ơi) hoặc đánh giá (lý do riêng) → `POST /reports`. Tự gọi API (ngoại lệ có chủ đích) |
| `ThemeToggle`      | Nút sáng/tối (ẩn khi admin tắt `allowThemeToggle`)                       |
| `FormSection`      | Khối form có số bước (đăng tin, đăng bán)                                |
| `GeoField`         | Control `Form.Item` cho `address.geo`: bấm/kéo ghim trên `VietnamMap` hoặc "Tìm theo địa chỉ" (Nominatim) từ các ô địa chỉ cùng form; `emptyHint` đổi lời nhắc (đăng tin, đăng bán) |
| `EmptyState`      | Trạng thái rỗng theo bộ nhận diện (`EmptyVariant`: SEARCH, LISTING, FAVORITE, CHAT → `public/images/empty/*.svg`). **Dùng thay `<Empty>` của AntD** |

### Component quản trị (`components/admin`) — theo bố cục cbs-fe

| Component | Vai trò |
| --- | --- |
| `layout/DashboardShell` | Khung toàn màn hình dùng chung Quản trị + Kênh người đăng: Sider 256/72px thu gọn được (≥ xl), Drawer (< xl), AdminTopBar + breadcrumb; props `base`, `title`, `menu`, `sidebarExtra` |
| `layout/AdminSidebar` | Logo (thu gọn → favicon) + nhãn `badge` + `extra` (vd thẻ người dùng) + Menu; dùng chung cho Sider và Drawer |
| `layout/AdminTopBar` | Nút thu gọn/mở sidebar (màn nhỏ: mở Drawer) + breadcrumb | xem website, sáng/tối, menu tài khoản |
| `PageCard` | Khung trang danh sách, cao đúng bằng Content (trang không cuộn) |
| `FilterBar` | [từ khoá] [lọc nhanh] … [phễu lọc nâng cao (popover Form, số bộ lọc đang bật)] [Tìm kiếm] [Làm mới] |
| `DataTable` | Table + cột STT + `EmptyState`; lấp phần còn lại của PageCard: chỉ thân bảng cuộn (dọc + ngang), header bảng và phân trang cố định ở đáy (CSS `.fill-table` trong globals.css). `mobileKeys` / `withMobileSummary(columns, keys)` (cả bảng Kênh người đăng): điện thoại (< sm) chỉ giữ cột đầu, ẩn STT, các cột trong `keys` (trạng thái, thao tác...) vẽ lại thành 1 hàng dưới cột đầu |
| `EntityCell` | Ô ảnh/avatar + tiêu đề + dòng phụ ở cột đầu bảng (điện thoại rộng tối đa 256px để tiêu đề xuống dòng) |
| `RowActions`, `IconAction` | Nút icon trong cột thao tác: tooltip, link tab mới, Popconfirm; chặn click lan lên dòng |
| `ModerationActions` | Duyệt / từ chối / ẩn / hiện / xoá — dùng chung tin Trọ ơi và Chợ ơi |
| `AppDrawer` | Drawer form/chi tiết: đầu (tiêu đề + mô tả) — thân cuộn + loading — chân chứa nút Huỷ/Lưu |
| `FormPageLayout` | Trang form dài, cùng bố cục AppDrawer (dùng ở Thiết lập website) |
| `FormSectionTitle`, `SwitchField` | Tiêu đề nhóm trường; hàng Switch có mô tả |
| `ImageUrlField`, `ImageListField` | Control Form.Item cho 1 ảnh / danh sách ảnh (tải lên + dán URL) |
| `DashboardCharts` | Biểu đồ SVG tự vẽ cho Tổng quan: `LineChart` (nhiều chuỗi, đường dọc + tooltip theo chuột / phím ←→; số nhãn ngày theo bề rộng, ~56px/nhãn), `ChartLegend`, `SegmentedBar` (cao: in % trong khối / mảnh), `PartLegend`, `CompositionList` (thanh mảnh + dòng icon/số/%), `ColumnChart`, `Lollipop` (nhấn mục đầu), `Sparkline`. Màu chuỗi `--series-1..4` (+ `--series-4-ink` cho chữ trên khối vàng) và màu trạng thái `--status-good/warning/serious` trong globals.css (đã kiểm tra mù màu, có bộ cho nền tối) |

Trang danh sách mới: `useAdminTable` + `PageCard` > `FilterBar` + `DataTable`; form ngắn → `AppDrawer`, form dài → `FormPageLayout`.

### Luồng đăng nhập

1. `/dang-nhap`: nhập SĐT → Firebase gửi OTP (reCAPTCHA invisible) → nhập OTP → lấy ID token → `POST /auth/verify-phone`. Không có Firebase config → `POST /auth/dev-login`.
2. Lưu `accessToken` vào cookie (7 ngày) + `useAuthStore`.
3. `Navbar` gọi `useAuthStore.loadSession()` khi mount: có cookie → `GET /users/me` + favorites, favorite-products, saved-searches.
4. `src/proxy.ts` chặn `/ca-nhan`, `/yeu-thich`, `/thong-bao`, `/dang-tin`, `/kenh-nguoi-dang`, `/tin-nhan`, `/cho-oi/dang-ban`, `/quan-tri` khi chưa có cookie; layout `(auth)` đẩy về `/` khi đã có cookie.
5. Cookie còn nhưng token hết hạn: `loadSession` lỗi → xoá cookie; trang private dùng `useRequireUser()` tự chuyển sang `/dang-nhap`.
6. API trả 401 ở bất kỳ request nào → interceptor xoá cookie.
7. Đăng xuất: `logout()` + `window.location.assign('/')` (reload sạch state).
8. Admin khoá tài khoản → mọi request có token trả 403 ngay (guard đọc DB), đăng nhập lại cũng bị chặn.

### Thiết lập website & theme

1. `app/layout.tsx` gọi `loadSiteSettings()` (`GET /settings`, cache theo request; API lỗi → `FALLBACK_SETTINGS`).
2. Metadata: title `"{siteName}: {tagline}"`, template `"%s | {siteName}"` (page chỉ đặt phần `%s`), description. Favicon render trong `providers.tsx`: `faviconUrl`, riêng Chợ ơi là icon sạp hàng sinh từ `marketplaceColor`.
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
- Admin duyệt / từ chối / ẩn / hiện lại / xoá tin của người khác → chủ tin nhận thông báo (chuông Navbar), thao tác được ghi ở `/quan-tri/nhat-ky`.

---

## `packages/shared`

`src/types/`: `api` (ApiResponse, PagedResponse), `common`, `user`, `auth`, `housing` (Listing), `marketplace` (ProductItem), `report`, `settings` (SiteSettings, ThemeMode), `admin` (AdminStats, query...), `chat`, `upload`; `news`, `jobs`, `survey` mới có type, chưa có API.

Web dùng qua `transpilePackages: ['@tro-oi/shared']`; package trỏ thẳng `src/index.ts`. API **không** import shared (xem coding-rules mục 4).

## Ảnh

- Ảnh người dùng upload: `POST /uploads` → `StorageService`: có `S3_BUCKET` thì lưu `uploads/<tên>` trên S3 (URL theo `S3_PUBLIC_URL`), không thì lưu `apps/api/uploads/` (URL theo `API_PUBLIC_URL`).
- `next.config.ts` whitelist `NEXT_PUBLIC_API_URL` (+ `NEXT_PUBLIC_UPLOAD_URL` khi dùng S3) + `/uploads/**` cho `next/image`. Dev bật `dangerouslyAllowLocalIP` (API ở localhost); **production phải đặt API ở domain công khai**, nếu không `next/image` trả 400 với ảnh upload.
- Ảnh tĩnh của web (`/images/*`, `/logo/*`) nằm trong `apps/web/public` — dữ liệu seed dùng các ảnh này.

---

## Địa chỉ & bản đồ

- **Bản đồ thể hiện chủ quyền Việt Nam** (`VietnamMap` + `lib/vietnamMapStyle.ts`): nền vector OpenFreeMap (OSM, không cần key), style được chỉnh lúc tải:
  - Chỉ kéo/zoom trong khung lãnh thổ gồm quần đảo Hoàng Sa, Trường Sa (`VIETNAM_BOUNDS`); phần ngoài lãnh thổ phủ mờ (nhạt dần khi zoom ≥ 10).
  - Nhãn chỉ dùng `name:vi`, rồi `name:latin` — **không bao giờ hiện chữ Hán**. Đường ranh giới: chỉ vẽ biên giới đất liền của Việt Nam (`adm0_l`/`adm0_r` = `VNM`); bỏ biên giới giữa các nước khác, đường biên trên biển, ranh giới tranh chấp và ranh giới hành chính bên trong (OSM còn tỉnh/huyện cũ).
  - Mọi zoom: ẩn nhãn có tên gốc không phải chữ Latin (địa danh Trung Quốc, Lào, Campuchia). Zoom xa: thêm điều kiện nằm trong đường bao lãnh thổ. Zoom gần: ẩn nhãn không tên nằm ngoài đường bao (biển số đường nước ngoài).
  - Vùng 2 quần đảo: chỉ hiện đảo/đá có tên tiếng Việt và thực thể có tên gốc Latin; ẩn mọi tên đơn vị hành chính, công trình do Trung Quốc đặt ("Tam Sa"...). Luôn có nhãn "Quần đảo Hoàng Sa (Việt Nam)", "Quần đảo Trường Sa (Việt Nam)".
  - Đường bao: `constants/vietnam-territory.json` — Natural Earth 1:10m bản "quan điểm Việt Nam" (gồm 2 quần đảo), sinh bằng `yarn geo:territory`. Chỉ chính xác cỡ km nên chỉ dùng cho lớp mờ và lọc nhãn ở zoom xa.

- Đơn vị hành chính **2 cấp từ 1/7/2025**: `address.city` (34 tỉnh/thành, tên rút gọn vd "Hồ Chí Minh") → `address.ward` (phường/xã/đặc khu, tên đầy đủ vd "Phường Cầu Giấy"). `address.district` chỉ còn ở dữ liệu cũ (hiển thị: `ward ?? district`).
- Danh mục sinh từ provinces.open-api.vn v2 bằng `scripts/build-admin-units.mjs` (kiểm tra đủ 34 tỉnh / 3.321 xã trước khi ghi). API chỉ kiểm tra `city` ∈ 34 tỉnh; `ward` do web chọn từ danh mục.
- Form đăng tin / đăng bán: chọn tỉnh → chọn phường/xã (có tìm kiếm) → ghim bản đồ (`GeoField` + `VietnamMap`): bấm/kéo ghim, hoặc "Tìm theo địa chỉ" (Nominatim, ≤ 1 yêu cầu/giây, người đăng chỉnh lại). Không ghim → tin không có bản đồ. Toạ độ món Chợ ơi (thường là chỗ ở người bán, nhắc ghim gần đúng) hiện **chỉ** dùng cho bản đồ quản trị, không hiện công khai.

## Chạy nhiều instance API

| Phần | Cách dùng chung |
| --- | --- |
| Chat realtime | `REDIS_URL` → Socket.IO redis-adapter. Web chỉ dùng transport WebSocket nên load balancer **không cần sticky session** |
| Ảnh upload | `S3_*` → mọi instance ghi/đọc cùng bucket |
| Cache thiết lập | Mỗi instance cache 30 giây (`SETTINGS_CACHE_MS`): instance khác thấy thay đổi chậm nhất 30 giây |
| Hẹn giờ hết hạn tin | Mọi instance đều chạy mỗi giờ; mỗi tin được nhận nguyên tử (`findOneAndUpdate`) nên không báo trùng (có test 2 instance) |
| Báo tin mới khớp tìm kiếm đã lưu | Chạy ở instance nhận request đăng/duyệt tin; đọc user bằng cursor, ghi thông báo theo lô 500 |
| Giới hạn 10 tin/10 giây chat | Theo từng kết nối socket (không cần dùng chung) |

## Chưa làm (backlog)

- Tin tức, việc làm, khảo sát: mới có type ở shared.
- Báo tin mới khớp tìm kiếm đã lưu so khớp từng tìm kiếm bằng JS (không dùng index) — rất nhiều user cần lưu bộ lọc có cấu trúc để query thẳng Mongo. Tìm kiếm đã lưu dạng cũ có `district=` bị bỏ qua tham số đó.
- Ứng dụng mobile / link tải app.
- Đăng nhập Google/Facebook (nút hiển thị nhưng chưa nối).
- Bản đồ dùng dịch vụ miễn phí OpenFreeMap (không SLA) — cần ổn định/cam kết thì chuyển sang nhà cung cấp trong nước (vd Vietmap, cũng dựa trên MapLibre, giữ nguyên `patchVietnamStyle`) hoặc tự host tile; quy tắc lọc nhãn đã kiểm tra bằng trình duyệt tự động, chưa có test tự động trong repo (web chưa có test runner).
- SMS mới là chỗ cắm (`SMS_PROVIDER=log` chỉ ghi log) — cần hợp đồng + brandname với nhà cung cấp (eSMS, SpeedSMS...) rồi thêm nhánh trong `SmsService`. Push / email cần điền cấu hình Firebase (VAPID) / SMTP mới chạy; chưa thử với dịch vụ thật.
- Email gửi mọi thông báo khi người dùng có email và bật (kể cả "tin mới khớp tìm kiếm") — nhiều thì cần gom thành bản tin ngày. Chưa có link huỷ nhận 1 chạm trong email.
- Tự xoá tài khoản chưa xoá file ảnh đã upload (ổ đĩa / S3) — cần job dọn ảnh không còn tham chiếu. Tải dữ liệu gom trong 1 request (tài khoản rất nhiều tin nhắn → job nền + link tải). Admin vẫn thấy tài khoản đã xoá trong danh sách người dùng (tên "Người dùng đã xoá", SĐT `deleted:<id>`).
- Xoá đánh giá vi phạm chỉ qua trang báo cáo / hồ sơ; chưa có hàng đợi kiểm duyệt đánh giá trước khi hiện.
- Video tin đăng chỉ nhận link YouTube (chưa upload file video), Chợ ơi chưa có video.
- Lịch sử xem tin chỉ lưu trên trình duyệt (localStorage), không đồng bộ theo tài khoản.
- Bản đồ quản trị tối đa 5000 điểm mới nhất mỗi nguồn (`MAP_LIMIT`). Món Chợ ơi đăng trước khi có ô ghim vị trí không có toạ độ → không lên bản đồ tới khi người bán sửa và ghim (seed mới đã có toạ độ).
- Địa chỉ cũ không tự xác định được phường (vd quận cũ tách thành nhiều phường như "Quận 1") cần chủ tin sửa tay; API chưa kiểm tra `ward` thuộc đúng tỉnh.
- Redis adapter và lưu S3 mới test bằng mock/unit test, chưa chạy với Redis/S3 thật.
- Trang chính sách: hạ tầng xong, **nội dung cần người có chuyên môn pháp lý rà soát** rồi admin đăng ở `/quan-tri/trang-chinh-sach`. Đăng nhập chưa có dòng "đồng ý điều khoản".
