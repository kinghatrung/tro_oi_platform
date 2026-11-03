import {
  ProductCategory,
  ProductCondition,
  PropertyCategory,
  TransactionType,
  type SearchListingRequest,
  type SearchProductRequest,
  type SortDirection,
} from '@tro-oi/shared';

import { CITIES, SORT_OPTIONS } from '@/constants';
import { PRODUCT_PRICE_RANGES, PRODUCT_SORT_OPTIONS } from '@/lib/constants/constantsProduct';

type QueryValue = string | string[] | undefined;

/** Match URLSearchParams.get: repeated selection fields use their first value. */
export function firstQueryValue(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePrice(value: QueryValue): number | undefined {
  if (value === undefined || value === '') return undefined;
  if (Array.isArray(value) || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value.trim())) {
    return NaN;
  }
  return Number(value) * 1_000_000;
}

/** Số không âm từ query; sai định dạng → bỏ qua (undefined). */
function parseNonNegative(value: QueryValue): number | undefined {
  const text = firstQueryValue(value)?.trim();
  if (!text || !/^\d+(?:\.\d+)?$/.test(text)) return undefined;
  return Number(text);
}

export function parsePriceRange(minValue: QueryValue, maxValue: QueryValue) {
  const minPrice = parsePrice(minValue);
  const maxPrice = parsePrice(maxValue);
  const valid =
    (minPrice === undefined || Number.isFinite(minPrice)) &&
    (maxPrice === undefined || Number.isFinite(maxPrice)) &&
    (minPrice === undefined || maxPrice === undefined || minPrice <= maxPrice);

  return { minPrice, maxPrice, valid };
}

/** Pagination does not change the identity of a saved search. */
export function searchQueryKey(params: URLSearchParams): string {
  const filters = new URLSearchParams(params);
  filters.delete('page');
  filters.sort();
  return filters.toString();
}

const isEnumValue = <TEnum extends Record<string, string>>(
  enumObject: TEnum,
  value?: string,
): value is TEnum[keyof TEnum] => Object.values(enumObject).includes(value ?? '');

/**
 * searchParams của /tim-kiem → request GET /listings.
 * Giá trị không hợp lệ bị bỏ qua thay vì làm API trả 400.
 */
export function toSearchRequest(
  params: Record<string, QueryValue>,
  pageSize: number,
): { request: SearchListingRequest; isPriceValid: boolean } {
  const { minPrice, maxPrice, valid } = parsePriceRange(params.minPrice, params.maxPrice);
  const transaction = firstQueryValue(params.transaction);
  const category = firstQueryValue(params.category);
  const sort =
    SORT_OPTIONS.find(({ key }) => key === firstQueryValue(params.sort)) ?? SORT_OPTIONS[0];
  const page = Number(firstQueryValue(params.page));

  return {
    isPriceValid: valid,
    request: {
      keyword: firstQueryValue(params.keyword)?.trim() || undefined,
      city: firstQueryValue(params.city) || undefined,
      district: firstQueryValue(params.district)?.trim() || undefined,
      transaction: isEnumValue(TransactionType, transaction) ? transaction : undefined,
      category: isEnumValue(PropertyCategory, category) ? category : undefined,
      minPrice: valid ? minPrice : undefined,
      maxPrice: valid ? maxPrice : undefined,
      minArea: parseNonNegative(params.minArea),
      maxArea: parseNonNegative(params.maxArea),
      bedrooms: parseNonNegative(params.bedrooms),
      sortBy: sort.sortBy,
      sortDirection: sort.sortDirection,
      page: Number.isInteger(page) && page > 0 ? page : 1,
      pageSize,
    },
  };
}

/** searchParams của /cho-oi → request GET /products. Giá trị không hợp lệ bị bỏ qua. */
export function toProductSearchRequest(
  params: Record<string, QueryValue>,
  pageSize: number,
): SearchProductRequest {
  const category = firstQueryValue(params.category);
  const condition = firstQueryValue(params.condition);
  const city = firstQueryValue(params.city);
  const price = PRODUCT_PRICE_RANGES.find(({ key }) => key === firstQueryValue(params.price));
  const sort =
    PRODUCT_SORT_OPTIONS.find(({ value }) => value === firstQueryValue(params.sort)) ??
    PRODUCT_SORT_OPTIONS[0];
  const page = Number(firstQueryValue(params.page));

  return {
    keyword: firstQueryValue(params.keyword)?.trim() || undefined,
    category: isEnumValue(ProductCategory, category) ? category : undefined,
    condition: isEnumValue(ProductCondition, condition) ? condition : undefined,
    city: CITIES.find((item) => item === city),
    district: firstQueryValue(params.district)?.trim() || undefined,
    minPrice: price && 'min' in price ? price.min : undefined,
    maxPrice: price && 'max' in price ? price.max : undefined,
    sortBy: sort.sortBy,
    sortDirection: sort.sortDirection as SortDirection,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize,
  };
}
