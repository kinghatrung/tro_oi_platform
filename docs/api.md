# REST API — Trọ Ơi! (`apps/api`)

- Base URL dev: `http://localhost:5000` (biến `PORT`). Không có global prefix.
- Body/response: JSON, field **camelCase**. Date: ISO 8601 UTC (`2026-11-01T08:00:00.000Z`). Tiền: VND (number).
- CORS cho phép origin trong `WEB_ORIGIN` (mặc định `http://localhost:3001`).
- Type TS tương ứng nằm trong `packages/shared/src/types/*` (cột "Type").

## Định dạng response (contract FE ↔ BE — bắt buộc)

**Mọi** endpoint (thành công lẫn lỗi) trả đúng shape `ApiResponse<T>` trong `packages/shared/src/types/api.ts`:

```jsonc
{ "code": 200, "message": "Thành công", "data": <T> }                // thành công
{ "code": 404, "message": "Không tìm thấy tin đăng", "data": null }   // lỗi
```

| Field     | Kiểu     | Quy ước                                                                 |
| --------- | -------- | ----------------------------------------------------------------------- |
| `code`    | number   | Trùng HTTP status của response. `code < 400` = thành công               |
| `message` | string   | Luôn có, tiếng Việt. Thành công: `"Thành công"`. Lỗi: hiển thị thẳng cho người dùng |
| `data`    | T / null | Payload; `null` khi lỗi hoặc thao tác không trả dữ liệu (DELETE, PUT favorites) |

- Backend: controller chỉ `return data`; `ResponseInterceptor` bọc thành công, `HttpExceptionFilter` bọc lỗi. **Không** tự `res.json(...)` trong controller.
- Lỗi validate (400) gộp các message thành một chuỗi, ngăn cách `; `.
- Message mặc định tiếng Anh của Nest (`Not Found`, `Cannot GET /x`, `File too large`...) được thay bằng tiếng Việt theo `code`. Lỗi không phải `HttpException` → `500` + message chung (không lộ chi tiết).
- Contract có test: `apps/api/src/common/response-format.spec.ts`.
- FE: `apps/web/src/api/axiosClient.ts` trả nguyên `ApiResponse<T>`; `code >= 400` (kể cả khi HTTP 2xx) → ném `ApiError(message, code)`.

| Code   | Khi nào                                           |
| ------ | ------------------------------------------------- |
| 400    | Body/query sai định dạng                          |
| 401    | Thiếu/sai/hết hạn access token                    |
| 403    | Không phải chủ tin / không phải admin / tài khoản bị khoá / tự đổi trạng thái tin chờ duyệt |
| 409    | Báo cáo trùng (đã báo cáo tin này, đang chờ xử lý) |
| 404    | Không tìm thấy (kể cả id không phải ObjectId, route không tồn tại) |
| 413    | File upload > 5 MB                                |
| 500    | Lỗi không mong muốn phía server                   |
| 503    | Firebase chưa cấu hình trên server                |

## Xác thực

- Header `Authorization: Bearer <accessToken>` (JWT HS256, hạn `JWT_EXPIRES_IN`, mặc định 7d).
- Payload: `{ sub: userId, phone, role }`. Guard **đọc lại role/isBlocked từ DB** mỗi request: tài khoản bị khoá → 403 `"Tài khoản đã bị khoá. Liên hệ hỗ trợ."` (kể cả khi đăng nhập).
- 🛡 = chỉ admin (`role: admin`).
- Endpoint đánh dấu 🔒 bắt buộc token.
- Web lưu token ở cookie `accessToken` (không httpOnly, để client gắn header).

---

## Auth — `/auth`

### `POST /auth/verify-phone`

Đăng nhập = đăng ký bằng SĐT. Web xác minh OTP bằng Firebase Client SDK rồi gửi ID token lên.

| Body            | Kiểu   | Bắt buộc |
| --------------- | ------ | -------- |
| `firebaseToken` | string | ✔        |

Response `data` — Type `AuthResponse`:

```json
{ "accessToken": "eyJ...", "isNewUser": true, "user": { "id": "...", "phone": "+84912345678", "name": "Người dùng 5678", "role": "renter", "createdAt": "...", "updatedAt": "..." } }
```

### `POST /auth/dev-login`

**Chỉ bật khi env `AUTH_DEV_LOGIN=true`** (dev/test khi chưa có Firebase). Tắt → 404.

| Body    | Kiểu   | Bắt buộc | Ghi chú                          |
| ------- | ------ | -------- | -------------------------------- |
| `phone` | string | ✔        | `0xxxxxxxxx` hoặc `+84xxxxxxxxx` |

Response giống `verify-phone`.

---

## Users — `/users`

Type `User`: `{ id, name, phone?, email?, bio?, avatar?, coverImage?, role, isBlocked, createdAt, updatedAt }`. `role` ∈ `renter | landlord | agent | admin`.

Type `SavedSearch`: `{ id, query, title, createdAt }` — web mở lại bằng `/tim-kiem?{query}`.

| Method | Path                               | Mô tả                                   | Response `data`         |
| ------ | ---------------------------------- | --------------------------------------- | ----------------------- |
| GET    | `/users/me` 🔒                     | Thông tin user đang đăng nhập           | `User`                  |
| PATCH  | `/users/me` 🔒                     | Cập nhật hồ sơ                          | `User`                  |
| GET    | `/users/me/favorites` 🔒           | Tin đã lưu (chỉ tin còn tồn tại), mới lưu trước | `Listing[]`     |
| PUT    | `/users/me/favorites/:listingId` 🔒 | Lưu tin (idempotent)                   | `null`                  |
| DELETE | `/users/me/favorites/:listingId` 🔒 | Bỏ lưu tin (idempotent)                | `null`                  |
| GET    | `/users/me/favorite-products` 🔒    | Món đồ Chợ ơi đã lưu (chỉ món đang bán), mới lưu trước | `ProductItem[]` |
| PUT    | `/users/me/favorite-products/:productId` 🔒 | Lưu món đồ (idempotent, 404 nếu món không còn bán) | `null` |
| DELETE | `/users/me/favorite-products/:productId` 🔒 | Bỏ lưu món đồ (idempotent)       | `null`                  |
| GET    | `/users/me/saved-searches` 🔒      | Tìm kiếm đã lưu, mới lưu trước          | `SavedSearch[]`         |
| POST   | `/users/me/saved-searches` 🔒      | `{ query (≤1000, query string /tim-kiem không có page), title (≤200) }`. Trùng `query` → trả bản đã có; tối đa 20 (400) | `SavedSearch` |
| DELETE | `/users/me/saved-searches/:id` 🔒  | Xoá tìm kiếm đã lưu (idempotent)        | `null`                  |
| GET    | `/users/:id`                       | Hồ sơ công khai (ẩn `phone`, `email`)   | `User`                  |

`PATCH /users/me` body — Type `UpdateProfileRequest` (tất cả tuỳ chọn):

| Field    | Kiểu   | Validate               |
| -------- | ------ | ---------------------- |
| `name`   | string | 2–50 ký tự             |
| `email`  | string | email hợp lệ           |
| `bio`    | string | ≤ 500 ký tự            |
| `avatar` | string | URL                    |
| `coverImage` | string | URL ảnh bìa (`/uploads`); `""` = gỡ ảnh bìa |

---

## Listings — `/listings`

Type `Listing` (rút gọn):

```jsonc
{
  "id": "6720...", "title": "...", "description": "...", "videoUrl": "https://youtu.be/...",
  "category": "phong-tro | can-ho | nguyen-can | o-ghep",
  "transaction": "rent-room | buy-room",
  "status": "draft | pending | active | expired | closed",
  "price": 3200000, "pricePerSquareMeter": 128000, "area": 25,
  "bedrooms": 1, "bathrooms": 1, "floorCount": 3,
  "direction": "east | west | south | north | north-east | north-west | south-east | south-west",
  "furnishing": "full | basic | empty",
  "amenities": ["wifi", "air-conditioner", "parking"],
  "images": ["http://localhost:5000/uploads/abc.jpg"],
  "address": { "street": "...", "ward": "Phường Cầu Giấy", "city": "Hà Nội", "fullAddress": "...", "geo": { "latitude": 21.03, "longitude": 105.8 } },
  "author": { "id": "...", "name": "...", "avatar": "...", "role": "landlord", "phone": "+84...", "joinedAt": "...", "listingCount": 4 },
  "isFeatured": false, "viewCount": 128, "favoriteCount": 3,
  "expiresAt": "...", "createdAt": "...", "updatedAt": "..."
}
```

- `pricePerSquareMeter` do server tính (`price / area`, làm tròn) khi có `area`.
- `address`: đơn vị hành chính 2 cấp (từ 1/7/2025) — `city` là 1 trong 34 tỉnh/thành (tên rút gọn, danh mục `apps/api/src/common/provinces.ts`), `ward` là phường/xã/đặc khu tên đầy đủ. `district` (quận/huyện) chỉ còn ở dữ liệu cũ.
- `address.fullAddress` do server ghép từ `street, ward, district, city` nếu client không gửi.
- `author.listingCount` chỉ có ở `GET /listings/:id`.
- `viewCount`: mỗi lần gọi `GET /listings/:id` +1 (không đổi `updatedAt`).
- `favoriteCount` (số người đã lưu) chỉ có ở `GET /listings/mine` — dùng cho Kênh người đăng.
- `videoUrl`: link YouTube (không có video → không có field).
- `amenities` ∈ `wifi | air-conditioner | water-heater | washing-machine | fridge | kitchen | private-wc | balcony | elevator | parking | security | free-hours | pets` (luôn là mảng, có thể rỗng).
- `expiresAt`: tin hiển thị 30 ngày (`LISTING_TTL_DAYS`) kể từ lần gần nhất chuyển sang `active` (đăng không cần duyệt / admin duyệt / hiện lại / gia hạn). Quá hạn → API tự chuyển `expired` (kiểm tra lúc khởi động + mỗi giờ). Chủ tin gia hạn bằng `PATCH /listings/:id { status: 'active' }`. Tin `active` cũ chưa có hạn được cấp 1 kỳ khi API khởi động. Còn ≤ 3 ngày → gửi thông báo "Tin sắp hết hạn" (1 lần mỗi kỳ); hết hạn → thông báo "Tin đã hết hạn" (xem [Notifications](#notifications--notifications)).

| Method | Path                 | Mô tả                                               | Response `data`             |
| ------ | -------------------- | --------------------------------------------------- | --------------------------- |
| GET    | `/listings`          | Tìm kiếm tin **active**, phân trang                 | `PagedResponse<Listing>`    |
| GET    | `/listings/stats`    | Đếm tin active theo `transaction × category × city` | `ListingStat[]`             |
| GET    | `/listings/mine` 🔒  | Mọi tin của tôi (mọi status), mới nhất trước, kèm `favoriteCount` | `Listing[]`   |
| GET    | `/listings/:id`      | Chi tiết tin **active**, tăng `viewCount`           | `Listing`                   |
| POST   | `/listings` 🔒       | Đăng tin mới: `active`, hoặc `pending` nếu bật `requireListingApproval` | `Listing`   |
| PATCH  | `/listings/:id` 🔒   | Sửa tin (chủ tin hoặc admin)                        | `Listing`                   |
| DELETE | `/listings/:id` 🔒   | Xoá tin (chủ tin hoặc admin)                        | `null`                      |

### `GET /listings` query — Type `SearchListingRequest`

| Param           | Kiểu   | Mặc định    | Ghi chú                                         |
| --------------- | ------ | ----------- | ----------------------------------------------- |
| `keyword`       | string |             | Tìm không phân biệt hoa thường trong `title`, `address.fullAddress` |
| `transaction`   | enum   |             | `rent-room` / `buy-room`                        |
| `category`      | enum   |             |                                                 |
| `city`          | string |             | Khớp chính xác, vd `Hà Nội`                     |
| `ward`          | string |             | Phường/xã, khớp chính xác (vd `Phường Cầu Giấy`) |
| `minPrice`/`maxPrice` | number |      | VND                                             |
| `minArea`/`maxArea`   | number |      | m²                                              |
| `bedrooms`      | number |             | ≥ giá trị này                                   |
| `amenities`     | string |             | Danh sách ngăn bởi dấu phẩy, vd `wifi,parking` — tin phải có **đủ** mọi tiện ích. Giá trị lạ → 400 |
| `authorId`      | string |             | Tin của 1 người đăng                            |
| `excludeId`     | string |             | Loại 1 tin (dùng cho "tin tương tự")            |
| `page`          | number | 1           | ≥ 1                                             |
| `pageSize`      | number | 10          | 1–50                                            |
| `sortBy`        | enum   | `createdAt` | `createdAt` / `price` / `area`                  |
| `sortDirection` | enum   | `desc`      | `asc` / `desc`                                  |

Response: `{ "items": Listing[], "total": 120, "page": 1, "pageSize": 10 }`.

### `GET /listings/stats`

```json
[{ "transaction": "rent-room", "category": "phong-tro", "city": "Hà Nội", "count": 12, "image": "http://..." }]
```

`image` = ảnh đầu tiên của tin mới nhất trong nhóm (dùng cho thẻ khu vực trang chủ).

### `POST /listings` body — Type `CreateListingRequest`

| Field         | Kiểu          | Bắt buộc | Validate                     |
| ------------- | ------------- | -------- | ---------------------------- |
| `title`       | string        | ✔        | 10–150 ký tự                 |
| `description` | string        |          | ≤ 5000 ký tự                 |
| `videoUrl`    | string        |          | Link YouTube **https**: `youtube.com/watch?v=`, `youtu.be/`, `/shorts/`, `/embed/` (id 11 ký tự). `""` = gỡ video khi sửa |
| `category`    | enum          | ✔        |                              |
| `transaction` | enum          | ✔        |                              |
| `price`       | number        | ✔        | ≥ 0 (VND)                    |
| `area`        | number        |          | > 0                          |
| `bedrooms`, `bathrooms`, `floorCount` | int |  | ≥ 0                         |
| `direction`   | enum          |          |                              |
| `furnishing`  | enum          |          |                              |
| `amenities`   | enum[]        |          | Giá trị như trên (sai → 400 "Tiện ích không hợp lệ") |
| `images`      | string[]      | ✔        | 1–20 URL (lấy từ `/uploads`) |
| `address`     | object        | ✔        | `city` (1 trong 34 tỉnh/thành, sai → 400) và `ward` bắt buộc; `street`, `fullAddress`, `geo { latitude, longitude }` tuỳ chọn; `district` (dữ liệu cũ) tuỳ chọn |

`PATCH /listings/:id`: mọi field của create đều tuỳ chọn, thêm `status`. Chủ tin chỉ chuyển `active ↔ closed` và **không** đổi được tin `pending` (403); admin đổi mọi trạng thái (duyệt = `pending → active`).

Admin đổi trạng thái / xoá tin **của người khác** (Trọ ơi và Chợ ơi) → ghi nhật ký (`/admin/audit-logs`) + gửi thông báo cho chủ tin: duyệt / từ chối (`pending →` khác `active`) / ẩn / hiện lại / xoá. Chỉ sửa nội dung (không đổi trạng thái) thì không ghi. Logic: `apps/api/src/common/moderation.ts` (có test).

---

## Uploads — `/uploads`

### `POST /uploads` 🔒

`multipart/form-data`, field **`files`** (1–10 file), mỗi file ≤ 5 MB, MIME `image/jpeg|png|webp|gif`.

Response `data` — Type `UploadResponse`: `{ "urls": ["http://localhost:5000/uploads/1730450000000-ab12cd.jpg"] }`

Lưu ở S3 khi có env `S3_BUCKET` (URL `S3_PUBLIC_URL/uploads/<tên>`), ngược lại ở ổ đĩa (URL `API_PUBLIC_URL/uploads/<tên>`). Tên file do server sinh ngẫu nhiên. Đuôi file lấy theo MIME (không theo tên file gửi lên); file tĩnh trả kèm `X-Content-Type-Options: nosniff`.

### `GET /uploads/<file>`

File tĩnh từ thư mục `apps/api/uploads/` (không commit vào git) — chỉ khi không dùng S3.

---

## Products (Chợ ơi) — `/products`

Type `ProductItem`: `{ id, title, description, category, condition, status, price, isNegotiable, images, address: { city, ward?, district? (dữ liệu cũ) }, seller: { id, name, avatar, phone, joinedAt }, viewCount, createdAt, updatedAt }`.

- `category` ∈ `furniture | electronics | appliance | vehicle | study | kitchen | fashion | decor | sport | hobby | toy | baby | beauty | pet | other`; `condition` ∈ `new | like-new | good | fair`; `status` ∈ `pending | active | sold | closed`. `price = 0` = cho tặng.

| Method | Path | Mô tả | `data` |
| --- | --- | --- | --- |
| GET | `/products` | Tìm món **active**: `keyword, category, condition, city, ward, minPrice, maxPrice, sellerId, excludeId, page, pageSize (≤50, mặc định 12), sortBy (createdAt/price), sortDirection` | `PagedResponse<ProductItem>` |
| GET | `/products/mine` 🔒 | Mọi món của tôi | `ProductItem[]` |
| GET | `/products/:id` | Chi tiết món active, +1 `viewCount` | `ProductItem` |
| POST | `/products` 🔒 | Đăng bán: `title (5–120), description?, category, condition, price ≥0, isNegotiable?, images (1–10), address.city`. `pending` nếu bật `requireProductApproval`; 403 nếu Chợ ơi đang tắt | `ProductItem` |
| PATCH | `/products/:id` 🔒 | Sửa (người bán/admin). Người bán chuyển được `active / sold / closed`, không đổi tin `pending` | `ProductItem` |
| DELETE | `/products/:id` 🔒 | Xoá (người bán/admin) | `null` |

---

## Reports — `/reports`

### `POST /reports` 🔒

| Body | Kiểu | Ghi chú |
| --- | --- | --- |
| `targetType` | `listing` / `product` | |
| `targetId` | string | id tin, 404 nếu không tồn tại |
| `reason` | `scam / wrong-info / duplicate / unavailable / inappropriate / other` | |
| `note` | string? | ≤ 500 ký tự |

Mỗi người chỉ có 1 báo cáo **đang mở** cho 1 tin (trùng → 409). Admin xử lý ở `/admin/reports`.

---

## Notifications — `/notifications`

Type `AppNotification`: `{ id, kind: info | success | warning | error, title, message?, link? (đường dẫn web), read, createdAt }`. Mongo tự xoá thông báo sau 90 ngày (TTL index).

| Method | Path | Mô tả | `data` |
| --- | --- | --- | --- |
| GET | `/notifications` 🔒 | Thông báo của tôi, mới trước: `page`, `pageSize` (≤50, mặc định 20) | `NotificationPage` = `PagedResponse<AppNotification>` + `unread` |
| GET | `/notifications/unread-count` 🔒 | Số chưa đọc | `{ count }` |
| PATCH | `/notifications/read-all` 🔒 | Đánh dấu tất cả đã đọc | `null` |
| PATCH | `/notifications/:id/read` 🔒 | Đánh dấu 1 thông báo (chỉ của mình; id lạ → bỏ qua) | `null` |

Nguồn thông báo hiện có: admin duyệt/từ chối/ẩn/hiện lại/xoá tin hoặc món đồ; tin Trọ ơi sắp hết hạn / đã hết hạn; có đánh giá mới về mình; **tin mới khớp tìm kiếm đã lưu** (khi tin Trọ ơi lần đầu hiển thị — đăng không cần duyệt hoặc vừa được duyệt; mỗi người tối đa 1 thông báo / tin, không gửi cho chính tác giả; logic so khớp `listing/saved-search-match.ts` cùng ngữ nghĩa bộ lọc `/tim-kiem`, có test).

---

## Chat — `/conversations` + Socket.IO `/chat`

Chat 1-1 giữa **người hỏi** (`starter`) và **chủ tin / người bán** (`owner`), gắn với 1 tin Trọ ơi hoặc 1 món đồ Chợ ơi. Mỗi người chỉ có 1 cuộc trò chuyện cho 1 tin/món đồ.

Type `Conversation`: `{ id, listing: { type: listing | product, id, title, image?, price, transaction? }, otherUser: { id, name, avatar, role }, lastMessage?: ChatMessage, unreadCount, updatedAt }` — `otherUser`, `unreadCount` tính theo người gọi. `listing.id = ""` khi tin đã bị xoá. Type `ChatMessage`: `{ id, conversationId, senderId, content, createdAt }`.

### REST (🔒)

| Method | Path | Body / Query | `data` |
| --- | --- | --- | --- |
| GET | `/conversations` | | `Conversation[]` (mới nhắn trước, tối đa 100) |
| GET | `/conversations/unread-count` | | `{ count }` — tổng tin chưa đọc |
| POST | `/conversations` | `{ listingId }` **hoặc** `{ productId }` | `Conversation` — find-or-create. 400: thiếu/thừa id, tự nhắn tin của mình; 404: tin/món không còn hiển thị |
| GET | `/conversations/:id/messages` | `before?` (ISO), `limit` (1–50, mặc định 30) | `ChatMessage[]` cũ → mới. 403 nếu không phải thành viên |
| PATCH | `/conversations/:id/read` | | `null` — về 0 chưa đọc của người gọi |

### Socket.IO — namespace `/chat`

Kết nối: `` io(`${API_URL}/chat`, { auth: { token: accessToken } }) ``. Token sai / tài khoản bị khoá → `connect_error` với message `unauthorized`. CORS theo `WEB_ORIGIN` (`ChatIoAdapter`). Có `REDIS_URL` → sự kiện phát qua Redis giữa các instance; web kết nối `transports: ['websocket']` (không long-polling) nên không cần sticky session. Ack **không** theo `ApiResponse` (interceptor/filter HTTP bỏ qua WebSocket).

| Hướng | Event | Payload | Ghi chú |
| --- | --- | --- | --- |
| client → server | `message:send` | `{ conversationId, content }` | ack `{ ok: true, message }` / `{ ok: false, error }`. Nội dung trim, 1–1000 ký tự; tối đa 10 tin / 10 giây mỗi kết nối |
| client → server | `conversation:read` | `{ conversationId }` | ack `{ ok }` |
| server → client | `message:new` | `{ message, conversation }` | gửi tới mọi tab của cả 2 người; `conversation` theo góc nhìn người nhận |
| server → client | `conversation:read` | `{ conversationId }` | gửi tới các tab của chính người vừa đọc (đồng bộ badge) |

---

## Reviews — `/reviews`

Type `Review`: `{ id, rating (1–5), comment?, reviewer: { id, name, avatar, role } | null, createdAt, updatedAt }`. Mỗi người viết 1 đánh giá cho 1 người khác (gửi lại = sửa).

| Method | Path | Mô tả | `data` |
| --- | --- | --- | --- |
| GET | `/reviews` | `userId` (bắt buộc), `page`, `pageSize` (≤50, mặc định 10). Công khai | `ReviewPage` = `PagedResponse<Review>` + `average` (1 chữ số thập phân, `null` khi chưa có) + `count` |
| GET | `/reviews/mine` 🔒 | `userId` | `{ canReview, review: Review \| null }` |
| PUT | `/reviews` 🔒 | `{ userId, rating (int 1–5), comment? (≤1000) }` — viết mới / sửa. Lần đầu → thông báo cho người được đánh giá | `Review` |
| DELETE | `/reviews/:id` 🔒 | Người viết hoặc admin (admin xoá → ghi nhật ký `targetType: review`, `targetId` = người được đánh giá) | `null` |

**Điều kiện đánh giá** (`canReview`): không phải chính mình **và** 2 người từng nhắn tin qua lại (có cuộc trò chuyện đã có tin nhắn, ai hỏi ai cũng được). Không đủ → 403.

---

## Pages — `/pages` (trang chính sách)

Trang nội dung do admin soạn: `slug` ∈ `dieu-khoan-su-dung | chinh-sach-bao-mat` (cũng là URL trên web). `content` rỗng = chưa đăng.

| Method | Path | Mô tả | `data` |
| --- | --- | --- | --- |
| GET | `/pages` | Trang đã đăng (link chân trang) | `PageSummary[]` = `{ slug, title, updatedAt }[]` |
| GET | `/pages/:slug` | Trang đã đăng, nội dung đã tách khối. Chưa đăng / slug lạ → 404 | `PublicPage` = `PageSummary` + `blocks` |
| GET | `/admin/pages/:slug` 🛡 | Văn bản gốc để soạn (chưa có → tiêu đề mặc định, `content: ""`, `updatedAt: null`) | `AdminPage` |
| PUT | `/admin/pages/:slug` 🛡 | `{ title (2–100), content (≤ 50.000) }`. `content: ""` = gỡ trang. Còn chuỗi `[[` (ô bản nháp chưa điền) → 400. Ghi nhật ký `targetType: page` | `AdminPage` |

`blocks` (`ContentBlock[]`): `{ type: h2 | h3 | p, text }` hoặc `{ type: ul, items }` — tách từ văn bản: `#`/`##` = h2, `###` = h3, `-`/`*` = gạch đầu dòng, dòng trống = đoạn mới (`page/page-content.ts`, có test). Web render chữ thuần, không HTML.

---

## Settings — `/settings`

### `GET /settings` (công khai)

Type `SiteSettings`: `siteName, tagline, description, logoUrl, faviconUrl, heroTitle, primaryColor (#RRGGBB), marketplaceColor (#RRGGBB), defaultTheme (light/dark), allowThemeToggle, banners[], announcementEnabled, announcementText, announcementType (info/warning/success), contactEmail, contactPhone, footerText, enableMarketplace, requireListingApproval, requireProductApproval, updatedAt`.

Field admin chưa từng sửa lấy theo `DEFAULT_SETTINGS` (`apps/api/src/modules/settings/settings.schema.ts`).

---

## Admin — `/admin` 🛡

Mọi route: `JwtAuthGuard` + `AdminGuard` (không phải admin → 403). Sửa/xoá từng tin dùng chung `PATCH/DELETE /listings/:id`, `/products/:id`.

| Method | Path | Mô tả | `data` |
| --- | --- | --- | --- |
| GET | `/admin/stats` | Người dùng (tổng, bị khoá, mới 7 ngày, `byRole`); tin Trọ ơi (`byStatus`, `byCategory`, `topCities` 6 tỉnh nhiều tin đang hiển thị nhất, `views` tổng lượt xem); tin Chợ ơi (`byStatus`, `byCategory`, `views`); báo cáo đang mở; `daily` = 90 ngày gần nhất `{ date: YYYY-MM-DD, users, listings, products }` số bản ghi mới mỗi ngày theo **giờ Việt Nam**, cũ → mới, ngày trống = 0 | `AdminStats` |
| GET | `/admin/users` | `keyword` (tên / SĐT — gõ `09…` được / email), `role`, `isBlocked`, `page`, `pageSize` | `PagedResponse<AdminUser>` (kèm `listingCount`, `productCount`) |
| PATCH | `/admin/users/:id` | `{ role?, isBlocked? }` — không tự sửa chính mình (400) | `User` |
| GET | `/admin/listings` | Như `GET /listings` + `status` (bỏ trống = mọi trạng thái) | `PagedResponse<Listing>` |
| GET | `/admin/listings/map` | Tin **có toạ độ** (`address.geo`) cho bản đồ quản trị: lọc như `/admin/listings` (`status`, `category`, `city`, `keyword`...), **không phân trang**, tối đa 5000 tin mới nhất. Mỗi phần tử `{ id, title, price, transaction, status, category, city, ward, geo }` | `ListingMapPoint[]` |
| GET | `/admin/products` | Như `GET /products` + `status` | `PagedResponse<ProductItem>` |
| GET | `/admin/reports` | `status`, `targetType`, `page`, `pageSize` | `PagedResponse<Report>` (kèm `targetTitle`, `reporter`) |
| PATCH | `/admin/reports/:id` | `{ status: open / resolved / dismissed }` | `null` |
| PUT | `/admin/settings` | Mọi field `SiteSettings` (trừ `updatedAt`) đều tuỳ chọn, chỉ field gửi lên bị ghi | `SiteSettings` |
| GET | `/admin/audit-logs` | Nhật ký thao tác admin, mới trước: `targetType` (`listing / product / user / report / settings / review / page`), `page`, `pageSize` | `PagedResponse<AuditLog>` |

Type `AuditLog`: `{ id, action (nhãn tiếng Việt), targetType, targetId?, targetTitle?, actor: { id, name, avatar, role } | null, createdAt }`. Được ghi khi: kiểm duyệt tin người khác (xem Listings), `PATCH /admin/users/:id` (chỉ ghi phần thực sự đổi: cấp/gỡ quyền quản trị, khoá/mở khoá), `PATCH /admin/reports/:id`, `PUT /admin/settings`, admin xoá đánh giá (`DELETE /reviews/:id`). Ghi nhật ký lỗi không làm hỏng thao tác chính (chỉ log cảnh báo).

---

## Khác

| Method | Path | Mô tả                    |
| ------ | ---- | ------------------------ |
| GET    | `/`  | Health check — `"Hello World!"` (bọc trong `ApiResponse`) |
