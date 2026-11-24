import { existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { jest } from '@jest/globals';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

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

  it('saveFile (video qua file tạm): stream lên S3 kèm ContentLength, xoá file tạm', async () => {
    const send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    const temp = join(tmpdir(), `storage-spec-${Date.now()}.mp4`);
    writeFileSync(temp, 'video-bytes');

    const url = await new StorageService(configOf(S3_ENV)).saveFile(
      'v.mp4',
      temp,
      'video/mp4',
    );

    expect(url).toBe('https://cdn.example.com/uploads/v.mp4');
    const command = send.mock.calls[0][0] as PutObjectCommand;
    expect(command.input).toMatchObject({
      Key: 'uploads/v.mp4',
      ContentLength: 11,
      ContentType: 'video/mp4',
    });
    expect(existsSync(temp)).toBe(false);
  });

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

  it('remove: chỉ xoá file của hệ thống, mỗi file 1 lần', async () => {
    const send = jest
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);
    const removed = await new StorageService(configOf(S3_ENV)).remove([
      'https://cdn.example.com/uploads/a.jpg',
      'https://cdn.example.com/uploads/a.jpg',
      'https://evil.example/uploads/b.jpg',
      'https://cdn.example.com/uploads/../secret',
      null,
      undefined,
    ]);

    expect(removed).toBe(1);
    expect(send).toHaveBeenCalledTimes(1);
    expect((send.mock.calls[0][0] as DeleteObjectCommand).input).toEqual({
      Bucket: 'tro-oi',
      Key: 'uploads/a.jpg',
    });
  });

  it('remove trên ổ đĩa: file đã mất (ENOENT) không tính là lỗi', async () => {
    const storage = new StorageService(configOf({}));
    await expect(
      storage.remove(['http://localhost:5000/uploads/khong-ton-tai-123.jpg']),
    ).resolves.toBe(1);
  });

  it('isStoredUrl: chỉ nhận URL uploads/ của chính hệ thống', () => {
    const storage = new StorageService(configOf(S3_ENV));
    expect(
      storage.isStoredUrl('https://cdn.example.com/uploads/1-ab.jpg'),
    ).toBe(true);
    expect(storage.isStoredUrl('https://evil.example/uploads/1.jpg')).toBe(
      false,
    );
    expect(
      storage.isStoredUrl('https://cdn.example.com/uploads/../secret'),
    ).toBe(false);
    expect(storage.isStoredUrl('https://cdn.example.com/other/1.jpg')).toBe(
      false,
    );
  });
});
