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
  CreateProductDto,
  SearchProductDto,
  UpdateProductDto,
} from './dto/product.dto.js';
import { ProductService } from './product.service.js';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  search(@Query() query: SearchProductDto) {
    return this.productService.search(query);
  }

  /** Dữ liệu sitemap theo phần (web /cho-oi/sitemap/<chunk>.xml). */
  @Get('sitemap')
  sitemap(@Query() query: SitemapQueryDto) {
    return this.productService.sitemap(query.chunk);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUser() user: AuthUser) {
    return this.productService.findMine(user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findActive(id);
  }

  /** Trình duyệt báo đã xem (sau khi trang hiển thị) → +1 lượt xem, chống trùng. */
  @Post(':id/view')
  @HttpCode(200)
  recordView(
    @Param('id') id: string,
    @Ip() ip: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.productService.recordView(id, ip, userAgent);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
    return this.productService.create(user, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productService.update(user, id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.productService.remove(user, id);
  }
}
