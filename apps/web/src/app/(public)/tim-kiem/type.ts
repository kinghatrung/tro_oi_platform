export interface SearchPageProps {
  searchParams: Promise<{
    keyword?: string | string[];
    city?: string | string[];
    district?: string | string[];
    transaction?: string | string[];
    category?: string | string[];
    minPrice?: string | string[];
    maxPrice?: string | string[];
    sort?: string | string[];
    page?: string | string[];
  }>;
}
