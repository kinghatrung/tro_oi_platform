import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import admin from 'firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length > 0) return;

    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');

    //chưa điền env thì cảnh báo thay vì crash server
    if (
      !projectId ||
      !clientEmail ||
      !privateKey ||
      projectId === 'your-project-id'
    ) {
      this.logger.warn(
        'Firebase chưa được cấu hình. Điền FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY trong .env.local',
      );
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          //env file thường escape dấu xuống dòng thành \n
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
      });
      this.logger.log('Firebase Admin SDK đã khởi tạo');
    } catch (error) {
      this.logger.warn(
        `Khởi tạo Firebase thất bại: ${(error as Error).message}`,
      );
    }
  }

  /** Xác minh Firebase ID token do frontend gửi lên sau khi xác nhận OTP. */
  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    if (admin.apps.length === 0) {
      throw new ServiceUnavailableException(
        'Firebase chưa được cấu hình trên server',
      );
    }
    try {
      return await admin.auth().verifyIdToken(token);
    } catch {
      throw new UnauthorizedException(
        'Token Firebase không hợp lệ hoặc đã hết hạn',
      );
    }
  }
}
