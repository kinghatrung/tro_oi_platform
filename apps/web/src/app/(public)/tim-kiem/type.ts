export interface SearchPageProps {
  searchParams: Promise<{
    keyword?: string;
    city?: string;
    district?: string;
    transaction?: string | string[];
    category?: string | string[];
    minPrice?: string | string[];
    maxPrice?: string | string[];
    page?: string;
  }>;
}
