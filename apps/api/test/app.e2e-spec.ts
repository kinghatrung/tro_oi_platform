import { Test, type TestingModule } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { HttpExceptionFilter } from '../src/common/http-exception.filter.js';
import { ResponseInterceptor } from '../src/common/response.interceptor.js';

/** Cần MongoDB theo .env (chỉ đọc, không ghi dữ liệu). Chạy: yarn workspace api test:e2e */
describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Giống main.ts
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /settings → { code, message, data } với thiết lập website', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/settings')
      .expect(200);
    expect(body.code).toBe(200);
    expect(typeof body.data.siteName).toBe('string');
  });

  it('GET /admin/stats không token → 401 đúng format', async () => {
    const { body } = await request(app.getHttpServer())
      .get('/admin/stats')
      .expect(401);
    expect(body).toMatchObject({ code: 401, data: null });
  });
});
