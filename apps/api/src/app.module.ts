import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
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
  providers: [AppService],
})
export class AppModule {}
