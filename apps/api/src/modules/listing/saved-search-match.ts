/** Phần tin đăng cần để so với bộ lọc. */
export interface MatchableListing {
  title: string;
  transaction: string;
  category: string;
  price: number;
  area?: number;
  bedrooms?: number;
  amenities?: string[];
  address: { city?: string; district?: string; fullAddress?: string };
}

const MILLION = 1_000_000;

/** Số không âm từ query; sai định dạng → bỏ qua bộ lọc đó (giống web toSearchRequest). */
const numberParam = (params: URLSearchParams, key: string) => {
  const text = params.get(key)?.trim();
  return text && /^\d+(\.\d+)?$/.test(text) ? Number(text) : undefined;
};

const includesText = (value: string | undefined, search: string) =>
  (value ?? '').toLowerCase().includes(search.toLowerCase());

/**
 * Tin có khớp 1 tìm kiếm đã lưu không. `query` là query string của /tim-kiem
 * (giá theo triệu) — cùng ngữ nghĩa với buildListingQuery ở GET /listings.
 */
export function matchesSavedSearch(
  listing: MatchableListing,
  query: string,
): boolean {
  const params = new URLSearchParams(query);
  const keyword = params.get('keyword')?.trim();
  const district = params.get('district')?.trim();
  const minPrice = numberParam(params, 'minPrice');
  const maxPrice = numberParam(params, 'maxPrice');
  const minArea = numberParam(params, 'minArea');
  const maxArea = numberParam(params, 'maxArea');
  const bedrooms = numberParam(params, 'bedrooms');
  const amenities = (params.get('amenities') ?? '').split(',').filter(Boolean);

  const checks = [
    !params.get('transaction') ||
      params.get('transaction') === listing.transaction,
    !params.get('category') || params.get('category') === listing.category,
    !params.get('city') || params.get('city') === listing.address.city,
    !district || includesText(listing.address.district, district),
    !keyword ||
      includesText(listing.title, keyword) ||
      includesText(listing.address.fullAddress, keyword),
    minPrice === undefined || listing.price >= minPrice * MILLION,
    maxPrice === undefined || listing.price <= maxPrice * MILLION,
    minArea === undefined || (listing.area ?? -1) >= minArea,
    maxArea === undefined ||
      (listing.area !== undefined && listing.area <= maxArea),
    bedrooms === undefined || (listing.bedrooms ?? -1) >= bedrooms,
    amenities.every((item) => listing.amenities?.includes(item)),
  ];
  return checks.every(Boolean);
}
