import { Types } from 'mongoose';

import { SearchListingDto } from './dto/listing.dto.js';
import { buildListingQuery } from './listing.filter.js';

const dto = (values: Partial<SearchListingDto>) =>
  Object.assign(new SearchListingDto(), values);

describe('buildListingQuery', () => {
  it('mặc định: chỉ tin active, mới nhất trước, trang 1 x 10', () => {
    expect(buildListingQuery(dto({}))).toEqual({
      filter: { status: 'active' },
      sort: { createdAt: -1, _id: -1 },
      skip: 0,
      limit: 10,
    });
  });

  it('ghép đủ điều kiện lọc, khoảng giá và phân trang', () => {
    const authorId = new Types.ObjectId().toHexString();
    const { filter, sort, skip, limit } = buildListingQuery(
      dto({
        keyword: ' Cầu (Giấy) ',
        transaction: 'rent-room',
        category: 'phong-tro',
        city: 'Hà Nội',
        minPrice: 0,
        maxPrice: 5_000_000,
        bedrooms: 2,
        authorId,
        page: 3,
        pageSize: 20,
        sortBy: 'price',
        sortDirection: 'asc',
      }),
    );

    // keyword được escape regex, giữ nguyên ký tự ngoặc
    const [titleClause] = filter.$or as { title: RegExp }[];
    expect(titleClause.title.test('Phòng trọ cầu (giấy)')).toBe(true);
    expect(filter).toMatchObject({
      status: 'active',
      transaction: 'rent-room',
      category: 'phong-tro',
      'address.city': 'Hà Nội',
      price: { $gte: 0, $lte: 5_000_000 },
      bedrooms: { $gte: 2 },
      author: new Types.ObjectId(authorId),
    });
    expect(sort).toEqual({ price: 1, _id: -1 });
    expect(skip).toBe(40);
    expect(limit).toBe(20);
  });

  it('chỉ có maxArea thì không sinh $gte', () => {
    expect(buildListingQuery(dto({ maxArea: 30 })).filter.area).toEqual({
      $lte: 30,
    });
  });
});
