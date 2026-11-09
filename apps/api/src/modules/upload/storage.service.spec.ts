import { jest } from '@jest/globals';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { StorageService } from './storage.service.js';

/** ConfigService giả từ object env. */
const configOf = (env: Record<string, string>) =>
  ({
    get: (key: string, fallback?: string) => env[key] ?? fallback,
    getOrThrow: (key: string) => {
      if (!env[key]) throw new Error(`Thiếu ${key}`);
      return env[key];
    },
  }) as never;

const S3_ENV = {
  S3_BUCKET: 'tro-oi',
  S3_ACCESS_KEY_ID: 'key',
  S3_SECRET_ACCESS_KEY: 'secret',
  S3_PUBLIC_URL: 'https://cdn.example.com/',
};

describe('StorageService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('có S3_BUCKET → PutObject vào uploads/<tên>, trả URL theo S3_PUBLIC_URL', async () => {
    const send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    const url = await new StorageService(configOf(S3_ENV)).save(
      'a.png',
      Buffer.from('x'),
      'image/png',
    );

    expect(url).toBe('https://cdn.example.com/uploads/a.png');
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command.input).toMatchObject({
      Bucket: 'tro-oi',
      Key: 'uploads/a.png',
      ContentType: 'image/png',
    });
  });

  it('bật S3 nhưng thiếu khoá / URL công khai → lỗi lúc khởi động', () => {
    const { S3_SECRET_ACCESS_KEY: _secret, ...missingSecret } = S3_ENV;
    expect(() => new StorageService(configOf(missingSecret))).toThrow(
      'S3_SECRET_ACCESS_KEY',
    );
    const { S3_PUBLIC_URL: _url, ...missingUrl } = S3_ENV;
    expect(() => new StorageService(configOf(missingUrl))).toThrow(
      'S3_PUBLIC_URL',
    );
  });
});
