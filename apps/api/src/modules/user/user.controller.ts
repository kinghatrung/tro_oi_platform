import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { CreateSavedSearchDto } from './dto/saved-search.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { AccountService } from './account.service.js';
import { DeleteAccountDto } from './dto/delete-account.dto.js';
import { UserService } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly accountService: AccountService,
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

  /** Tải toàn bộ dữ liệu của tôi (JSON). */
  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  exportMe(@CurrentUser() user: AuthUser) {
    return this.accountService.exportData(user.sub);
  }

  /** Tự xoá tài khoản (ẩn danh hoá) — body { confirm: "XOA TAI KHOAN" }. */
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  deleteMe(@CurrentUser() user: AuthUser, @Body() _dto: DeleteAccountDto) {
    return this.accountService.deleteAccount(user.sub);
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
