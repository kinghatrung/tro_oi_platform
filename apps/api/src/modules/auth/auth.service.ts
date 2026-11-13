import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';

import { FirebaseService } from './firebase.service.js';
import { User, toUser } from './schemas/user.schema.js';
import type { UserDocument } from './schemas/user.schema.js';

/** Nhà cung cấp Firebase được nhận ở /auth/social (SĐT đi qua /auth/verify-phone). */
export const SOCIAL_PROVIDERS = ['google.com', 'facebook.com'];
const NAME_MAX = 50;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

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

    return this.loginByPhone(phone);
  }

  /**
   * Trước khi có đăng nhập Google/Facebook, `phone` bắt buộc và index unique thường — giữ index cũ
   * thì tài khoản thứ 2 không có phone bị lỗi trùng null. Đổi sang index partial (chạy lại an toàn).
   */
  async onModuleInit() {
    try {
      const indexes = await this.userModel.collection.indexes();
      const old = indexes.find(
        (index) => index.name === 'phone_1' && !index.partialFilterExpression,
      );
      if (old) {
        await this.userModel.collection.dropIndex('phone_1');
        await this.userModel.createIndexes();
        this.logger.log('Đã đổi index users.phone sang unique partial');
      }
    } catch (error) {
      this.logger.warn(
        `Không kiểm tra được index users.phone: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Đăng nhập Google / Facebook: frontend đăng nhập qua Firebase (popup), gửi ID token lên đây.
   * Nhận diện theo Firebase UID — không gộp với tài khoản SĐT theo email (email hồ sơ chưa xác minh).
   */
  async socialLogin(firebaseToken: string) {
    const decoded = await this.firebaseService.verifyIdToken(firebaseToken);
    if (!SOCIAL_PROVIDERS.includes(decoded.firebase?.sign_in_provider)) {
      throw new BadRequestException(
        'Chỉ hỗ trợ đăng nhập bằng Google hoặc Facebook',
      );
    }

    let user = await this.userModel
      .findOne({ firebaseUid: decoded.uid })
      .exec();
    const isNewUser = !user;
    if (!user) {
      const name = (decoded.name ?? '').trim().slice(0, NAME_MAX);
      user = await this.userModel.create({
        firebaseUid: decoded.uid,
        name: name.length >= 2 ? name : 'Người dùng mới',
        // Chỉ lấy email nhà cung cấp đã xác minh (Facebook có thể trả email chưa xác minh)
        email: decoded.email_verified ? decoded.email : undefined,
        avatar:
          typeof decoded.picture === 'string' ? decoded.picture : undefined,
        role: 'renter',
      });
    }
    return this.issueSession(user, isNewUser);
  }

  /** Đăng nhập không OTP — chỉ khi AUTH_DEV_LOGIN=true (dev/test). */
  async devLogin(phone: string) {
    if (this.configService.get<string>('AUTH_DEV_LOGIN') !== 'true') {
      throw new NotFoundException();
    }
    return this.loginByPhone(phone.replace(/^0/, '+84'));
  }

  private async loginByPhone(phone: string) {
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
    return this.issueSession(user, isNewUser);
  }

  private async issueSession(user: UserDocument, isNewUser: boolean) {
    if (user.isBlocked) {
      throw new ForbiddenException('Tài khoản đã bị khoá. Liên hệ hỗ trợ.');
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

    return { accessToken, isNewUser, user: toUser(user) };
  }
}
