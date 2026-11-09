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
import { idOf, toConversation } from './chat.mapper.js';
import { ChatService } from './chat.service.js';

/** Chống spam: tối đa RATE_LIMIT tin / RATE_WINDOW_MS mỗi kết nối. */
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 10_000;

const room = (userId: string) => `user:${userId}`;

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
  ) {}

  afterInit(server: Namespace) {
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
      const { conversationId, content } = (body ?? {}) as Record<
        string,
        unknown
      >;
      if (typeof conversationId !== 'string' || typeof content !== 'string') {
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
      );
      // Mỗi người nhận conversation theo góc nhìn của mình (otherUser, unreadCount)
      for (const member of [conversation.starter, conversation.owner]) {
        const memberId = idOf(member);
        this.server.to(room(memberId)).emit('message:new', {
          message,
          conversation: toConversation(conversation, memberId),
        });
      }
      return { ok: true, message };
    } catch (error) {
      return errorAck(error, this.logger);
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
