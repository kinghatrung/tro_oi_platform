import { join } from 'node:path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { createLlm } from './adapters/llm/index.js';
import { TroiApi } from './adapters/troi-api.js';
import { AdminGuard } from './chat/admin.guard.js';
import { ChatController } from './chat/chat.controller.js';
import { Orchestrator } from './core/orchestrator.js';
import { ChatLog } from './store/chat-log.js';
import { TOOLS } from './tools/index.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // Mỗi IP: 10 câu / phút và 50 câu / ngày (model miễn phí có hạn mức)
    ThrottlerModule.forRoot({
      throttlers: [
        { name: 'minute', ttl: 60_000, limit: 10 },
        { name: 'day', ttl: 86_400_000, limit: 50 },
      ],
      errorMessage: 'Bạn hỏi hơi nhiều rồi, nghỉ một chút rồi hỏi tiếp nhé',
    }),
  ],
  controllers: [ChatController],
  providers: [
    {
      provide: TroiApi,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new TroiApi(
          config.get<string>('API_BASE_URL', 'http://localhost:5000'),
        ),
    },
    {
      provide: Orchestrator,
      inject: [ConfigService, TroiApi],
      useFactory: (config: ConfigService, api: TroiApi) =>
        new Orchestrator(createLlm(config), api, TOOLS),
    },
    {
      provide: ChatLog,
      inject: [ConfigService],
      // Kho riêng của AI (không phải MongoDB) — production gắn volume vào AI_DATA_DIR
      useFactory: (config: ConfigService) =>
        new ChatLog(join(config.get<string>('AI_DATA_DIR', 'data'), 'chat.db')),
    },
    AdminGuard,
  ],
})
export class AppModule {}
