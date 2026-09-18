'use client';

import { Empty } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

import { CardItem, HeaderToolbar, PaginationControl } from '@/components/common';

type ViewMode = 'list' | 'grid';
type AuthorType = 'personal' | 'broker';

export interface SearchListing {
  id: number;
  title: string;
  price: number;
  countMedia: number;
  bedrooms: number;
  propertyType: string;
  mainDirection: string;
  pricePerSquareMeter: number;
  timeAgo?: string;
  area: number;
  address: string;
  district: string;
  street: string;
  floorCount: number;
  furnishing: string;
  author: {
    name: string;
    posted: number;
    rank: string;
  };
  authorType: AuthorType;
  hasVideo: boolean;
  transaction: string;
  category: string;
}

interface SearchResultsProps {
  listings: SearchListing[];
  total: number;
  pageSize: number;
  currentPage: number;
}

/** Controls search-result presentation and URL-backed filters independently of page selection. */
export function SearchResults({ listings, total, pageSize, currentPage }: SearchResultsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab = ['all', 'personal', 'broker'].includes(tabParam ?? '') ? tabParam! : 'all';
  const sortParam = searchParams.get('sort');
  const sortKey = ['newest', 'price-asc', 'price-desc', 'area-desc'].includes(sortParam ?? '')
    ? sortParam!
    : 'newest';
  const viewMode: ViewMode = searchParams.get('view') === 'grid' ? 'grid' : 'list';
  const videoOnly = searchParams.get('video') === '1';

  const updateControl = (key: string, value: string, defaultValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === defaultValue) params.delete(key);
    else params.set(key, value);
    params.delete('page');

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  const visibleListings = useMemo(() => {
    const transaction = searchParams.get('transaction');
    const category = searchParams.get('category');
    const minPrice = Number(searchParams.get('minPrice')) * 1_000_000;
    const maxPrice = Number(searchParams.get('maxPrice')) * 1_000_000;

    return listings
      .filter((listing) => activeTab === 'all' || listing.authorType === activeTab)
      .filter((listing) => !videoOnly || listing.hasVideo)
      .filter((listing) => !transaction || listing.transaction === transaction)
      .filter((listing) => !category || listing.category === category)
      .filter((listing) => !minPrice || listing.price >= minPrice)
      .filter((listing) => !maxPrice || listing.price <= maxPrice)
      .sort((left, right) => {
        if (sortKey === 'price-asc') return left.price - right.price;
        if (sortKey === 'price-desc') return right.price - left.price;
        if (sortKey === 'area-desc') return right.area - left.area;
        return right.id - left.id;
      });
  }, [activeTab, listings, searchParams, sortKey, videoOnly]);

  return (
    <>
      <HeaderToolbar
        activeTab={activeTab}
        videoOnly={videoOnly}
        sortKey={sortKey}
        viewMode={viewMode}
        onTabChange={(value) => updateControl('tab', value, 'all')}
        onVideoOnlyChange={(checked) => updateControl('video', checked ? '1' : '0', '0')}
        onSortChange={(value) => updateControl('sort', value, 'newest')}
        onViewModeChange={(value) => updateControl('view', value, 'list')}
      />

      {visibleListings.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : ''}>
          {visibleListings.map((listing) => (
            <CardItem key={listing.id} {...listing} column={viewMode === 'list'} />
          ))}
        </div>
      ) : (
        <div className="bg-white py-12">
          <Empty description="Không có tin phù hợp" />
        </div>
      )}

      <PaginationControl
        total={total}
        pageSize={pageSize}
        currentPage={currentPage}
      />
    </>
  );
}
