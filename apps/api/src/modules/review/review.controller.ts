import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import {
  MyReviewQueryDto,
  ReviewQueryDto,
  UpsertReviewDto,
} from './review.dto.js';
import { ReviewService } from './review.service.js';

@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  list(@Query() query: ReviewQueryDto) {
    return this.reviewService.list(query);
  }

  // "mine" khai báo trước ":id"
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: AuthUser, @Query() query: MyReviewQueryDto) {
    return this.reviewService.mine(user.sub, query.userId);
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  upsert(@CurrentUser() user: AuthUser, @Body() dto: UpsertReviewDto) {
    return this.reviewService.upsert(user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reviewService.remove(user, id);
  }
}
