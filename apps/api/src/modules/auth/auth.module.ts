import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  JwtModule,
  type JwtModuleOptions,
  type JwtSignOptions,
} from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { FirebaseService } from './firebase.service.js';
import { AdminGuard } from './admin.guard.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { User, UserSchema } from './schemas/user.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>(
            'JWT_EXPIRES_IN',
            '7d',
          ) as JwtSignOptions['expiresIn'],
        },
      }),
    }),
  ],
  providers: [AuthService, FirebaseService, JwtAuthGuard, AdminGuard],
  controllers: [AuthController],
  // JwtModule + MongooseModule (User model) export để module khác dùng được JwtAuthGuard
  exports: [
    AuthService,
    FirebaseService,
    JwtAuthGuard,
    AdminGuard,
    JwtModule,
    MongooseModule,
  ],
})
export class AuthModule {}
