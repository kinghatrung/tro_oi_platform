'use client';

import { Table, type TableColumnsType, type TableProps } from 'antd';

import { EmptyState, EmptyVariant } from '@/components/common';

interface DataTableProps<T> extends TableProps<T> {
  columns: TableColumnsType<T>;
  /** Cột STT đầu bảng, đánh số tiếp theo trang. */
  indexColumn?: boolean;
}

/**
 * Bảng quản trị dùng chung: cột STT, lấp đầy phần còn lại của PageCard —
 * thân bảng tự cuộn (dọc + ngang), header và phân trang cố định (CSS .fill-table ở globals.css).
 */
export function DataTable<T extends object>({
  columns,
  indexColumn = true,
  pagination,
  ...rest
}: DataTableProps<T>) {
  const offset = pagination ? ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 0) : 0;
  const allColumns: TableColumnsType<T> = indexColumn
    ? [
        {
          title: 'STT',
          key: '__index',
          width: 64,
          align: 'center',
          render: (_, __, index) => offset + index + 1,
        },
        ...columns,
      ]
    : columns;

  return (
    <Table<T>
      columns={allColumns}
      pagination={pagination}
      // y bất kỳ để antd tách header cố định; chiều cao thật do flex (.fill-table)
      scroll={{ x: 'max-content', y: '100%' }}
      className="fill-table"
      locale={{
        emptyText: (
          <EmptyState
            variant={EmptyVariant.SEARCH}
            size="small"
            description="Không có dữ liệu phù hợp"
          />
        ),
      }}
      {...rest}
    />
  );
}
