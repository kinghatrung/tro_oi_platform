import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthModule } from '../auth/auth.module.js';
import { SettingsModule } from '../settings/settings.module.js';
import { ListingController } from './listing.controller.js';
import { ListingService } from './listing.service.js';
import { User, UserSchema } from '../auth/schemas/user.schema.js';
import { Listing, ListingSchema } from './schemas/listing.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Listing.name, schema: ListingSchema },
      { name: User.name, schema: UserSchema },
    ]),
    AuthModule,
    SettingsModule,
  ],
  controllers: [ListingController],
  providers: [ListingService],
  exports: [MongooseModule],
})
export class ListingModule {}
