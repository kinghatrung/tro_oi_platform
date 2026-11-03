import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { Request } from 'express';
import type { Model } from 'mongoose';

import type { AuthUser } from '../../common/current-user.decorator.js';
import { User, type UserDocument } from './schemas/user.schema.js';

/**
 * Bảo vệ route: yêu cầu header Authorization: Bearer <accessToken>.
 * Đọc lại role/isBlocked từ DB mỗi request để khoá tài khoản, đổi quyền có hiệu lực ngay.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Thiếu access token');
    }

    let payload: AuthUser;
    try {
      payload = await this.jwtService.verifyAsync<AuthUser>(
        header.slice('Bearer '.length),
        { secret: this.configService.getOrThrow<string>('JWT_SECRET') },
      );
    } catch {
      throw new UnauthorizedException(
        'Access token không hợp lệ hoặc đã hết hạn',
      );
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('phone role isBlocked')
      .exec();
    if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');
    if (user.isBlocked) {
      throw new ForbiddenException('Tài khoản đã bị khoá. Liên hệ hỗ trợ.');
    }

    request.user = { sub: payload.sub, phone: user.phone, role: user.role };
    return true;
  }
}
