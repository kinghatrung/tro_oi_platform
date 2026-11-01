# Kế hoạch & hướng dẫn: Chat realtime (WebSocket)

> Trạng thái: **giao diện đã xong, backend chưa làm.** File này là hướng dẫn từng bước để bạn tự triển khai.
> Khi làm xong phần nào, chuyển nội dung tương ứng sang `api.md` / `project-structure.md` (docs mô tả trạng thái thật).

## 1. Mục tiêu (MVP)

- Chat **1-1** giữa người tìm trọ và người đăng, **gắn với 1 tin đăng** (mỗi cặp người thuê + tin = 1 cuộc trò chuyện).
- Gửi/nhận tin nhắn văn bản realtime, lưu lịch sử, đếm tin chưa đọc.
- Ngoài phạm vi MVP: gửi ảnh, "đang nhập...", thông báo đẩy, chat nhóm.

## 2. Những gì đã có sẵn

| Phần | File | Ghi chú |
| --- | --- | --- |
| Type dùng chung | `packages/shared/src/types/chat.ts` | `Conversation`, `ChatMessage`, `ChatParticipant`, `MessageStatus` — backend trả **đúng** các shape này |
| UI thuần | `apps/web/src/components/chat/*` | `ConversationList`, `ChatWindow`, `MessageBubble`, `ChatComposer` — không cần sửa |
| Trang | `apps/web/src/app/(public)/(private)/tin-nhan/page.tsx` | `/tin-nhan?listingId=&text=` |
| **Điểm nối** | `.../tin-nhan/useChat.ts` | Hiện chỉ giữ state cục bộ. **Bạn chỉ cần viết lại ruột hook này** (giữ nguyên giá trị trả về) |
| Lối vào | `AgentCard` (nút "Chat với người đăng"), lightbox ảnh (câu hỏi nhanh), Navbar ("Tin nhắn") | |

## 3. Kiến trúc

```
 Web (Next.js)                              API (NestJS)                    MongoDB
 ┌────────────────────┐   REST (axios)     ┌──────────────────────┐
 │ useChat()          │ ─────────────────▶ │ ChatController       │──┐
 │  - lịch sử, list   │   GET/POST         │  /conversations ...  │  │   conversations
 │                    │                    └──────────────────────┘  ├─▶ messages
 │  - gửi / nhận      │   Socket.IO /chat  ┌──────────────────────┐  │
 │    realtime        │ ◀═══════════════▶ │ ChatGateway          │──┘
 └────────────────────┘   ws + ack         │  room "user:<id>"    │
                                           └──────────────────────┘
```

- **REST** cho dữ liệu cần phân trang/tải lại (danh sách cuộc trò chuyện, lịch sử tin nhắn). Dùng chung `JwtAuthGuard` và format `{ code, message, data }`.
- **Socket.IO** chỉ cho việc realtime: gửi tin (có ack), nhận tin mới, đánh dấu đã đọc.
- Mỗi socket sau khi xác thực join room `user:<userId>`. Server phát sự kiện tới room của **cả 2 người** → mở nhiều tab vẫn nhận đủ.

**Vì sao Socket.IO thay vì `ws` thuần:** có sẵn room, ack (xác nhận đã nhận), tự reconnect, fallback long-polling, và Nest hỗ trợ chính thức (`@nestjs/platform-socket.io`).

## 4. Mô hình dữ liệu

### `conversations`

| Field | Kiểu | Ghi chú |
| --- | --- | --- |
| `listing` | ObjectId → Listing | |
| `renter` | ObjectId → User | người nhắn trước (người tìm trọ) |
| `owner` | ObjectId → User | người đăng tin (`listing.author`) |
| `lastMessage` | `{ content, sender, createdAt }` | để hiện danh sách mà không cần join |
| `unreadByRenter`, `unreadByOwner` | number | tăng khi người kia gửi, về 0 khi đọc |
| `createdAt`, `updatedAt` | Date | `updatedAt` = thời điểm tin cuối → sort danh sách |

Index: `{ listing: 1, renter: 1 }` **unique** (find-or-create không tạo trùng), `{ renter: 1, updatedAt: -1 }`, `{ owner: 1, updatedAt: -1 }`.

### `messages`

| Field | Kiểu | Ghi chú |
| --- | --- | --- |
| `conversation` | ObjectId → Conversation | |
| `sender` | ObjectId → User | |
| `content` | string | 1–1000 ký tự, đã `trim` |
| `createdAt` | Date | |

Index: `{ conversation: 1, createdAt: -1 }` (phân trang lịch sử).

## 5. Hợp đồng API (đề xuất)

### REST (đều 🔒 `JwtAuthGuard`)

| Method | Path | Body / Query | `data` trả về |
| --- | --- | --- | --- |
| GET | `/conversations` | | `Conversation[]` (mới nhất trước, `otherUser` + `unreadCount` tính theo người gọi) |
| POST | `/conversations` | `{ listingId }` | `Conversation` — find-or-create. 400 nếu tự nhắn tin của mình, 404 nếu tin không active |
| GET | `/conversations/:id/messages` | `?before=<ISO>&limit=30` | `ChatMessage[]` (cũ → mới). 403 nếu không phải thành viên |
| PATCH | `/conversations/:id/read` | | `null` — reset unread của người gọi |

### Socket.IO — namespace `/chat`

Kết nối: `io(`${API_URL}/chat`, { auth: { token: accessToken } })`.

| Hướng | Event | Payload | Ghi chú |
| --- | --- | --- | --- |
| client → server | `message:send` | `{ conversationId, content, clientId }` | **ack**: `{ ok: true, message: ChatMessage }` hoặc `{ ok: false, error: string }` |
| client → server | `conversation:read` | `{ conversationId }` | |
| server → client | `message:new` | `{ message: ChatMessage, conversation: Conversation }` | gửi tới room `user:<renter>` và `user:<owner>` |
| server → client | `conversation:read` | `{ conversationId, userId }` | (tuỳ chọn) để hiện "đã xem" |

`clientId` = id tạm FE tạo (`crypto.randomUUID()`), dùng để thay tin "đang gửi" bằng tin thật khi nhận ack.

## 6. Hướng dẫn từng bước

### Bước 1 — Cài package

```bash
yarn workspace api add @nestjs/websockets @nestjs/platform-socket.io
yarn workspace web add socket.io-client
```

### Bước 2 — Schema (`apps/api/src/modules/chat/schemas/`)

Làm giống `listing.schema.ts`: `@Schema({ timestamps: true, collection: 'conversations' })`, ref dùng `MongooseSchema.Types.ObjectId` (**không** dùng `Types.ObjectId` — sẽ không cast được id string, lỗi đã gặp ở listing). Khai báo index ở cuối file:

```ts
ConversationSchema.index({ listing: 1, renter: 1 }, { unique: true });
ConversationSchema.index({ renter: 1, updatedAt: -1 });
ConversationSchema.index({ owner: 1, updatedAt: -1 });
MessageSchema.index({ conversation: 1, createdAt: -1 });
```

Viết mapper `toConversation(doc, viewerId)` và `toMessage(doc)` (giống `listing.mapper.ts`) để trả đúng type shared: `otherUser` = người **không phải** `viewerId`, `unreadCount` = `unreadByRenter` hoặc `unreadByOwner` tuỳ viewer.

### Bước 3 — `ChatService`

Các hàm cần có (mọi hàm nhận `userId` từ JWT, **không tin** id client gửi):

```ts
listConversations(userId)                        // find({ $or: [{ renter }, { owner }] }).sort({ updatedAt: -1 }).populate(...)
startConversation(userId, listingId)             // listing active? author !== userId? → findOneAndUpdate(..., { upsert: true })
getMessages(userId, conversationId, before?, limit = 30)
sendMessage(userId, conversationId, content)     // kiểm tra thành viên, trim, 1..1000 ký tự → create message
                                                 // → cập nhật lastMessage, $inc unread của người kia, updatedAt
markRead(userId, conversationId)
private assertMember(userId, conversation)       // ForbiddenException nếu không phải renter/owner
```

### Bước 4 — `ChatController` (REST)

Mỏng như `ListingController`: `@Controller('conversations')`, `@UseGuards(JwtAuthGuard)`, `@CurrentUser()`. DTO: `StartConversationDto { @IsMongoId() listingId }`, query `before` (`@IsISO8601()`), `limit` (`@Type(() => Number) @Min(1) @Max(50)`).

### Bước 5 — `ChatGateway` (Socket.IO)

```ts
@WebSocketGateway({ namespace: '/chat', cors: { origin: process.env.WEB_ORIGIN?.split(',') ?? 'http://localhost:3001' } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private readonly jwtService: JwtService, private readonly config: ConfigService, private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      const payload = await this.jwtService.verifyAsync<AuthUser>(token, { secret: this.config.getOrThrow('JWT_SECRET') });
      client.data.user = payload;
      await client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect(true); // token sai/hết hạn
    }
  }

  @SubscribeMessage('message:send')
  async onSend(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string; content: string; clientId: string }) {
    try {
      const { message, conversation } = await this.chatService.sendMessage(client.data.user.sub, body.conversationId, body.content);
      // phát cho cả 2 người (mọi tab); mapper conversation tính theo từng người nhận
      this.server.to(`user:${conversation.renter}`).emit('message:new', { message, conversation: /* toConversation(…, renter) */ });
      this.server.to(`user:${conversation.owner}`).emit('message:new', { message, conversation: /* toConversation(…, owner) */ });
      return { ok: true, message, clientId: body.clientId };   // return = ack
    } catch (error) {
      return { ok: false, error: (error as Error).message, clientId: body.clientId };
    }
  }

  @SubscribeMessage('conversation:read')
  onRead(@ConnectedSocket() client: Socket, @MessageBody() body: { conversationId: string }) {
    return this.chatService.markRead(client.data.user.sub, body.conversationId);
  }
}
```

Lưu ý:
- `ChatModule` import `AuthModule` (đã export `JwtModule`) và `MongooseModule.forFeature([Conversation, Message, Listing])`, đăng ký vào `AppModule`.
- `ResponseInterceptor`/`HttpExceptionFilter` **không** áp dụng cho WebSocket → tự bắt lỗi và trả `{ ok: false, error }` trong ack như trên.
- `ValidationPipe` global cũng không áp cho gateway → kiểm tra `content` trong service (hoặc `@UsePipes(new ValidationPipe())` trên handler).

### Bước 6 — FE: viết lại ruột `useChat.ts`

1. `src/lib/socket.ts`: tạo **1 socket dùng chung** (lazy):
   ```ts
   let socket: Socket | null = null;
   export function getChatSocket() {
     socket ??= io(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'}/chat`, {
       auth: (cb) => cb({ token: getAccessToken() }), // đọc token mới mỗi lần reconnect
       autoConnect: false,
     });
     return socket;
   }
   ```
2. `src/api/chat.ts`: `getConversations`, `startConversation(listingId)`, `getMessages(id, before?)`, `markRead(id)` — theo mẫu `src/api/listings.ts`.
3. Trong `useChat`:
   - mount: `getConversations()` → `setConversations`; `socket.connect()`; `isConnected` = state cập nhật từ `socket.on('connect' | 'disconnect')`.
   - `startConversation(listing)`: gọi `POST /conversations` → thêm/đưa lên đầu danh sách → `setActiveId(conversation.id)` (bỏ id `draft-…`).
   - `selectConversation(id)`: `getMessages(id)` (cache theo `messagesByConversation`) + `markRead(id)`.
   - `sendMessage(content)`: thêm tin tạm `status: SENDING, id: clientId` → `socket.timeout(10_000).emit('message:send', payload, (err, ack) => …)` → thành công: thay tin tạm bằng `ack.message`; lỗi/timeout: `status: FAILED`.
   - `socket.on('message:new', ({ message, conversation }) => …)`: bỏ qua nếu `message` trùng id đã có (tin của chính mình đã nhận qua ack), cập nhật danh sách; nếu cuộc đang mở thì `markRead`.
   - cleanup: `socket.off(...)` trong `useEffect` return. **Không** `disconnect` khi rời trang nếu muốn badge Navbar vẫn nhận tin.
4. Badge chưa đọc trên Navbar (tuỳ chọn): đưa tổng `unreadCount` vào `useAuthStore` hoặc store chat riêng.

### Bước 7 — Kiểm thử

- Unit test `ChatService`: tự nhắn tin của mình → 400; người ngoài đọc/gửi → 403; nội dung rỗng/quá 1000 ký tự → lỗi; gửi tin tăng unread của **người kia**.
- Thủ công: mở 2 trình duyệt (1 cửa sổ ẩn danh), đăng nhập dev-login `0900000002` (người thuê) và `0900000001` (người đăng, chủ tin seed) → từ trang tin của `0900000001` bấm "Chat với người đăng" → gửi qua lại, kiểm tra realtime, tải lại trang vẫn còn lịch sử, unread về 0 khi mở.
- Tắt API giữa chừng → banner "chưa kết nối", tin gửi chuyển FAILED; bật lại → tự reconnect.

## 7. Bảo mật & vận hành

- Xác thực **lúc connect** và kiểm tra thành viên **ở mọi event** (không tin `conversationId` client gửi).
- Giới hạn độ dài nội dung; render tin nhắn dạng text (UI đã dùng `whitespace-pre-line`, không `dangerouslySetInnerHTML`).
- Chống spam: giới hạn số tin/giây mỗi socket (đếm trong `client.data`), hoặc `@nestjs/throttler`.
- Token hết hạn khi đang kết nối: socket vẫn sống tới khi reconnect → khi `connect_error` do token, FE xoá cookie và chuyển `/dang-nhap`.
- Chạy nhiều instance API: cần `@socket.io/redis-adapter` để phát sự kiện giữa các instance.

## 8. Checklist khi hoàn thành

```
[ ] api.md: thêm mục Conversations (REST) + Socket.IO events
[ ] project-structure.md: module chat (api), src/lib/socket.ts, src/api/chat.ts, bỏ "Chat" khỏi backlog
[ ] Xoá banner "chưa kết nối" mặc định (isConnected lấy từ socket thật)
[ ] Xoá shortcut id "draft-…" trong useChat
[ ] Unit test ChatService pass
```
