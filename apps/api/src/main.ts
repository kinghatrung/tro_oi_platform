import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module.js';
import { HttpExceptionFilter } from './common/http-exception.filter.js';
import { ResponseInterceptor } from './common/response.interceptor.js';
import { ChatIoAdapter } from './modules/chat/chat-io.adapter.js';
import { UPLOAD_DIR } from './modules/upload/storage.service.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);

  const origins = config
    .get<string>('WEB_ORIGIN', 'http://localhost:3001')
    .split(',');
  app.enableCors({ origin: origins, credentials: true });
  const socketAdapter = new ChatIoAdapter(app, origins);
  const redisUrl = config.get<string>('REDIS_URL');
  if (redisUrl) await socketAdapter.connectToRedis(redisUrl);
  app.useWebSocketAdapter(socketAdapter);
  app.use(cookieParser());

  //bật trên toán bộ  app
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // nosniff: file upload chỉ được hiểu đúng theo đuôi ảnh, chặn XSS qua nội dung giả mạo
  app.useStaticAssets(UPLOAD_DIR, {
    prefix: '/uploads/',
    setHeaders: (res) => res.setHeader('X-Content-Type-Options', 'nosniff'),
  });

  await app.listen(config.get<string>('PORT', '5000'));
}
void bootstrap();
