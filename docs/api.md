# REST API — Trọ Ơi! (`apps/api`)

- Base URL dev: `http://localhost:5000` (biến `PORT`). Không có global prefix.
- Body/response: JSON, field **camelCase**. Date: ISO 8601 UTC (`2026-11-01T08:00:00.000Z`). Tiền: VND (number).
- CORS cho phép origin trong `WEB_ORIGIN` (mặc định `http://localhost:3001`).
- Type TS tương ứng nằm trong `packages/shared/src/types/*` (cột "Type").

## Định dạng response

```jsonc
// Thành công — ResponseInterceptor bọc mọi giá trị controller trả về
{ "success": true, "data": <T> }

// Lỗi — HttpExceptionFilter
{ "success": false, "message": "Thông báo tiếng Việt", "statusCode": 400 }
```

Lỗi validate (400) gộp các message thành một chuỗi, ngăn cách `; `.

| Status | Khi nào                                           |
| ------ | ------------------------------------------------- |
| 400    | Body/query sai định dạng                          |
| 401    | Thiếu/sai/hết hạn access token                    |
| 403    | Không phải chủ tin đăng (và không phải admin)     |
| 404    | Không tìm thấy (kể cả id không phải ObjectId)     |
| 503    | Firebase chưa cấu hình trên server                |

## Xác thực

- Header `Authorization: Bearer <accessToken>` (JWT HS256, hạn `JWT_EXPIRES_IN`, mặc định 7d).
- Payload: `{ sub: userId, phone, role }`.
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

Type `User`: `{ id, name, phone?, email?, bio?, avatar?, role, createdAt, updatedAt }`. `role` ∈ `renter | landlord | agent | admin`.

| Method | Path                               | Mô tả                                   | Response `data`         |
| ------ | ---------------------------------- | --------------------------------------- | ----------------------- |
| GET    | `/users/me` 🔒                     | Thông tin user đang đăng nhập           | `User`                  |
| PATCH  | `/users/me` 🔒                     | Cập nhật hồ sơ                          | `User`                  |
| GET    | `/users/me/favorites` 🔒           | Tin đã lưu (chỉ tin còn tồn tại), mới lưu trước | `Listing[]`     |
| PUT    | `/users/me/favorites/:listingId` 🔒 | Lưu tin (idempotent)                   | `null`                  |
| DELETE | `/users/me/favorites/:listingId` 🔒 | Bỏ lưu tin (idempotent)                | `null`                  |
| GET    | `/users/:id`                       | Hồ sơ công khai (ẩn `phone`, `email`)   | `User`                  |

`PATCH /users/me` body — Type `UpdateProfileRequest` (tất cả tuỳ chọn):

| Field    | Kiểu   | Validate               |
| -------- | ------ | ---------------------- |
| `name`   | string | 2–50 ký tự             |
| `email`  | string | email hợp lệ           |
| `bio`    | string | ≤ 500 ký tự            |
| `avatar` | string | URL                    |

---

## Listings — `/listings`

Type `Listing` (rút gọn):

```jsonc
{
  "id": "6720...", "title": "...", "description": "...",
  "category": "phong-tro | can-ho | nguyen-can | o-ghep",
  "transaction": "rent-room | buy-room",
  "status": "draft | pending | active | expired | closed",
  "price": 3200000, "pricePerSquareMeter": 128000, "area": 25,
  "bedrooms": 1, "bathrooms": 1, "floorCount": 3,
  "direction": "east | west | south | north | north-east | north-west | south-east | south-west",
  "furnishing": "full | basic | empty",
  "images": ["http://localhost:5000/uploads/abc.jpg"],
  "address": { "street": "...", "ward": "...", "district": "Cầu Giấy", "city": "Hà Nội", "fullAddress": "...", "geo": { "latitude": 21.03, "longitude": 105.8 } },
  "author": { "id": "...", "name": "...", "avatar": "...", "role": "landlord", "phone": "+84...", "joinedAt": "...", "listingCount": 4 },
  "isFeatured": false, "createdAt": "...", "updatedAt": "..."
}
```

- `pricePerSquareMeter` do server tính (`price / area`, làm tròn) khi có `area`.
- `address.fullAddress` do server ghép từ `street, ward, district, city` nếu client không gửi.
- `author.listingCount` chỉ có ở `GET /listings/:id`.

| Method | Path                 | Mô tả                                               | Response `data`             |
| ------ | -------------------- | --------------------------------------------------- | --------------------------- |
| GET    | `/listings`          | Tìm kiếm tin **active**, phân trang                 | `PagedResponse<Listing>`    |
| GET    | `/listings/stats`    | Đếm tin active theo `transaction × category × city` | `ListingStat[]`             |
| GET    | `/listings/mine` 🔒  | Mọi tin của tôi (mọi status), mới nhất trước        | `Listing[]`                 |
| GET    | `/listings/:id`      | Chi tiết tin **active**                             | `Listing`                   |
| POST   | `/listings` 🔒       | Đăng tin mới (status = `active`)                    | `Listing`                   |
| PATCH  | `/listings/:id` 🔒   | Sửa tin (chủ tin hoặc admin)                        | `Listing`                   |
| DELETE | `/listings/:id` 🔒   | Xoá tin (chủ tin hoặc admin)                        | `null`                      |

### `GET /listings` query — Type `SearchListingRequest`

| Param           | Kiểu   | Mặc định    | Ghi chú                                         |
| --------------- | ------ | ----------- | ----------------------------------------------- |
| `keyword`       | string |             | Tìm không phân biệt hoa thường trong `title`, `address.fullAddress` |
| `transaction`   | enum   |             | `rent-room` / `buy-room`                        |
| `category`      | enum   |             |                                                 |
| `city`          | string |             | Khớp chính xác, vd `Hà Nội`                     |
| `district`      | string |             | Khớp không phân biệt hoa thường (chứa)          |
| `minPrice`/`maxPrice` | number |      | VND                                             |
| `minArea`/`maxArea`   | number |      | m²                                              |
| `bedrooms`      | number |             | ≥ giá trị này                                   |
| `authorId`      | string |             | Tin của 1 người đăng                            |
| `excludeId`     | string |             | Loại 1 tin (dùng cho "tin tương tự")            |
| `page`          | number | 1           | ≥ 1                                             |
| `pageSize`      | number | 10          | 1–50                                            |
| `sortBy`        | enum   | `createdAt` | `createdAt` / `price` / `area`                  |
| `sortDirection` | enum   | `desc`      | `asc` / `desc`                                  |

Response: `{ "items": Listing[], "total": 120, "page": 1, "pageSize": 10 }`.

### `GET /listings/stats`

```json
[{ "transaction": "rent-room", "category": "phong-tro", "city": "Hà Nội", "count": 12 }]
```

### `POST /listings` body — Type `CreateListingRequest`

| Field         | Kiểu          | Bắt buộc | Validate                     |
| ------------- | ------------- | -------- | ---------------------------- |
| `title`       | string        | ✔        | 10–150 ký tự                 |
| `description` | string        |          | ≤ 5000 ký tự                 |
| `category`    | enum          | ✔        |                              |
| `transaction` | enum          | ✔        |                              |
| `price`       | number        | ✔        | ≥ 0 (VND)                    |
| `area`        | number        |          | > 0                          |
| `bedrooms`, `bathrooms`, `floorCount` | int |  | ≥ 0                         |
| `direction`   | enum          |          |                              |
| `furnishing`  | enum          |          |                              |
| `images`      | string[]      | ✔        | 1–20 URL (lấy từ `/uploads`) |
| `address`     | object        | ✔        | `city`, `district` bắt buộc; `street`, `ward`, `fullAddress`, `geo` tuỳ chọn |

`PATCH /listings/:id`: mọi field của create đều tuỳ chọn, thêm `status` (`active` / `closed`...).

---

## Uploads — `/uploads`

### `POST /uploads` 🔒

`multipart/form-data`, field **`files`** (1–10 file), mỗi file ≤ 5 MB, MIME `image/jpeg|png|webp|gif`.

Response `data` — Type `UploadResponse`: `{ "urls": ["http://localhost:5000/uploads/1730450000000-ab12cd.jpg"] }`

URL tuyệt đối dựa trên env `API_PUBLIC_URL`. Đuôi file lấy theo MIME (không theo tên file gửi lên); file tĩnh trả kèm `X-Content-Type-Options: nosniff`.

### `GET /uploads/<file>`

File tĩnh từ thư mục `apps/api/uploads/` (không commit vào git).

---

## Khác

| Method | Path | Mô tả                    |
| ------ | ---- | ------------------------ |
| GET    | `/`  | Health check — `"Hello World!"` (bọc trong `ApiResponse`) |
