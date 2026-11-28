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
│   ├── llm/                    #   mock.ts, openai-compatible.ts (stream SSE khi có onText), index.ts (chọn theo AI_PROVIDER)
│   └── troi-api.ts             #   GET API công khai, bóc { code, message, data }
└── tools/                      # mỗi công cụ 1 file: mô tả + schema Zod + status + run
    ├── tim-tin.ts              #   GET /listings — giá model gửi theo TRIỆU, đổi sang đồng; phường 0 tin → tự nới ra tỉnh (note)
    ├── tim-do-cu.ts            #   GET /products — giá theo ĐỒNG
    ├── xem-tin.ts              #   GET /listings/:id | /products/:id — mô tả cắt 800 ký tự, đánh dấu là dữ liệu
    ├── thong-ke-gia.ts         #   thong_ke_gia: GET /listings/price-stats — trung vị / TB / thấp / cao (triệu) theo loại; phường 0 tin → cả tỉnh
    ├── huong-dan.ts            #   tra_cuu_huong_dan: RAG đơn giản — trang chính sách (GET /pages, cắt theo h2) + hướng dẫn soạn sẵn (+ thiết lập duyệt tin, liên hệ), xếp hạng theo từ / cặp từ (bỏ dấu), top 3 mục kèm link; nhớ 5 phút
    ├── thao-tac.ts             #   thao tác giao diện: mo_tin, luu_tin, nhan_tin, luu_tim_kiem, bam_nut, doi_giao_dien, mo_trang…
    ├── dien-form.ts            #   điền sẵn form: soan_tin_dang, soan_do_ban, sua_ho_so, viet_danh_gia, bao_cao_tin
    └── index.ts                #   TOOLS — thêm khả năng = thêm 1 file + 1 dòng
```

- Tham số model gửi luôn qua schema Zod (`.strict()`); sai / công cụ lạ / API lỗi → trả `{ error }` lại cho model tự sửa, không ném lỗi ra ngoài.
- Tên phường thiếu "Phường" được thêm lại (`normalizeWard`) vì API so khớp chính xác.
- Thẻ tin (`cards`) dựng từ dữ liệu API thật — model không tạo được link / giá giả.

## Agent thao tác giao diện

| Công cụ | Người dùng nói | `ChatAction` | Widget làm |
| --- | --- | --- | --- |
| `tim_tin`, `tim_do_cu` | "tìm phòng 3–5 triệu ở Cầu Giấy" | `open-search` | gõ vào ô tìm kiếm + Enter (dưới đây) |
| `mo_tin` | "xem phòng thứ 2" | `open-item` | cuộn tới thẻ của tin trên trang, tô sáng, bấm; không có thẻ → mở thẳng |
| `mo_ho_so` | "xem trang của chủ nhà này" | `open-page` | mở `/nguoi-dung/<id người đăng>` |
| `luu_tin` | "lưu / bỏ lưu phòng này" | `click` `save` | mở tin, bấm **Lưu** (`[data-assistant=save]`) tới đúng trạng thái `ensure` (aria-pressed) |
| `nhan_tin` | "hỏi chủ nhà còn phòng không" | `message` | mở tin, cuộn tới khối liên hệ (`[data-assistant=contact]`), mở `/tin-nhan?listingId|productId=&text=` — tin nhắn **soạn sẵn, người dùng tự gửi** |
| `luu_tim_kiem` | "báo tôi khi có phòng mới" | `click` `save-search` | ở `/tim-kiem`: bấm **Lưu tìm kiếm** |
| `bam_nut` | "hiện số chủ nhà", "đánh dấu đã đọc hết", "tải dữ liệu của tôi" | `click` `show-phone` / `mark-all-read` / `export-data` | mở trang (tin / `/thong-bao` / `/ca-nhan`), bấm nút |
| `cai_dat_thong_bao` | "tắt email thông báo" | `click` `notify-email` / `notify-sms` | ở `/thong-bao`: bật / tắt công tắc tới `ensure` (aria-checked) |
| `doi_giao_dien` | "bật chế độ tối" | `set-theme` | bấm nút sáng / tối (`[data-assistant=theme-toggle]`) nếu đang khác |
| `mo_trang` | "xem tin đã lưu / thông báo / quản lý tin" | `open-page` | mở trang trong danh sách cố định (`PAGES`) |
| `dang_xuat` | "đăng xuất" | `logout` | như nút Đăng xuất ở menu (tải lại về trang chủ) |
| `soan_tin_dang`, `soan_do_ban` | "đăng tin cho thuê phòng 3 triệu ở Cầu Giấy…" | `fill-form` `listing` / `product` | mở `/dang-tin` / `/cho-oi/dang-ban`, điền từng ô — người dùng tải ảnh, bấm Đăng |
| `sua_ho_so` | "đổi tên hiển thị thành…" | `fill-form` `profile` (`open: edit-profile`) | ở `/ca-nhan`: mở hộp sửa hồ sơ, điền — người dùng bấm Lưu |
| `viet_danh_gia` | "đánh giá chủ nhà 5 sao" | `fill-form` `review` | ở hồ sơ người đăng: điền số sao + nhận xét — người dùng bấm Gửi. Đã đăng nhập: công cụ hỏi `GET /reviews/mine` trước, chưa nhắn tin qua lại → trả lỗi, model nói rõ, không có thao tác |
| `bao_cao_tin` | "báo cáo tin này lừa đảo" | `fill-form` `report` (`open: report`) | ở trang tin: mở hộp báo cáo, điền lý do — người dùng bấm Gửi |

**Không tự làm** (prompt dặn model hướng dẫn người dùng tự bấm): gửi tin nhắn / đánh giá / báo cáo / đăng tin, xoá tài khoản, ẩn / gia hạn / xoá tin của mình, liên kết Google / Facebook, đổi số điện thoại, bật thông báo đẩy (trình duyệt cần người bấm).

**Điền form** (`fill-form`): trang đăng ký form với `useAssistantForm(key, form, fields, enabled)` và lệnh mở hộp thoại với `useAssistantCommand(name, run)` (`lib/assistantRegistry.ts`) — trợ lý chỉ điền được form đang hiện, chỉ các field trong `fields` (giá trị lạ bị bỏ). Điền lần lượt theo thứ tự trên form, cuộn tới từng ô, rồi kiểm lỗi các ô vừa điền (ô còn trống như ảnh không báo đỏ). Form đang sửa tin cũ (`?id=`) không đăng ký. Chưa đăng nhập → trang tự sang `/dang-nhap`, trợ lý dừng.

Tin / món đồ luôn được kiểm qua API trước (id bịa → 404 trả lại model); đường dẫn do công cụ dựng. Một câu có thể sinh nhiều thao tác (`planActions`: chỉ giữ lần tìm kiếm cuối và làm trước, bỏ trùng, còn lại theo thứ tự gọi — vd tìm rồi lưu tìm kiếm). Việc cần đăng nhập để chính trang xử lý: chưa đăng nhập thì trang tự chuyển tới `/dang-nhap?redirect=` như khi người dùng tự bấm; prompt biết `isLoggedIn` để nhắc. Khi thêm nút / khối mới cho trợ lý bấm, gắn `data-assistant="…"` thay vì tìm theo chữ.

`tim_tin` / `tim_do_cu` ngoài thẻ còn trả `action` = trang tìm kiếm của web với **cùng bộ lọc** (`listingSearchAction` → `/tim-kiem?…` giá theo triệu; `productSearchAction` → `/cho-oi/tim-kiem?…`, giá chỉ đưa vào khi khớp đúng 1 khoảng `price=` của web). Đường dẫn do công cụ dựng từ tham số đã kiểm, model không tự viết URL. Không mở trang khi model đặt `moTrang: false` (hỏi nhanh / đếm) hoặc 0 kết quả; nhiều lần tìm trong 1 câu → mở theo lần cuối.

`query` = chữ sẽ gõ: tin → từ khoá, không có thì tên phường (bỏ chữ "Phường") / tỉnh (từ khoá tin so khớp cả địa chỉ); đồ cũ → chỉ từ khoá thật (so khớp tên món). `path` mang `keyword=query` để ô giữ đúng chữ đã gõ.

Widget (`lib/assistantActions.ts`) làm như người thật: trang chủ / Chợ ơi dùng ô trên banner, trang tìm kiếm dùng ô từ khoá (`input[aria-label="Từ khoá tìm kiếm"]`; sai khu hoặc không có ô → mở trang tìm kiếm trước). (1) Bộ lọc không gõ được (loại hình, giá…) đặt sẵn lên URL trang hiện tại bằng `history.replaceState(null, …)` — Next cập nhật `useSearchParams` (state phải là `null`, truyền `history.state` cũ thì router bỏ qua), trang tìm kiếm hiện ngay các nút lọc đã chọn; (2) luôn cuộn tới ô tìm kiếm, ô tô màu brand (`.assistant-typing`); (3) xoá chữ cũ, **gõ từng chữ thật** (setter gốc + sự kiện input, ~0,16 giây/chữ); (4) **nhấn Enter** (keydown) → chính ô tìm kiếm mang theo bộ lọc, tới thẳng trang đích (nếu thiếu tham số mới tự mở đúng `path`). Máy bật giảm chuyển động vẫn gõ, chỉ bỏ cuộn mượt. Không có gì để gõ → mở thẳng trang kết quả. Trong lúc thao tác, khung chat thu lại, các bước hiện ở nhãn cạnh nút trợ lý; xong thì mở lại (điện thoại để đóng). Câu trả lời giữ nút mở lại cho từng thao tác có trang (Trang kết quả, Đã mở, Tin nhắn soạn sẵn, form đã điền…); chỉ nhận đường dẫn nội bộ (`isInternalPath`).

## `POST /chat` — Server-Sent Events

Header `Authorization: Bearer <JWT>` (tuỳ chọn, web gửi khi đã đăng nhập): công cụ dùng để GET về chính người dùng (vd `viet_danh_gia` hỏi `/reviews/mine`), không ghi vào nhật ký. Không có → khách.

Body:

```json
{
  "sessionId": "<uuid — widget tạo, lưu sessionStorage; tuỳ chọn>",
  "messages": [{ "role": "user", "content": "tìm phòng dưới 4 củ ở cầu giấy" }],
  "context": {
    "page": "/",
    "section": "housing",
    "isLoggedIn": false,
    "recentItems": [{ "kind": "listing", "id": "<24 hex>", "title": "..." }]
  }
}
```

`messages`: 1–40 lượt (`user` / `assistant`), lượt cuối là `user` ≤ 1000 ký tự; dịch vụ dùng 10 lượt cuối. `section`: `housing` | `market`. `recentItems` (≤ 6): thẻ của câu trả lời gần nhất có thẻ — để hiểu "phòng thứ 2" (đưa vào prompt dạng JSON đánh số, coi là dữ liệu); công cụ vẫn kiểm id qua API. Sai → 400 `{ message }`; quá giới hạn → 429 `{ message }`.

Response `text/event-stream`, theo thứ tự:

| Sự kiện          | `data`                                                                                                                           |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `status` (0..n)  | `{ text }` — vd "Đang tìm phòng ở Phường Cầu Giấy…"                                                                              |
| `delta` (0..n)   | `{ text }` — đoạn chữ model vừa sinh (stream), widget nối dần; có thể có ở lượt model gọi công cụ |
| `text`           | `{ text }` — câu trả lời đầy đủ, **thay thế** chữ đã nối từ `delta`. Chữ chỉ dùng `**đậm**`, `[chữ](/đường-dẫn)`, gạch đầu dòng — widget chỉ hiểu 2 dạng đầu (link ngoài hiện chữ) |
| `cards` (tuỳ)    | `{ items: ChatCard[] }` — `{ kind: listing\|product, id, title, image?, price (đồng), transaction?, area?, address? }`, tối đa 6 |
| `action` (0..n)  | `ChatAction` — thao tác agent làm trên giao diện, theo thứ tự widget thực hiện (xem "Agent thao tác giao diện") |
| `done` / `error` | `{ messageId }` (uuid, dùng cho 👍/👎) / `{ message }`                                                                           |

Người dùng đóng khung chat giữa chừng → huỷ gọi model, không lưu log. Các lượt còn lại (kể cả lỗi) được lưu kèm dấu tự gắn: `error`, `no_answer`, `no_results` (công cụ ra 0 kết quả), `tool_error`.

## `POST /feedback`

Body `{ messageId, rating: 1 | -1 }` (ghi đè được) → 204; id không có → 404. Chung giới hạn theo IP với `/chat`.

## `GET /admin/conversations` — chỉ admin

Header `Authorization: Bearer <JWT của web>`: dịch vụ hỏi `GET /users/me` của API (khoá / gỡ quyền có hiệu lực ngay); không có token → 401, không phải admin → 403.

Query `filter` = `review` (mặc định: có dấu hoặc bị 👎) / `disliked` / `liked` / `all`; `page`; `pageSize` ≤ 100. Response `PagedResponse` (không bọc `{ code, message, data }`), mỗi mục: `{ id, sessionId, createdAt, section, page, question, answer, tools: [{ name, args, total?, error? }], cards, model, ms, error?, flags, rating }`. Trang web: `/quan-tri/tro-ly-ai`.

## Deploy

Image `trooi-ai` (`apps/ai/Dockerfile`), service `ai` trong `deploy/docker-compose.yml` (`127.0.0.1:5300`, volume `ai-data` cho `chat.db`), nginx `room-api.kun.io.vn/ai/` → service AI (bỏ tiền tố, `proxy_buffering off` cho SSE). Biến model ở file riêng `/opt/tro-oi/ai.env` (`deploy/ai.env.example`) — container AI không nhận `.env` của API. Web build với GitHub Variable `NEXT_PUBLIC_AI_URL=https://room-api.kun.io.vn/ai`. Chi tiết: [deploy.md](deploy.md).

## Tốc độ, làm tiếp sau đăng nhập

- Model stream (`stream: true` khi orchestrator truyền `onText`): chữ tới trình duyệt ngay khi sinh (`delta`); nhà cung cấp trả JSON thường thì vẫn đọc được. Gemini stream gửi cả lời gọi công cụ trong 1 mảnh (không có `index`, kèm `extra_content`).
- `tim_tin`, `thong_ke_gia` tự nới phường → tỉnh trong cùng lượt; prompt dặn gọi các công cụ độc lập trong cùng 1 lượt (chạy song song). Mỗi vòng model ~1–1,5 giây.
- Thao tác cần đăng nhập (`needsLogin`: điền form, nhắn tin, nút lưu / lưu tìm kiếm / thông báo / tải dữ liệu) khi chưa đăng nhập: widget lưu các thao tác còn lại vào `sessionStorage` (`assistant:pending`, hạn 15 phút), mở `/dang-nhap?redirect=<trang của thao tác>`; đăng nhập xong, rời trang đăng nhập → widget báo "mình làm tiếp" và chạy tiếp.

## Vòng cải thiện

Log → admin lọc "Cần xem lại" (👎, 0 kết quả, lỗi) → sửa `core/prompt.ts` (cách nói, quy tắc) / thêm công cụ / (sắp tới) thêm câu trả lời chuẩn vào kho kiến thức. Nội dung chat được nêu trong mẫu Chính sách bảo mật (`policyTemplates.ts`) — đăng lại trang chính sách sau khi cập nhật.

## Chưa làm

- Tra cứu hướng dẫn so khớp từ khoá (không hiểu từ đồng nghĩa) — kho lớn hơn vài chục mục thì dùng embedding. Hướng dẫn soạn sẵn ở `tools/huong-dan.ts` phải sửa tay khi đổi hành vi web/API. Gemini (OpenAI-compatible) đẩy chữ theo mảng lớn nên chữ hiện dần chỉ rõ với câu dài.
- Agent không tự tải ảnh / video (người dùng tự chọn file), chưa bấm từng dropdown bộ lọc (đặt bộ lọc qua URL). Tên phường AI điền chưa được kiểm với danh sách phường của tỉnh trước khi điền (sai thì form báo lỗi khi bấm Đăng). Thao tác cần đăng nhập (điền form, công tắc thông báo, đăng xuất) mới kiểm bằng typecheck, chưa chạy e2e khi đã đăng nhập.
