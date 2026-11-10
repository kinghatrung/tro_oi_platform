import { Injectable } from '@nestjs/common';
import type { Namespace } from 'socket.io';

/** Room Socket.IO của 1 người: mọi tab / thiết bị đang mở web của họ. */
export const userRoom = (userId: string) => `user:${userId}`;

/**
 * Đẩy sự kiện realtime tới người dùng qua namespace /chat (ChatGateway gắn server khi khởi động).
 * Module khác (thông báo...) dùng mà không phụ thuộc ChatModule.
 */
@Injectable()
export class RealtimeService {
  private server?: Namespace;

  attach(server: Namespace) {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(userRoom(userId)).emit(event, payload);
  }

  /** Đang mở web ở ít nhất 1 tab (chạy được cả khi nhiều instance dùng redis-adapter). */
  async isOnline(userId: string) {
    if (!this.server) return false;
    const sockets = await this.server.in(userRoom(userId)).fetchSockets();
    return sockets.length > 0;
  }
}
