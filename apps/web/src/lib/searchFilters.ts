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
