import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService);
  // Sau nginx → TRUST_PROXY=1 để giới hạn theo IP thật của người dùng
  app.set('trust proxy', Number(config.get<string>('TRUST_PROXY', '0')));
  app.enableCors({
    origin: config
      .get<string>('WEB_ORIGIN', 'http://localhost:3001')
      .split(','),
  });
  await app.listen(config.get<string>('PORT', '5300'));
}
void bootstrap();
