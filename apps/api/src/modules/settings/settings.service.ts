import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import {
  DEFAULT_SETTINGS,
  Setting,
  type SettingDocument,
  type SettingsValues,
} from './settings.schema.js';
import type { UpdateSettingsDto } from './update-settings.dto.js';

const SITE_KEY = 'site';

@Injectable()
export class SettingsService {
  // shortcut: cache trong bộ nhớ 1 process; chạy nhiều instance API cần cache dùng chung (Redis) hoặc TTL
  private cache?: SettingsValues & { updatedAt?: string };

  constructor(
    @InjectModel(Setting.name)
    private readonly settingModel: Model<SettingDocument>,
  ) {}

  /** Thiết lập hiện tại = mặc định + giá trị admin đã lưu. */
  async get() {
    if (this.cache) return this.cache;
    const doc = await this.settingModel.findOne({ key: SITE_KEY }).exec();
    this.cache = {
      ...DEFAULT_SETTINGS,
      ...doc?.values,
      updatedAt: doc?.updatedAt.toISOString(),
    };
    return this.cache;
  }

  /** Chỉ ghi các field được gửi lên → field chưa từng sửa vẫn theo DEFAULT_SETTINGS. */
  async update(dto: UpdateSettingsDto) {
    const changes = Object.fromEntries(
      Object.entries(dto)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [`values.${key}`, value]),
    );
    await this.settingModel
      .updateOne({ key: SITE_KEY }, { $set: changes }, { upsert: true })
      .exec();
    this.cache = undefined;
    return this.get();
  }
}
