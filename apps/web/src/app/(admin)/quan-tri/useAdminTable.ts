import { useCallback, useEffect, useState } from 'react';
import { App, type TablePaginationConfig } from 'antd';
import type { BaseListRequest, PagedResponse } from '@tro-oi/shared';

import { ADMIN_PAGE_SIZE } from './const';

/**
 * Bảng phân trang phía server cho các trang quản trị.
 * Đổi bộ lọc qua `updateQuery` (tự về trang 1), thao tác trên dòng qua `runAction` (tự reload).
 */
export function useAdminTable<TItem, TQuery extends BaseListRequest>(
  fetcher: (query: TQuery) => Promise<PagedResponse<TItem>>,
  initialQuery: TQuery,
  /** Đơn vị ở dòng "Tổng N ...", vd "người dùng". */
  totalSuffix = 'mục',
) {
  const { message } = App.useApp();
  const [query, setQuery] = useState<TQuery>({
    pageSize: ADMIN_PAGE_SIZE,
    page: 1,
    ...initialQuery,
  });
  const [data, setData] = useState<PagedResponse<TItem>>();
  const [isLoading, setIsLoading] = useState(true);

  // Bật loading ở nơi đổi query / reload (event), effect chỉ gọi API — không setState đồng bộ trong effect
  const load = useCallback(
    () =>
      fetcher(query)
        .then(setData, (error: Error) => {
          message.error(error.message);
        })
        .finally(() => setIsLoading(false)),
    [fetcher, message, query],
  );

  const reload = useCallback(() => {
    setIsLoading(true);
    return load();
  }, [load]);

  const changeQuery = useCallback((update: (current: TQuery) => TQuery) => {
    setIsLoading(true);
    setQuery(update);
  }, []);

  const updateQuery = useCallback(
    (changes: Partial<TQuery>) => changeQuery((current) => ({ ...current, ...changes, page: 1 })),
    [changeQuery],
  );

  /** Chạy thao tác trên 1 dòng (duyệt, khoá, xoá...): báo kết quả rồi tải lại bảng. */
  const runAction = useCallback(
    async (action: () => Promise<unknown>, successText: string) => {
      try {
        await action();
        message.success(successText);
        await reload();
        return true;
      } catch (error) {
        message.error((error as Error).message);
        return false;
      }
    },
    [message, reload],
  );

  const pagination: TablePaginationConfig = {
    current: query.page,
    pageSize: query.pageSize,
    total: data?.total ?? 0,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50],
    showTotal: (total) => `Tổng ${total} ${totalSuffix}`,
    onChange: (page, pageSize) => changeQuery((current) => ({ ...current, page, pageSize })),
  };

  useEffect(() => {
    void load();
  }, [load]);

  return { items: data?.items ?? [], isLoading, query, updateQuery, reload, runAction, pagination };
}
