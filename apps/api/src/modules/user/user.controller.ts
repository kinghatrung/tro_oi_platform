import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UserService } from './user.service.js';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Get(':id')
  getPublic(@Param('id') id: string) {
    return this.userService.getPublic(id);
  }
}
