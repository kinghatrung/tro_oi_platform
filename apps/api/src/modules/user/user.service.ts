import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';

import {
  User,
  toUser,
  type SavedSearch,
  type UserDocument,
} from '../auth/schemas/user.schema.js';
import { AUTHOR_FIELDS, toListing } from '../listing/listing.mapper.js';
import {
  Listing,
  type ListingDocument,
} from '../listing/schemas/listing.schema.js';
import { SELLER_FIELDS, toProduct } from '../product/product.mapper.js';
import {
  Product,
  type ProductDocument,
} from '../product/schemas/product.schema.js';
import type { CreateSavedSearchDto } from './dto/saved-search.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

const MAX_SAVED_SEARCHES = 20;

const toSavedSearch = (item: SavedSearch) => ({
  id: String(item._id),
  query: item.query,
  title: item.title,
  createdAt: item.createdAt.toISOString(),
});

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
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

  /** Món đồ Chợ ơi đã lưu còn đang bán, mới lưu trước. */
  async getFavoriteProducts(userId: string) {
    const user = await this.findOrThrow(userId);
    const docs = await this.productModel
      .find({ _id: { $in: user.favoriteProductIds }, status: 'active' })
      .populate('seller', SELLER_FIELDS)
      .exec();
    const order = user.favoriteProductIds.map(String).reverse();
    return docs
      .sort(
        (a, b) => order.indexOf(a.id as string) - order.indexOf(b.id as string),
      )
      .map((doc) => toProduct(doc));
  }

  async addFavoriteProduct(userId: string, productId: string) {
    const exists =
      isValidObjectId(productId) &&
      (await this.productModel.exists({ _id: productId, status: 'active' }));
    if (!exists) throw new NotFoundException('Không tìm thấy món đồ');

    await this.userModel
      .updateOne(
        { _id: userId },
        { $addToSet: { favoriteProductIds: productId } },
      )
      .exec();
    return null;
  }

  async removeFavoriteProduct(userId: string, productId: string) {
    if (isValidObjectId(productId)) {
      await this.userModel
        .updateOne(
          { _id: userId },
          { $pull: { favoriteProductIds: productId } },
        )
        .exec();
    }
    return null;
  }

  /** Mới lưu trước. */
  async getSavedSearches(userId: string) {
    const user = await this.findOrThrow(userId);
    return [...user.savedSearches].reverse().map(toSavedSearch);
  }

  /** Lưu trùng query → trả bản đã có (không tạo thêm). */
  async addSavedSearch(userId: string, dto: CreateSavedSearchDto) {
    const user = await this.findOrThrow(userId);
    const existing = user.savedSearches.find(
      (item) => item.query === dto.query,
    );
    if (existing) return toSavedSearch(existing);
    if (user.savedSearches.length >= MAX_SAVED_SEARCHES) {
      throw new BadRequestException(
        `Chỉ lưu được tối đa ${MAX_SAVED_SEARCHES} tìm kiếm, hãy xoá bớt`,
      );
    }
    user.savedSearches.push(dto as SavedSearch);
    await user.save();
    return toSavedSearch(user.savedSearches[user.savedSearches.length - 1]);
  }

  async removeSavedSearch(userId: string, id: string) {
    if (isValidObjectId(id)) {
      await this.userModel
        .updateOne({ _id: userId }, { $pull: { savedSearches: { _id: id } } })
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
