import { once } from 'node:events';

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { VerifyOtpDto } from '../auth/dto/verify-otp.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateSavedSearchDto } from './dto/saved-search.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { AccountMergeService } from './account-merge.service.js';
import { AccountService } from './account.service.js';
import { DeleteAccountDto } from './dto/delete-account.dto.js';
import { MergeViewedDto } from './dto/merge-viewed.dto.js';
import { UserService } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly accountService: AccountService,
    private readonly accountMergeService: AccountMergeService,
  ) {}

  // Route "me" khai báo trước ":id" để không bị bắt nhầm
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: AuthUser) {
    return this.userService.getMe(user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.userService.updateMe(user.sub, dto);
  }

  /**
   * Tải toàn bộ dữ liệu của tôi (JSON `{ code, message, data }` như mọi API). Ghi dần ra response
   * (stream) nên tự viết response; lỗi trước khi ghi (404...) vẫn qua HttpExceptionFilter.
   */
  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  async exportMe(@CurrentUser() user: AuthUser, @Res() res: Response) {
    const chunks = await this.accountService.exportData(user.sub);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      for await (const chunk of chunks) {
        if (!res.write(chunk)) await once(res, 'drain');
      }
      res.end();
    } catch (error) {
      // Đã gửi header — không trả lỗi JSON được nữa, cắt kết nối để client biết file hỏng
      res.destroy(error as Error);
    }
  }

  /** Tự xoá tài khoản (ẩn danh hoá) — body { confirm: "XOA TAI KHOAN" }. */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  deleteMe(@CurrentUser() user: AuthUser, @Body() _dto: DeleteAccountDto) {
    return this.accountService.deleteAccount(user.sub);
  }

  /** Gộp tài khoản khác (chứng minh sở hữu bằng token Firebase của nó) vào tài khoản đang đăng nhập. */
  @Post('me/merge')
  @UseGuards(JwtAuthGuard)
  mergeAccount(@CurrentUser() user: AuthUser, @Body() dto: VerifyOtpDto) {
    return this.accountMergeService.merge(user.sub, dto.firebaseToken);
  }

  @Get('me/favorites')
  @UseGuards(JwtAuthGuard)
  getFavorites(@CurrentUser() user: AuthUser) {
    return this.userService.getFavorites(user.sub);
  }

  @Put('me/favorites/:listingId')
  @UseGuards(JwtAuthGuard)
  addFavorite(
    @CurrentUser() user: AuthUser,
    @Param('listingId') listingId: string,
  ) {
    return this.userService.addFavorite(user.sub, listingId);
  }

  @Delete('me/favorites/:listingId')
  @UseGuards(JwtAuthGuard)
  removeFavorite(
    @CurrentUser() user: AuthUser,
    @Param('listingId') listingId: string,
  ) {
    return this.userService.removeFavorite(user.sub, listingId);
  }

  /** Tin đã xem gần đây (đồng bộ giữa thiết bị). */
  @Get('me/viewed-listings')
  @UseGuards(JwtAuthGuard)
  getViewedListings(@CurrentUser() user: AuthUser) {
    return this.userService.getViewedListings(user.sub);
  }

  /** Đăng nhập xong: đưa lịch sử xem lúc chưa đăng nhập (trình duyệt) lên tài khoản. */
  @Post('me/viewed')
  @UseGuards(JwtAuthGuard)
  mergeViewed(@CurrentUser() user: AuthUser, @Body() dto: MergeViewedDto) {
    return this.userService.mergeViewed(user.sub, dto);
  }

  @Put('me/viewed-listings/:listingId')
  @UseGuards(JwtAuthGuard)
  recordViewedListing(
    @CurrentUser() user: AuthUser,
    @Param('listingId') listingId: string,
  ) {
    return this.userService.recordViewedListing(user.sub, listingId);
  }

  @Get('me/viewed-products')
  @UseGuards(JwtAuthGuard)
  getViewedProducts(@CurrentUser() user: AuthUser) {
    return this.userService.getViewedProducts(user.sub);
  }

  @Put('me/viewed-products/:productId')
  @UseGuards(JwtAuthGuard)
  recordViewedProduct(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.userService.recordViewedProduct(user.sub, productId);
  }

  @Get('me/favorite-products')
  @UseGuards(JwtAuthGuard)
  getFavoriteProducts(@CurrentUser() user: AuthUser) {
    return this.userService.getFavoriteProducts(user.sub);
  }

  @Put('me/favorite-products/:productId')
  @UseGuards(JwtAuthGuard)
  addFavoriteProduct(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.userService.addFavoriteProduct(user.sub, productId);
  }

  @Delete('me/favorite-products/:productId')
  @UseGuards(JwtAuthGuard)
  removeFavoriteProduct(
    @CurrentUser() user: AuthUser,
    @Param('productId') productId: string,
  ) {
    return this.userService.removeFavoriteProduct(user.sub, productId);
  }

  @Get('me/saved-searches')
  @UseGuards(JwtAuthGuard)
  getSavedSearches(@CurrentUser() user: AuthUser) {
    return this.userService.getSavedSearches(user.sub);
  }

  @Post('me/saved-searches')
  @UseGuards(JwtAuthGuard)
  addSavedSearch(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSavedSearchDto,
  ) {
    return this.userService.addSavedSearch(user.sub, dto);
  }

  @Delete('me/saved-searches/:id')
  @UseGuards(JwtAuthGuard)
  removeSavedSearch(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.userService.removeSavedSearch(user.sub, id);
  }

  @Get(':id')
  getPublic(@Param('id') id: string) {
    return this.userService.getPublic(id);
  }
}
