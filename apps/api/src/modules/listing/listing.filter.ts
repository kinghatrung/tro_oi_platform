import { Types } from 'mongoose';

import type { SearchListingDto } from './dto/listing.dto.js';

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Query tìm kiếm → filter/sort/phân trang Mongo. Chỉ lấy tin active. */
export function buildListingQuery(query: SearchListingDto) {
  const filter: Record<string, unknown> = { status: 'active' };

  if (query.keyword?.trim()) {
    const regex = new RegExp(escapeRegex(query.keyword.trim()), 'i');
    filter.$or = [{ title: regex }, { 'address.fullAddress': regex }];
  }
  if (query.transaction) filter.transaction = query.transaction;
  if (query.category) filter.category = query.category;
  if (query.city) filter['address.city'] = query.city;
  if (query.ward) filter['address.ward'] = query.ward;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined && { $gte: query.minPrice }),
      ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
    };
  }
  if (query.minArea !== undefined || query.maxArea !== undefined) {
    filter.area = {
      ...(query.minArea !== undefined && { $gte: query.minArea }),
      ...(query.maxArea !== undefined && { $lte: query.maxArea }),
    };
  }
  if (query.bedrooms !== undefined) filter.bedrooms = { $gte: query.bedrooms };
  if (query.amenities?.length) filter.amenities = { $all: query.amenities };
  if (query.authorId) filter.author = new Types.ObjectId(query.authorId);
  if (query.excludeId)
    filter._id = { $ne: new Types.ObjectId(query.excludeId) };

  const direction = query.sortDirection === 'asc' ? 1 : -1;
  // _id phụ để thứ tự ổn định giữa các trang khi giá trị sort trùng nhau
  const sort: Record<string, 1 | -1> = { [query.sortBy]: direction, _id: -1 };

  return {
    filter,
    sort,
    skip: (query.page - 1) * query.pageSize,
    limit: query.pageSize,
  };
}
