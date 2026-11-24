import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { Redis } from 'ioredis';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { RedisThrottlerStorage } from './common/redis-throttler.storage.js';
import { WriteThrottlerGuard } from './common/write-throttler.guard.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ChatModule } from './modules/chat/chat.module.js';
import { ListingModule } from './modules/listing/listing.module.js';
import { NotificationModule } from './modules/notification/notification.module.js';
import { PageModule } from './modules/page/page.module.js';
import { ProductModule } from './modules/product/product.module.js';
import { RealtimeModule } from './modules/realtime/realtime.module.js';
import { ReviewModule } from './modules/review/review.module.js';
import { ReportModule } from './modules/report/report.module.js';
import { SettingsModule } from './modules/settings/settings.module.js';
import { UploadModule } from './modules/upload/upload.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    // Mặc định 60 request ghi / phút / IP (WriteThrottlerGuard); /auth chặt hơn bằng @Throttle.
    // Có REDIS_URL → đếm chung qua Redis (nhiều instance); không có → bộ nhớ từng instance
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        return {
          throttlers: [{ ttl: 60_000, limit: 60 }],
          errorMessage: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút',
          storage: redisUrl
            ? new RedisThrottlerStorage(
                new Redis(redisUrl, { maxRetriesPerRequest: 1 }),
              )
            : undefined,
        };
      },
    }),
    RealtimeModule,
    AuthModule,
    UserModule,
    ListingModule,
    UploadModule,
    SettingsModule,
    ProductModule,
    ReportModule,
    AdminModule,
    NotificationModule,
    ChatModule,
    ReviewModule,
    PageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: WriteThrottlerGuard },
  ],
})
export class AppModule {}
