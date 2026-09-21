export interface SearchPageProps {
  searchParams: Promise<{
    keyword?: string;
    city?: string;
    district?: string;
    minPrice?: string;
    maxPrice?: string;
    page?: string;
  }>;
}
