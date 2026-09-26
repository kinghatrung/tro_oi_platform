import { Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Get('dang-nhap')
  signIn() {
    return this.authService.signIn();
  }

  @Get('dang-ki')
  signUp() {
    return 'Sign Up';
  }
}
