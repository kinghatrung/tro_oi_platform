import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Types, type Model } from 'mongoose';

import {
  User,
  toUser,
  type SavedSearch,
  type UserDocument,
} from '../auth/schemas/user.schema.js';
import { AUTHOR_FIELDS, toListing } from '../listing/listing.mapper.js';
import { parseSavedSearch } from '../listing/saved-search-match.js';
import {
  Listing,
  type ListingDocument,
} from '../listing/schemas/listing.schema.js';
import { SELLER_FIELDS, toProduct } from '../product/product.mapper.js';
import {
  Product,
  type ProductDocument,
} from '../product/schemas/product.schema.js';
import type { MergeViewedDto } from './dto/merge-viewed.dto.js';
import type { CreateSavedSearchDto } from './dto/saved-search.dto.js';
import type { UpdateProfileDto } from './dto/update-profile.dto.js';

export const MAX_SAVED_SEARCHES = 20;
/** Số tin / món đồ đã xem giữ lại mỗi tài khoản. */
export const MAX_VIEWED = 15;

/** Giữ thứ tự theo danh sách id đã lưu (mới xem trước). */
function sortByIds<T extends { id: unknown }>(
  docs: T[],
  ids: Types.ObjectId[],
) {
  const order = ids.map(String);
  return [...docs].sort(
    (a, b) => order.indexOf(String(a.id)) - order.indexOf(String(b.id)),
  );
}

/** Hợp 2 danh sách id, giữ thứ tự (danh sách đầu trước), bỏ trùng. */
export function unionIds(first: Types.ObjectId[], second: Types.ObjectId[]) {
  const seen = new Set<string>();
  return [...first, ...second].filter((id) => {
    const key = String(id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

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

  /** Hồ sơ công khai: ẩn phone/email; tài khoản đã tự xoá → 404. */
  async getPublic(id: string) {
    const user = await this.findOrThrow(id);
    if (user.deletedAt)
      throw new NotFoundException('Không tìm thấy người dùng');
    const { phone: _phone, email: _email, ...profile } = toUser(user);
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

  /** Tin đã xem gần đây (đồng bộ giữa thiết bị), còn active, mới xem trước. */
  async getViewedListings(userId: string) {
    const user = await this.findOrThrow(userId);
    const docs = await this.listingModel
      .find({ _id: { $in: user.viewedListingIds }, status: 'active' })
      .populate('author', AUTHOR_FIELDS)
      .exec();
    return sortByIds(docs, user.viewedListingIds).map((doc) => toListing(doc));
  }

  async recordViewedListing(userId: string, listingId: string) {
    const exists =
      isValidObjectId(listingId) &&
      (await this.listingModel.exists({ _id: listingId }));
    if (!exists) throw new NotFoundException('Không tìm thấy tin đăng');
    await this.pushViewed(userId, 'viewedListingIds', listingId);
    return null;
  }

  /**
   * Lịch sử xem lúc chưa đăng nhập (trình duyệt gửi lên khi đăng nhập, mới xem trước) → đặt trên
   * lịch sử của tài khoản, bỏ trùng, giữ MAX_VIEWED. Id không tồn tại vẫn lưu được nhưng không hiện
   * (getViewed* chỉ lấy tin còn active).
   */
  async mergeViewed(
    userId: string,
    { listingIds = [], productIds = [] }: MergeViewedDto,
  ) {
    const user = await this.findOrThrow(userId);
    const toIds = (ids: string[]) => ids.map((id) => new Types.ObjectId(id));
    user.viewedListingIds = unionIds(
      toIds(listingIds),
      user.viewedListingIds,
    ).slice(0, MAX_VIEWED);
    user.viewedProductIds = unionIds(
      toIds(productIds),
      user.viewedProductIds,
    ).slice(0, MAX_VIEWED);
    await user.save();
    return null;
  }

  /** Món đồ đã xem gần đây, còn đang bán, mới xem trước. */
  async getViewedProducts(userId: string) {
    const user = await this.findOrThrow(userId);
    const docs = await this.productModel
      .find({ _id: { $in: user.viewedProductIds }, status: 'active' })
      .populate('seller', SELLER_FIELDS)
      .exec();
    return sortByIds(docs, user.viewedProductIds).map((doc) => toProduct(doc));
  }

  async recordViewedProduct(userId: string, productId: string) {
    const exists =
      isValidObjectId(productId) &&
      (await this.productModel.exists({ _id: productId }));
    if (!exists) throw new NotFoundException('Không tìm thấy món đồ');
    await this.pushViewed(userId, 'viewedProductIds', productId);
    return null;
  }

  /** Đưa lên đầu lịch sử (bỏ bản cũ của chính nó), giữ tối đa MAX_VIEWED. */
  private async pushViewed(
    userId: string,
    field: 'viewedListingIds' | 'viewedProductIds',
    id: string,
  ) {
    const objectId = new Types.ObjectId(id);
    await this.userModel
      .updateOne({ _id: userId }, { $pull: { [field]: objectId } })
      .exec();
    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $push: {
            [field]: { $each: [objectId], $position: 0, $slice: MAX_VIEWED },
          },
        },
      )
      .exec();
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
    user.savedSearches.push({
      ...dto,
      filter: parseSavedSearch(dto.query),
    } as SavedSearch);
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
