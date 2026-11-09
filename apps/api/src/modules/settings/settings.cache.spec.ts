import { jest } from '@jest/globals';

import { SETTINGS_CACHE_MS, SettingsService } from './settings.service.js';

describe('SettingsService cache', () => {
  it('dùng cache trong TTL, quá TTL đọc lại DB (instance khác đã lưu)', async () => {
    let siteName = 'A';
    const findOne = jest.fn(() => ({
      exec: async () => ({ values: { siteName }, updatedAt: new Date() }),
    }));
    const service = new SettingsService({ findOne } as never);
    const now = jest.spyOn(Date, 'now').mockReturnValue(1_000);

    expect((await service.get()).siteName).toBe('A');
    siteName = 'B'; // instance khác vừa lưu
    now.mockReturnValue(1_000 + SETTINGS_CACHE_MS - 1);
    expect((await service.get()).siteName).toBe('A');
    now.mockReturnValue(1_000 + SETTINGS_CACHE_MS);
    expect((await service.get()).siteName).toBe('B');
    expect(findOne).toHaveBeenCalledTimes(2);
    now.mockRestore();
  });
});
