'use client';

import { Pagination } from 'antd';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

interface PaginationControlProps {
  total: number;
  pageSize?: number;
  currentPage: number;
}

/** URL-synced pagination control using Ant Design Pagination. */
export function PaginationControl({ total, pageSize = 10, currentPage }: PaginationControlProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="pagination-circle py-4 mt-2 flex justify-center">
      <Pagination
        current={currentPage}
        total={total}
        pageSize={pageSize}
        onChange={handleChange}
        showSizeChanger={false}
        showTotal={(total, range) => `${range[0]}-${range[1]} trong ${total} tin`}
      />
    </div>
  );
}
