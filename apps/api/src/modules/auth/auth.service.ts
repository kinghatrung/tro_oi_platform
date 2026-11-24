import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';

import { FirebaseService } from './firebase.service.js';
import { User, toUser } from './schemas/user.schema.js';
import type { UserDocument } from './schemas/user.schema.js';

/** Nhà cung cấp Firebase được nhận ở /auth/social (SĐT đi qua /auth/verify-phone). */
export const SOCIAL_PROVIDERS = ['google.com', 'facebook.com'];
const NAME_MAX = 50;
const LINKED_ELSEWHERE = {
  social: 'Tài khoản Google/Facebook này đã dùng cho một tài khoản Trọ ơi khác',
  phone: 'Số điện thoại này đã dùng cho một tài khoản Trọ ơi khác',
};

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
    const decoded = await this.verifySocialToken(firebaseToken);
    const provider = decoded.firebase.sign_in_provider;

    let user = await this.userModel
      .findOne({ firebaseUid: decoded.uid })
      .exec();
    const isNewUser = !user;
    if (user && !user.socialProvider) {
      // Tài khoản tạo trước khi lưu nhà cung cấp → bổ sung để trang cá nhân hiện đúng
      user.socialProvider = provider;
      await user.save();
    }
    if (!user) {
      const name = (decoded.name ?? '').trim().slice(0, NAME_MAX);
      user = await this.userModel.create({
        firebaseUid: decoded.uid,
        socialProvider: provider,
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

  /**
   * Gắn Google / Facebook vào tài khoản đang đăng nhập (vd tài khoản SĐT) → lần sau đăng nhập cách
   * nào cũng vào cùng 1 tài khoản. Mỗi tài khoản gắn được 1 Google hoặc 1 Facebook.
   * Google đã có tài khoản Trọ ơi riêng → 409; web đề nghị gộp (POST /users/me/merge cùng token).
   */
  async linkSocial(userId: string, firebaseToken: string) {
    const decoded = await this.verifySocialToken(firebaseToken);
    const user = await this.findActiveUser(userId);
    if (user.firebaseUid === decoded.uid) return toUser(user);
    if (user.firebaseUid) {
      throw new BadRequestException(
        'Tài khoản đã liên kết Google/Facebook — huỷ liên kết cũ trước',
      );
    }
    if (await this.userModel.exists({ firebaseUid: decoded.uid })) {
      throw new ConflictException(LINKED_ELSEWHERE.social);
    }
    user.firebaseUid = decoded.uid;
    user.socialProvider = decoded.firebase.sign_in_provider;
    if (!user.email && decoded.email_verified && decoded.email) {
      user.email = decoded.email;
    }
    await this.saveUnique(user, LINKED_ELSEWHERE.social);
    return toUser(user);
  }

  /**
   * Gắn SĐT (đã xác minh OTP qua Firebase) vào tài khoản đang đăng nhập; đã có số → đổi sang số mới.
   * Số đã thuộc tài khoản khác → 409 (web đề nghị gộp).
   */
  async linkPhone(userId: string, firebaseToken: string) {
    const decoded = await this.firebaseService.verifyIdToken(firebaseToken);
    const phone = decoded.phone_number;
    if (!phone) {
      throw new BadRequestException('Token không chứa số điện thoại');
    }
    const user = await this.findActiveUser(userId);
    if (user.phone === phone) return toUser(user);
    if (await this.userModel.exists({ phone })) {
      throw new ConflictException(LINKED_ELSEWHERE.phone);
    }
    user.phone = phone;
    await this.saveUnique(user, LINKED_ELSEWHERE.phone);
    return toUser(user);
  }

  /** Huỷ liên kết Google / Facebook — chỉ khi còn SĐT để đăng nhập lại. */
  async unlinkSocial(userId: string) {
    const user = await this.findActiveUser(userId);
    if (!user.firebaseUid) return toUser(user);
    if (!user.phone) {
      throw new BadRequestException(
        'Thêm số điện thoại trước khi huỷ liên kết, nếu không bạn sẽ không đăng nhập lại được',
      );
    }
    user.firebaseUid = undefined;
    user.socialProvider = undefined;
    await user.save();
    return toUser(user);
  }

  /** Bỏ SĐT — chỉ khi còn Google / Facebook để đăng nhập lại. */
  async unlinkPhone(userId: string) {
    const user = await this.findActiveUser(userId);
    if (!user.phone) return toUser(user);
    if (!user.firebaseUid) {
      throw new BadRequestException(
        'Liên kết Google hoặc Facebook trước khi bỏ số điện thoại, nếu không bạn sẽ không đăng nhập lại được',
      );
    }
    user.phone = undefined;
    await user.save();
    return toUser(user);
  }

  private async verifySocialToken(firebaseToken: string) {
    const decoded = await this.firebaseService.verifyIdToken(firebaseToken);
    if (!SOCIAL_PROVIDERS.includes(decoded.firebase?.sign_in_provider)) {
      throw new BadRequestException(
        'Chỉ hỗ trợ đăng nhập bằng Google hoặc Facebook',
      );
    }
    return decoded;
  }

  private async findActiveUser(userId: string) {
    const user = isValidObjectId(userId)
      ? await this.userModel.findById(userId).exec()
      : null;
    if (!user || user.deletedAt) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return user;
  }

  /** Lưu; 2 request liên kết cùng lúc vượt qua bước kiểm tra → index unique chặn → 409. */
  private async saveUnique(user: UserDocument, conflictMessage: string) {
    try {
      await user.save();
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException(conflictMessage);
      }
      throw error;
    }
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
