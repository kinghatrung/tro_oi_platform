import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { User, UserSchema } from '../auth/schemas/user.schema.js';
import { ListingModule } from '../listing/listing.module.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    AuthModule,
    ListingModule,
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
