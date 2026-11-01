import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';

import {
  User,
  toUser,
  type UserDocument,
} from '../auth/schemas/user.schema.js';
import { AUTHOR_FIELDS, toListing } from '../listing/listing.mapper.js';
import {
  Listing,
  type ListingDocument,
} from '../listing/schemas/listing.schema.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
  ) {}

  async getMe(userId: string) {
    return toUser(await this.findOrThrow(userId));
  }

  async updateMe(userId: string, dto: UpdateProfileDto) {
    const user = await this.findOrThrow(userId);
    user.set(dto);
    await user.save();
    return toUser(user);
  }

  /** Hồ sơ công khai: ẩn phone/email. */
  async getPublic(id: string) {
    const {
      phone: _phone,
      email: _email,
      ...profile
    } = toUser(await this.findOrThrow(id));
    return profile;
  }

  /** Tin đã lưu còn active, mới lưu trước. */
  async getFavorites(userId: string) {
    const user = await this.findOrThrow(userId);
    const docs = await this.listingModel
      .find({ _id: { $in: user.favoriteListingIds }, status: 'active' })
      .populate('author', AUTHOR_FIELDS)
      .exec();
    const order = user.favoriteListingIds.map(String).reverse();
    return docs
      .sort(
        (a, b) => order.indexOf(a.id as string) - order.indexOf(b.id as string),
      )
      .map((doc) => toListing(doc));
  }

  async addFavorite(userId: string, listingId: string) {
    const exists =
      isValidObjectId(listingId) &&
      (await this.listingModel.exists({ _id: listingId, status: 'active' }));
    if (!exists) throw new NotFoundException('Không tìm thấy tin đăng');

    await this.userModel
      .updateOne(
        { _id: userId },
        { $addToSet: { favoriteListingIds: listingId } },
      )
      .exec();
    return null;
  }

  async removeFavorite(userId: string, listingId: string) {
    if (isValidObjectId(listingId)) {
      await this.userModel
        .updateOne(
          { _id: userId },
          { $pull: { favoriteListingIds: listingId } },
        )
        .exec();
    }
    return null;
  }

  private async findOrThrow(id: string) {
    const user = isValidObjectId(id)
      ? await this.userModel.findById(id).exec()
      : null;
    if (!user) throw new NotFoundException('Không tìm thấy người dùng');
    return user;
  }
}
