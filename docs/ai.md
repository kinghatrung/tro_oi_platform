# Trợ lý AI — `apps/ai`

Dịch vụ riêng (NestJS, cổng 5300) điều phối model AI + công cụ đọc dữ liệu. **Không có quyền vào MongoDB**: chỉ đọc qua API công khai của Trọ ơi (như trình duyệt), nên chỉ thấy đúng dữ liệu khách thấy. Model là bộ phận thay được (`AI_PROVIDER`).

## Chạy

```bash
cp apps/ai/.env.example apps/ai/.env.local   # mặc định AI_PROVIDER=mock (không cần key)
yarn dev:ai                                  # http://localhost:5300 — cần dev:api chạy ở :5000
```

Web gọi tới `NEXT_PUBLIC_AI_URL` (mặc định `http://localhost:5300`).

| Biến                                    | Ý nghĩa                                                                                                                                                                                                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PORT`                                  | Cổng dịch vụ, mặc định 5300                                                                                                                                                                                                                                    |
| `API_BASE_URL`                          | API Trọ ơi mà công cụ gọi qua HTTP                                                                                                                                                                                                                             |
| `WEB_ORIGIN`                            | CORS — web được gọi tới dịch vụ                                                                                                                                                                                                                                |
| `TRUST_PROXY`                           | Sau nginx = 1 (giới hạn theo IP thật)                                                                                                                                                                                                                          |
| `AI_DATA_DIR`                           | Kho riêng (mặc định `data`): log hội thoại SQLite `<dir>/chat.db` (`node:sqlite`, có sẵn trong Node 24). Production gắn volume                                                                                                                                 |
| `AI_PROVIDER`                           | `mock` (model giả: chỉ hiểu khoảng giá, để thử luồng) / `openai-compatible`                                                                                                                                                                                    |
| `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` | Cho `openai-compatible`: mọi nhà cung cấp có `POST /chat/completions` kiểu OpenAI + function calling (Gemini, Groq, OpenRouter, Ollama…). `AI_MODEL` nhận nhiều tên cách dấu phẩy: model trước lỗi 404 / 408 / 429 / 5xx / hết giờ (20 giây) thì thử model sau |

Gemini (đang dùng khi phát triển): `AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai`, key tạo ở aistudio.google.com, tên model lấy từ `GET {AI_BASE_URL}/models` (bỏ tiền tố `models/`; chỉ chọn bản chữ, không `tts` / `image` / `audio` / `live`). Model Gemini mới trả `extra_content.google.thought_signature` trong mỗi tool call — bộ nối giữ ở `ToolCall.extra` và gửi trả nguyên vẹn (thiếu → 400).

## Cấu trúc (Ports & Adapters)

```
src/
├── main.ts, app.module.ts      # Nest; ThrottlerModule: 10 câu/phút + 50 câu/ngày mỗi IP
├── chat/chat.controller.ts     # POST /chat (SSE), POST /feedback, GET /admin/conversations, GET /health — kiểm body bằng Zod
├── chat/admin.guard.ts         # chỉ admin: hỏi API GET /users/me bằng token người gọi (không đọc DB)
├── store/chat-log.ts           # log hội thoại (SQLite riêng, giữ 90 ngày): lưu lượt, 👍/👎, tự gắn dấu, lọc cho admin
├── core/                       # LÕI, không phụ thuộc model / nguồn dữ liệu
│   ├── ports.ts                #   LlmPort, TroiApiPort, Tool, ChatCard, ChatEvent
│   ├── prompt.ts               #   prompt hệ thống (quy tắc, cách nói "củ" = triệu…) + ngữ cảnh lượt
│   └── orchestrator.ts         #   agent loop: model → công cụ → model …, tối đa 4 vòng
├── adapters/
│   ├── llm/                    #   mock.ts, openai-compatible.ts, index.ts (chọn theo AI_PROVIDER)
│   └── troi-api.ts             #   GET API công khai, bóc { code, message, data }
└── tools/                      # mỗi công cụ 1 file: mô tả + schema Zod + status + run
    ├── tim-tin.ts              #   GET /listings — giá model gửi theo TRIỆU, đổi sang đồng
    ├── tim-do-cu.ts            #   GET /products — giá theo ĐỒNG
    ├── xem-tin.ts              #   GET /listings/:id | /products/:id — mô tả cắt 800 ký tự, đánh dấu là dữ liệu
    └── index.ts                #   TOOLS — thêm khả năng = thêm 1 file + 1 dòng
```

- Tham số model gửi luôn qua schema Zod (`.strict()`); sai / công cụ lạ / API lỗi → trả `{ error }` lại cho model tự sửa, không ném lỗi ra ngoài.
- Tên phường thiếu "Phường" được thêm lại (`normalizeWard`) vì API so khớp chính xác.
- Thẻ tin (`cards`) dựng từ dữ liệu API thật — model không tạo được link / giá giả.

## Agent thao tác giao diện

`tim_tin` / `tim_do_cu` ngoài thẻ còn trả `action` = trang tìm kiếm của web với **cùng bộ lọc** (`listingSearchAction` → `/tim-kiem?…` giá theo triệu; `productSearchAction` → `/cho-oi/tim-kiem?…`, giá chỉ đưa vào khi khớp đúng 1 khoảng `price=` của web). Đường dẫn do công cụ dựng từ tham số đã kiểm, model không tự viết URL. Không mở trang khi model đặt `moTrang: false` (hỏi nhanh / đếm) hoặc 0 kết quả; nhiều lần tìm trong 1 câu → mở theo lần cuối.

`query` = chữ sẽ gõ: tin → từ khoá, không có thì tên phường (bỏ chữ "Phường") / tỉnh (từ khoá tin so khớp cả địa chỉ); đồ cũ → chỉ từ khoá thật (so khớp tên món). `path` mang `keyword=query` để ô giữ đúng chữ đã gõ.

Widget (`lib/assistantActions.ts`) làm như người thật: trang chủ / Chợ ơi dùng ô trên banner, trang tìm kiếm dùng ô từ khoá (`input[aria-label="Từ khoá tìm kiếm"]`; sai khu hoặc không có ô → mở trang tìm kiếm trước). (1) Bộ lọc không gõ được (loại hình, giá…) đặt sẵn lên URL trang hiện tại bằng `history.replaceState(null, …)` — Next cập nhật `useSearchParams` (state phải là `null`, truyền `history.state` cũ thì router bỏ qua), trang tìm kiếm hiện ngay các nút lọc đã chọn; (2) luôn cuộn tới ô tìm kiếm, ô tô màu brand (`.assistant-typing`); (3) xoá chữ cũ, **gõ từng chữ thật** (setter gốc + sự kiện input, ~0,16 giây/chữ); (4) **nhấn Enter** (keydown) → chính ô tìm kiếm mang theo bộ lọc, tới thẳng trang đích (nếu thiếu tham số mới tự mở đúng `path`). Máy bật giảm chuyển động vẫn gõ, chỉ bỏ cuộn mượt. Không có gì để gõ → mở thẳng trang kết quả. Trong lúc thao tác, khung chat thu lại, các bước hiện ở nhãn cạnh nút trợ lý; xong thì mở lại (điện thoại để đóng). Câu trả lời giữ nút "Trang kết quả"; chỉ nhận đường dẫn nội bộ (`isInternalPath`).

## `POST /chat` — Server-Sent Events

Body:

```json
{
  "sessionId": "<uuid — widget tạo, lưu sessionStorage; tuỳ chọn>",
  "messages": [{ "role": "user", "content": "tìm phòng dưới 4 củ ở cầu giấy" }],
  "context": { "page": "/", "section": "housing" }
}
```

`messages`: 1–40 lượt (`user` / `assistant`), lượt cuối là `user` ≤ 1000 ký tự; dịch vụ dùng 10 lượt cuối. `section`: `housing` | `market`. Sai → 400 `{ message }`; quá giới hạn → 429 `{ message }`.

Response `text/event-stream`, theo thứ tự:

| Sự kiện          | `data`                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `status` (0..n)  | `{ text }` — vd "Đang tìm phòng ở Phường Cầu Giấy…"                                                                              |
| `text`           | `{ text }` — câu trả lời (chưa stream từng chữ từ model)                                                                         |
| `cards` (tuỳ)    | `{ items: ChatCard[] }` — `{ kind: listing\|product, id, title, image?, price (đồng), transaction?, area?, address? }`, tối đa 6 |
| `action` (tuỳ)   | `{ type: "open-search", path, query, label }` — agent mở trang kết quả (xem "Agent thao tác giao diện") |
| `done` / `error` | `{ messageId }` (uuid, dùng cho 👍/👎) / `{ message }`                                                                           |

Người dùng đóng khung chat giữa chừng → huỷ gọi model, không lưu log. Các lượt còn lại (kể cả lỗi) được lưu kèm dấu tự gắn: `error`, `no_answer`, `no_results` (công cụ ra 0 kết quả), `tool_error`.

## `POST /feedback`

Body `{ messageId, rating: 1 | -1 }` (ghi đè được) → 204; id không có → 404. Chung giới hạn theo IP với `/chat`.

## `GET /admin/conversations` — chỉ admin

Header `Authorization: Bearer <JWT của web>`: dịch vụ hỏi `GET /users/me` của API (khoá / gỡ quyền có hiệu lực ngay); không có token → 401, không phải admin → 403.

Query `filter` = `review` (mặc định: có dấu hoặc bị 👎) / `disliked` / `liked` / `all`; `page`; `pageSize` ≤ 100. Response `PagedResponse` (không bọc `{ code, message, data }`), mỗi mục: `{ id, sessionId, createdAt, section, page, question, answer, tools: [{ name, args, total?, error? }], cards, model, ms, error?, flags, rating }`. Trang web: `/quan-tri/tro-ly-ai`.

## Deploy

Image `trooi-ai` (`apps/ai/Dockerfile`), service `ai` trong `deploy/docker-compose.yml` (`127.0.0.1:5300`, volume `ai-data` cho `chat.db`), nginx `room-api.kun.io.vn/ai/` → service AI (bỏ tiền tố, `proxy_buffering off` cho SSE). Biến model ở file riêng `/opt/tro-oi/ai.env` (`deploy/ai.env.example`) — container AI không nhận `.env` của API. Web build với GitHub Variable `NEXT_PUBLIC_AI_URL=https://room-api.kun.io.vn/ai`. Chi tiết: [deploy.md](deploy.md).

## Vòng cải thiện

Log → admin lọc "Cần xem lại" (👎, 0 kết quả, lỗi) → sửa `core/prompt.ts` (cách nói, quy tắc) / thêm công cụ / (sắp tới) thêm câu trả lời chuẩn vào kho kiến thức. Nội dung chat được nêu trong mẫu Chính sách bảo mật (`policyTemplates.ts`) — đăng lại trang chính sách sau khi cập nhật.

## Chưa làm

- Stream từng chữ từ model; RAG (kho kiến thức chính sách, hướng dẫn); công cụ thống kê giá (cần `GET /listings/price-stats` bên API). Agent mới mở trang tìm kiếm — chưa tự điền form đăng tin, chưa thao tác trên trang chi tiết.
