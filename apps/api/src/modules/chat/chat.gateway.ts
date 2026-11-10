import { HttpException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayInit,
} from '@nestjs/websockets';
import type { Model } from 'mongoose';
import type { Namespace, Socket } from 'socket.io';

import type { AuthUser } from '../../common/current-user.decorator.js';
import { User, type UserDocument } from '../auth/schemas/user.schema.js';
import { NotificationService } from '../notification/notification.service.js';
import {
  RealtimeService,
  userRoom as room,
} from '../realtime/realtime.service.js';
import { idOf, toConversation } from './chat.mapper.js';
import { ChatService } from './chat.service.js';

/** Chống spam: tối đa RATE_LIMIT tin / RATE_WINDOW_MS mỗi kết nối. */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10_000;
/** Khoảng tối thiểu giữa 2 sự kiện "typing" cùng 1 cuộc trò chuyện của 1 socket. */
const TYPING_MIN_GAP_MS = 1000;

type ChatSocket = Socket & { data: { userId: string; sentAt?: number[] } };
type Ack = { ok: true } | { ok: false; error: string };

/** Lỗi nghiệp vụ trả nguyên văn; lỗi khác không lộ chi tiết nội bộ. */
const errorAck = (error: unknown, logger: Logger): Ack => {
  if (error instanceof HttpException)
    return { ok: false, error: error.message };
  logger.error(error);
  return { ok: false, error: 'Không xử lý được, vui lòng thử lại' };
};

/**
 * Socket.IO namespace /chat. Xác thực token lúc kết nối (middleware), mỗi socket vào room
 * "user:<id>" — mọi tab của 1 người đều nhận sự kiện. CORS đặt ở ChatIoAdapter (main.ts).
 * Interceptor/filter/ValidationPipe của HTTP không áp dụng ở đây → tự kiểm tra payload.
 */
@WebSocketGateway({ namespace: '/chat' })
export class ChatGateway implements OnGatewayInit {
  // shortcut: room nằm trong bộ nhớ 1 process — nhiều instance API cần @socket.io/redis-adapter
  @WebSocketServer() private readonly server: Namespace;
  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly chatService: ChatService,
    private readonly realtime: RealtimeService,
    private readonly notificationService: NotificationService,
  ) {}

  afterInit(server: Namespace) {
    this.realtime.attach(server);
    // Lỗi ở middleware → client nhận connect_error("unauthorized") và không tự kết nối lại
    server.use((socket, next) => {
      void this.authenticate(socket as ChatSocket)
        .then(() => next())
        .catch(() => next(new Error('unauthorized')));
    });
  }

  private async authenticate(socket: ChatSocket) {
    const token = (socket.handshake.auth as { token?: unknown }).token;
    if (typeof token !== 'string') throw new Error('missing token');
    const payload = await this.jwtService.verifyAsync<AuthUser>(token, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
    });
    // Giống JwtAuthGuard: tài khoản bị khoá không dùng được chat
    const user = await this.userModel
      .findById(payload.sub)
      .select('isBlocked')
      .exec();
    if (!user || user.isBlocked) throw new Error('blocked');
    socket.data.userId = payload.sub;
    await socket.join(room(payload.sub));
  }

  @SubscribeMessage('message:send')
  async onSend(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: unknown,
  ) {
    try {
      const {
        conversationId,
        content = '',
        images = [],
      } = (body ?? {}) as Record<string, unknown>;
      if (
        typeof conversationId !== 'string' ||
        typeof content !== 'string' ||
        !Array.isArray(images) ||
        !images.every((url) => typeof url === 'string')
      ) {
        return { ok: false, error: 'Dữ liệu không hợp lệ' };
      }
      const now = Date.now();
      const recent = (client.data.sentAt ?? []).filter(
        (time: number) => now - time < RATE_WINDOW_MS,
      );
      if (recent.length >= RATE_LIMIT) {
        return { ok: false, error: 'Bạn gửi quá nhanh, thử lại sau ít giây' };
      }
      client.data.sentAt = [...recent, now];

      const { message, conversation } = await this.chatService.sendMessage(
        client.data.userId,
        conversationId,
        content,
        images as string[],
      );
      // Mỗi người nhận conversation theo góc nhìn của mình (otherUser, unreadCount)
      for (const member of [conversation.starter, conversation.owner]) {
        const memberId = idOf(member);
        this.server.to(room(memberId)).emit('message:new', {
          message,
          conversation: toConversation(conversation, memberId),
        });
      }
      // Người nhận không mở web → thông báo đẩy (1 thông báo / cuộc trò chuyện, tin mới thay tin cũ)
      const [sender, recipient] =
        idOf(conversation.starter) === client.data.userId
          ? [conversation.starter, conversation.owner]
          : [conversation.owner, conversation.starter];
      void this.notificationService.pushIfOffline(idOf(recipient), {
        title: (sender as unknown as { name?: string }).name ?? 'Tin nhắn mới',
        body: message.content || '[Hình ảnh]',
        link: '/tin-nhan',
        tag: `chat-${conversation.id as string}`,
      });
      return { ok: true, message };
    } catch (error) {
      return errorAck(error, this.logger);
    }
  }

  /**
   * "Đang nhập…": chuyển tiếp cho người còn lại. Không ack, lỗi bỏ qua (chỉ là gợi ý giao diện).
   * Client gửi tối đa 1 lần / 2,5s; server bỏ bớt nếu < 1s / cuộc trò chuyện.
   */
  @SubscribeMessage('typing')
  async onTyping(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: unknown,
  ) {
    const { conversationId } = (body ?? {}) as Record<string, unknown>;
    if (typeof conversationId !== 'string') return;
    const now = Date.now();
    const last = (client.data.typingAt ?? {}) as Record<string, number>;
    if (now - (last[conversationId] ?? 0) < TYPING_MIN_GAP_MS) return;
    client.data.typingAt = { ...last, [conversationId]: now };
    try {
      const otherId = await this.chatService.otherMemberId(
        client.data.userId,
        conversationId,
      );
      this.server
        .to(room(otherId))
        .emit('typing', { conversationId, userId: client.data.userId });
    } catch {
      // Không thuộc cuộc trò chuyện / id sai → im lặng
    }
  }

  @SubscribeMessage('conversation:read')
  async onRead(
    @ConnectedSocket() client: ChatSocket,
    @MessageBody() body: unknown,
  ): Promise<Ack> {
    try {
      const { conversationId } = (body ?? {}) as Record<string, unknown>;
      if (typeof conversationId !== 'string') {
        return { ok: false, error: 'Dữ liệu không hợp lệ' };
      }
      await this.chatService.markRead(client.data.userId, conversationId);
      // Đồng bộ các tab khác của chính người đọc (badge Navbar)
      this.server
        .to(room(client.data.userId))
        .emit('conversation:read', { conversationId });
      return { ok: true };
    } catch (error) {
      return errorAck(error, this.logger);
    }
  }
}
