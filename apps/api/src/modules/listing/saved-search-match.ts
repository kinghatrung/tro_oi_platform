/** Phần tin đăng cần để so với bộ lọc. */
export interface MatchableListing {
  title: string;
  transaction: string;
  category: string;
  price: number;
  area?: number;
  bedrooms?: number;
  amenities?: string[];
  address: { city?: string; ward?: string; fullAddress?: string };
}

/**
 * Bộ lọc có cấu trúc của 1 tìm kiếm đã lưu (giá theo VND) — lưu kèm `query` để Mongo tự lọc ra người
 * cần báo (savedSearchCondition), không phải nạp mọi user lên để so bằng JS.
 */
export interface SavedSearchFilter {
  keyword?: string;
  transaction?: string;
  category?: string;
  city?: string;
  ward?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  amenities?: string[];
}

const MILLION = 1_000_000;

/** Số không âm từ query; sai định dạng → bỏ qua bộ lọc đó (giống web toSearchRequest). */
const numberParam = (params: URLSearchParams, key: string) => {
  const text = params.get(key)?.trim();
  return text && /^\d+(\.\d+)?$/.test(text) ? Number(text) : undefined;
};

const includesText = (value: string | undefined, search: string) =>
  (value ?? '').toLowerCase().includes(search.toLowerCase());

/** Query string /tim-kiem (giá theo triệu) → bộ lọc (giá VND), bỏ field trống. */
export function parseSavedSearch(query: string): SavedSearchFilter {
  const params = new URLSearchParams(query);
  const text = (key: string) => params.get(key)?.trim() || undefined;
  const million = (key: string) => {
    const value = numberParam(params, key);
    return value === undefined ? undefined : value * MILLION;
  };
  const amenities = (params.get('amenities') ?? '').split(',').filter(Boolean);
  const filter: SavedSearchFilter = {
    keyword: text('keyword'),
    transaction: text('transaction'),
    category: text('category'),
    city: text('city'),
    ward: text('ward'),
    minPrice: million('minPrice'),
    maxPrice: million('maxPrice'),
    minArea: numberParam(params, 'minArea'),
    maxArea: numberParam(params, 'maxArea'),
    bedrooms: numberParam(params, 'bedrooms'),
    amenities: amenities.length > 0 ? amenities : undefined,
  };
  return Object.fromEntries(
    Object.entries(filter).filter(([, value]) => value !== undefined),
  ) as SavedSearchFilter;
}

/**
 * Tin có khớp 1 tìm kiếm đã lưu không. `query` là query string của /tim-kiem
 * (giá theo triệu) — cùng ngữ nghĩa với buildListingQuery ở GET /listings.
 */
export function matchesSavedSearch(
  listing: MatchableListing,
  query: string,
): boolean {
  const filter = parseSavedSearch(query);
  const checks = [
    !filter.transaction || filter.transaction === listing.transaction,
    !filter.category || filter.category === listing.category,
    !filter.city || filter.city === listing.address.city,
    !filter.ward || filter.ward === listing.address.ward,
    !filter.keyword ||
      includesText(listing.title, filter.keyword) ||
      includesText(listing.address.fullAddress, filter.keyword),
    filter.minPrice === undefined || listing.price >= filter.minPrice,
    filter.maxPrice === undefined || listing.price <= filter.maxPrice,
    filter.minArea === undefined || (listing.area ?? -1) >= filter.minArea,
    filter.maxArea === undefined ||
      (listing.area !== undefined && listing.area <= filter.maxArea),
    filter.bedrooms === undefined ||
      (listing.bedrooms ?? -1) >= filter.bedrooms,
    (filter.amenities ?? []).every((item) => listing.amenities?.includes(item)),
  ];
  return checks.every(Boolean);
}

/** Không đặt bộ lọc này, hoặc bộ lọc thoả `condition` (đường dẫn trong phần tử savedSearches). */
const unsetOr = (field: string, condition: unknown) => ({
  $or: [
    { [`filter.${field}`]: { $exists: false } },
    { [`filter.${field}`]: condition },
  ],
});
/** Tin thiếu giá trị → chỉ tìm kiếm không đặt bộ lọc đó mới khớp. */
const unsetOrWhen = <T>(
  field: string,
  value: T | undefined,
  condition: (value: T) => unknown,
) =>
  value === undefined
    ? { [`filter.${field}`]: { $exists: false } }
    : unsetOr(field, condition(value));

/**
 * Điều kiện `$elemMatch` trên `savedSearches`: mọi bộ lọc có cấu trúc khớp tin (trừ keyword —
 * so chữ trong tiêu đề, kiểm tra lại bằng matchesSavedSearch trên số ít ứng viên).
 */
export function savedSearchCondition(listing: MatchableListing) {
  return {
    filter: { $exists: true },
    $and: [
      unsetOr('transaction', listing.transaction),
      unsetOr('category', listing.category),
      unsetOrWhen('city', listing.address.city, (value) => value),
      unsetOrWhen('ward', listing.address.ward, (value) => value),
      unsetOr('minPrice', { $lte: listing.price }),
      unsetOr('maxPrice', { $gte: listing.price }),
      unsetOrWhen('minArea', listing.area, (value) => ({ $lte: value })),
      unsetOrWhen('maxArea', listing.area, (value) => ({ $gte: value })),
      unsetOrWhen('bedrooms', listing.bedrooms, (value) => ({ $lte: value })),
      // Mọi tiện ích đã chọn đều có trong tin
      {
        'filter.amenities': {
          $not: { $elemMatch: { $nin: listing.amenities ?? [] } },
        },
      },
    ],
  };
}
