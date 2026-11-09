import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import type { Server, ServerOptions } from 'socket.io';

/**
 * Socket.IO dùng chung danh sách origin với CORS của HTTP (env WEB_ORIGIN).
 * Có REDIS_URL → sự kiện chat phát qua Redis pub/sub, nhiều instance API thấy nhau.
 */
export class ChatIoAdapter extends IoAdapter {
  private redisAdapter?: ReturnType<typeof createAdapter>;

  constructor(
    app: INestApplicationContext,
    private readonly origins: string[],
  ) {
    super(app);
  }

  /** Gọi trước app.listen; Redis không kết nối được → ném lỗi, API không khởi động. */
  async connectToRedis(url: string) {
    const pubClient = new Redis(url, { lazyConnect: true });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.redisAdapter = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: this.origins, credentials: true },
    } as ServerOptions) as Server;
    if (this.redisAdapter) server.adapter(this.redisAdapter);
    return server;
  }
}
