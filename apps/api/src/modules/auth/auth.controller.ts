import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { DevLoginDto } from './dto/dev-login.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';

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

  /** POST /auth/dev-login — chỉ hoạt động khi AUTH_DEV_LOGIN=true. */
  @Post('dev-login')
  devLogin(@Body() dto: DevLoginDto) {
    return this.authService.devLogin(dto.phone);
  }
}
