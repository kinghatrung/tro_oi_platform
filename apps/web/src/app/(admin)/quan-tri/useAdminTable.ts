import { useCallback, useEffect, useState } from 'react';
import { App, type TablePaginationConfig } from 'antd';
import type { BaseListRequest, PagedResponse } from '@tro-oi/shared';

import { ADMIN_PAGE_SIZE } from './const';

/**
 * Bảng phân trang phía server cho các trang quản trị.
 * Đổi bộ lọc qua `updateQuery` (tự về trang 1), gọi `reload` sau khi sửa/xoá.
 */
export function useAdminTable<TItem, TQuery extends BaseListRequest>(
  fetcher: (query: TQuery) => Promise<PagedResponse<TItem>>,
  initialQuery: TQuery,
) {
  const { message } = App.useApp();
  const [query, setQuery] = useState<TQuery>({
    pageSize: ADMIN_PAGE_SIZE,
    page: 1,
    ...initialQuery,
  });
  const [data, setData] = useState<PagedResponse<TItem>>();
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await fetcher(query));
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, message, query]);

  const updateQuery = useCallback((changes: Partial<TQuery>) => {
    setQuery((current) => ({ ...current, ...changes, page: 1 }));
  }, []);

  const pagination: TablePaginationConfig = {
    current: query.page,
    pageSize: query.pageSize,
    total: data?.total ?? 0,
    showSizeChanger: false,
    showTotal: (total) => `${total} mục`,
    onChange: (page) => setQuery((current) => ({ ...current, page })),
  };

  useEffect(() => {
    void reload();
  }, [reload]);

  return { items: data?.items ?? [], isLoading, query, updateQuery, reload, pagination };
}
