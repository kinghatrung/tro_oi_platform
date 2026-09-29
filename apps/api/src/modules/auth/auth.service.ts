import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { FirebaseService } from './firebase.service.js';
import { User } from './schemas/user.schema.js';
import type { UserDocument } from './schemas/user.schema.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly firebaseService: FirebaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Đăng nhập bằng SĐT qua Firebase Phone Auth.
   * Frontend gửi/xác minh OTP bằng Firebase Client SDK,
   * rồi gửi ID token lên đây để backend xác minh + tạo/tìm user.
   */
  async verifyPhone(firebaseToken: string) {
    //1. Xác minh token Firebase
    const decoded = await this.firebaseService.verifyIdToken(firebaseToken);

    //2. Lấy SĐT từ token (firebase_phone_auth always có phone_number)
    const phone = decoded.phone_number;
    if (!phone) {
      throw new BadRequestException('Token không chứa số điện thoại');
    }

    //3. Tìm hoặc tạo user (đăng nhập = đăng ký)
    let user = await this.userModel.findOne({ phone }).exec();
    const isNewUser = !user;

    if (!user) {
      user = await this.userModel.create({
        phone,
        name: `Người dùng ${phone.slice(-4)}`,
        role: 'renter',
      });
    }

    //4. Tạo JWT access token
    const payload = { sub: user.id, phone: user.phone, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_EXPIRES_IN',
        '7d',
      ) as JwtSignOptions['expiresIn'],
    });

    return {
      accessToken,
      isNewUser,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    };
  }
}
