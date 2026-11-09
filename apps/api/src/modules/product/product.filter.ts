import { Types } from 'mongoose';

import type { SearchProductDto } from './dto/product.dto.js';

export const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Query tìm đồ → filter/sort/phân trang Mongo. Chỉ lấy món đang bán. */
export function buildProductQuery(query: SearchProductDto) {
  const filter: Record<string, unknown> = { status: 'active' };

  if (query.keyword?.trim()) {
    filter.title = new RegExp(escapeRegex(query.keyword.trim()), 'i');
  }
  if (query.category) filter.category = query.category;
  if (query.condition) filter.condition = query.condition;
  if (query.city) filter['address.city'] = query.city;
  if (query.ward) filter['address.ward'] = query.ward;
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {
      ...(query.minPrice !== undefined && { $gte: query.minPrice }),
      ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
    };
  }
  if (query.sellerId) filter.seller = new Types.ObjectId(query.sellerId);
  if (query.excludeId) {
    filter._id = { $ne: new Types.ObjectId(query.excludeId) };
  }

  const direction = query.sortDirection === 'asc' ? 1 : -1;
  const sort: Record<string, 1 | -1> = { [query.sortBy]: direction, _id: -1 };

  return {
    filter,
    sort,
    skip: (query.page - 1) * query.pageSize,
    limit: query.pageSize,
  };
}
