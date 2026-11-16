import { Body, Controller, Delete, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

import {
  CurrentUser,
  type AuthUser,
} from '../../common/current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { DevLoginDto } from './dto/dev-login.dto.js';
import { SocialLoginDto } from './dto/social-login.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

// Đăng nhập: 10 lần / phút / IP (chống dò token, spam tạo tài khoản)
@Throttle({ default: { ttl: 60_000, limit: 10 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/verify-phone
   * Body: { firebaseToken: string }
   * Frontend xác minh OTP qua Firebase Client SDK, gửi ID token lên đây.
   */
  @Post('verify-phone')
  verifyPhone(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyPhone(dto.firebaseToken);
  }

  /** POST /auth/social — đăng nhập Google / Facebook (Firebase ID token). */
  @Post('social')
  socialLogin(@Body() dto: SocialLoginDto) {
    return this.authService.socialLogin(dto.firebaseToken);
  }

  /** POST /auth/link/social — gắn Google / Facebook vào tài khoản đang đăng nhập. */
  @Post('link/social')
  @UseGuards(JwtAuthGuard)
  linkSocial(@CurrentUser() user: AuthUser, @Body() dto: SocialLoginDto) {
    return this.authService.linkSocial(user.sub, dto.firebaseToken);
  }

  /** DELETE /auth/link/social — huỷ liên kết Google / Facebook (cần đã có SĐT). */
  @Delete('link/social')
  @UseGuards(JwtAuthGuard)
  unlinkSocial(@CurrentUser() user: AuthUser) {
    return this.authService.unlinkSocial(user.sub);
  }

  /** POST /auth/link/phone — gắn SĐT (token sau khi xác minh OTP) vào tài khoản đang đăng nhập. */
  @Post('link/phone')
  @UseGuards(JwtAuthGuard)
  linkPhone(@CurrentUser() user: AuthUser, @Body() dto: VerifyOtpDto) {
    return this.authService.linkPhone(user.sub, dto.firebaseToken);
  }

  /** POST /auth/dev-login — chỉ hoạt động khi AUTH_DEV_LOGIN=true. */
  @Post('dev-login')
  devLogin(@Body() dto: DevLoginDto) {
    return this.authService.devLogin(dto.phone);
  }
}
