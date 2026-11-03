import { Controller, Get } from '@nestjs/common';

import { SettingsService } from './settings.service.js';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /** Công khai: web đọc để hiển thị tên, theme, banner... */
  @Get()
  get() {
    return this.settingsService.get();
  }
}
