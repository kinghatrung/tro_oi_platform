import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model } from 'mongoose';

import type { AuthUser } from '../../common/current-user.decorator.js';
import type {
  CreateListingDto,
  SearchListingDto,
  UpdateListingDto,
} from './dto/listing.dto.js';
import { buildListingQuery } from './listing.filter.js';
import { AUTHOR_FIELDS, toListing, withFullAddress } from './listing.mapper.js';
import { Listing, type ListingDocument } from './schemas/listing.schema.js';

@Injectable()
export class ListingService {
  constructor(
    @InjectModel(Listing.name)
    private readonly listingModel: Model<ListingDocument>,
  ) {}

  async search(query: SearchListingDto) {
    const { filter, sort, skip, limit } = buildListingQuery(query);
    const [docs, total] = await Promise.all([
      this.listingModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('author', AUTHOR_FIELDS)
        .exec(),
      this.listingModel.countDocuments(filter).exec(),
    ]);

    return {
      items: docs.map((doc) => toListing(doc)),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  /** Số tin active theo transaction × category × city. */
  stats() {
    return this.listingModel
      .aggregate<{
        transaction: string;
        category: string;
        city: string;
        count: number;
      }>([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: {
              transaction: '$transaction',
              category: '$category',
              city: '$address.city',
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            transaction: '$_id.transaction',
            category: '$_id.category',
            city: '$_id.city',
            count: 1,
          },
        },
      ])
      .exec();
  }

  async findMine(userId: string) {
    const docs = await this.listingModel
      .find({ author: userId })
      .sort({ createdAt: -1 })
      .populate('author', AUTHOR_FIELDS)
      .exec();
    return docs.map((doc) => toListing(doc));
  }

  async findActive(id: string) {
    if (!isValidObjectId(id))
      throw new NotFoundException('Không tìm thấy tin đăng');

    const doc = await this.listingModel
      .findOne({ _id: id, status: 'active' })
      .populate('author', AUTHOR_FIELDS)
      .exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tin đăng');

    const listingCount = await this.listingModel
      .countDocuments({ author: doc.author._id, status: 'active' })
      .exec();
    return toListing(doc, listingCount);
  }

  async create(user: AuthUser, dto: CreateListingDto) {
    const doc = await this.listingModel.create({
      ...dto,
      address: withFullAddress(dto.address),
      author: user.sub,
      status: 'active',
    });
    await doc.populate('author', AUTHOR_FIELDS);
    return toListing(doc);
  }

  async update(user: AuthUser, id: string, dto: UpdateListingDto) {
    const doc = await this.findOwned(user, id);
    doc.set({
      ...dto,
      ...(dto.address && { address: withFullAddress(dto.address) }),
    });
    await doc.save();
    await doc.populate('author', AUTHOR_FIELDS);
    return toListing(doc);
  }

  async remove(user: AuthUser, id: string) {
    const doc = await this.findOwned(user, id);
    await doc.deleteOne();
    return null;
  }

  /** Tin tồn tại và user là chủ tin hoặc admin. */
  private async findOwned(user: AuthUser, id: string) {
    if (!isValidObjectId(id))
      throw new NotFoundException('Không tìm thấy tin đăng');

    const doc = await this.listingModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Không tìm thấy tin đăng');
    if (!doc.author.equals(user.sub) && user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền sửa tin đăng này');
    }
    return doc;
  }
}
