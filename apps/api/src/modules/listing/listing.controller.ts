import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Ip,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { SitemapQueryDto } from '../../common/sitemap.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  CreateListingDto,
  SearchListingDto,
  UpdateListingDto,
} from './dto/listing.dto.js';
import { ListingService } from './listing.service.js';

@Controller('listings')
export class ListingController {
  constructor(private readonly listingService: ListingService) {}

  @Get()
  search(@Query() query: SearchListingDto) {
    return this.listingService.search(query);
  }

  @Get('stats')
  stats() {
    return this.listingService.stats();
  }

  /** Dữ liệu sitemap theo phần (web /phong-tro/sitemap/<chunk>.xml). */
  @Get('sitemap')
  sitemap(@Query() query: SitemapQueryDto) {
    return this.listingService.sitemap(query.chunk);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthUser) {
    return this.listingService.findMine(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingService.findActive(id);
  }

  /** Trình duyệt báo đã xem (sau khi trang hiển thị) → +1 lượt xem, chống trùng. */
  @Post(':id/view')
  @HttpCode(200)
  recordView(
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.listingService.recordView(id, ip, userAgent);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateListingDto) {
    return this.listingService.create(user, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingService.update(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.listingService.remove(user, id);
  }
}
