import { Controller, Get, Param } from '@nestjs/common';

import { PageService } from './page.service.js';

/** Trang nội dung công khai. Admin soạn qua GET/PUT /admin/pages/:slug. */
@Controller('pages')
export class PageController {
  constructor(private readonly pageService: PageService) {}

  @Get()
  list() {
    return this.pageService.listPublished();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.pageService.getPublished(slug);
  }
}
