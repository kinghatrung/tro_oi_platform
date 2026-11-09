import { SearchProductDto } from './dto/product.dto.js';
import { buildProductQuery } from './product.filter.js';

const dto = (values: Partial<SearchProductDto>) =>
  Object.assign(new SearchProductDto(), values);

describe('buildProductQuery', () => {
  it('mặc định: chỉ món đang bán, mới nhất trước, 12 món/trang', () => {
    expect(buildProductQuery(dto({}))).toEqual({
      filter: { status: 'active' },
      sort: { createdAt: -1, _id: -1 },
      skip: 0,
      limit: 12,
    });
  });

  it('lọc theo danh mục, tình trạng, khoảng giá và escape từ khoá', () => {
    const { filter, sort, skip } = buildProductQuery(
      dto({
        keyword: 'tủ (gỗ)',
        category: 'furniture',
        condition: 'like-new',
        maxPrice: 500_000,
        sortBy: 'price',
        sortDirection: 'asc',
        page: 2,
      }),
    );
    expect((filter.title as RegExp).test('Tủ (gỗ) 2 cánh')).toBe(true);
    expect(filter).toMatchObject({
      category: 'furniture',
      condition: 'like-new',
      price: { $lte: 500_000 },
    });
    expect(sort).toEqual({ price: 1, _id: -1 });
    expect(skip).toBe(12);
    expect(
      buildProductQuery(dto({ ward: 'Phường Cầu Giấy' })).filter[
        'address.ward'
      ],
    ).toBe('Phường Cầu Giấy');
  });
});
