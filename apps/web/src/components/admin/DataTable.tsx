'use client';

import { Fragment, type ReactNode } from 'react';
import { Table, type TableColumnsType, type TableProps } from 'antd';
import type { ColumnType } from 'antd/es/table';

import { EmptyState, EmptyVariant } from '@/components/common';

interface DataTableProps<T> extends TableProps<T> {
  columns: TableColumnsType<T>;
  /** Cột STT đầu bảng, đánh số tiếp theo trang (ẩn trên điện thoại). */
  indexColumn?: boolean;
  /** Điện thoại: key (hoặc dataIndex) các cột vẽ lại dưới cột đầu — xem `withMobileSummary`. */
  mobileKeys?: string[];
}

const columnKey = <T,>(column: ColumnType<T>) => String(column.key ?? column.dataIndex);

/**
 * Bảng trên điện thoại (< sm): chỉ giữ cột đầu, các cột khác ẩn (`responsive`); cột có key trong
 * `mobileKeys` (trạng thái, thao tác...) vẽ lại thành 1 hàng dưới nội dung cột đầu.
 * Màn ≥ sm giữ nguyên bảng. Chỉ dùng cho bảng render phía client (useBreakpoint của antd).
 */
export function withMobileSummary<T>(
  columns: TableColumnsType<T>,
  mobileKeys: string[],
): TableColumnsType<T> {
  const [first, ...others] = columns as ColumnType<T>[];
  if (!first) return columns;
  const summary = mobileKeys
    .map((key) => others.find((column) => columnKey(column) === key))
    .filter((column): column is ColumnType<T> => Boolean(column));
  const cell = (column: ColumnType<T>, record: T, index: number) => {
    const value = column.dataIndex
      ? (record as Record<string, unknown>)[String(column.dataIndex)]
      : undefined;
    return (column.render ? column.render(value, record, index) : value) as ReactNode;
  };
  return [
    {
      ...first,
      render: (value, record, index) => (
        <>
          {first.render ? (first.render(value, record, index) as ReactNode) : (value as ReactNode)}
          {summary.length > 0 && (
            // max-w: trong bảng max-content, flex-wrap không chặn bề ngang thì không bao giờ xuống dòng
            <div className="mt-2 flex max-w-64 flex-wrap items-center gap-x-3 gap-y-2 sm:hidden">
              {summary.map((column) => (
                <Fragment key={columnKey(column)}>{cell(column, record, index)}</Fragment>
              ))}
            </div>
          )}
        </>
      ),
    },
    ...others.map((column) => ({ ...column, responsive: ['sm' as const] })),
  ];
}

/**
 * Bảng quản trị dùng chung: cột STT, lấp đầy phần còn lại của PageCard —
 * thân bảng tự cuộn (dọc + ngang), header và phân trang cố định (CSS .fill-table ở globals.css).
 */
export function DataTable<T extends object>({
  columns,
  indexColumn = true,
  mobileKeys,
  pagination,
  ...rest
}: DataTableProps<T>) {
  const offset = pagination ? ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 0) : 0;
  const dataColumns = mobileKeys ? withMobileSummary(columns, mobileKeys) : columns;
  const allColumns: TableColumnsType<T> = indexColumn
    ? [
        {
          title: 'STT',
          key: '__index',
          width: 64,
          align: 'center',
          responsive: ['sm'],
          render: (_, __, index) => offset + index + 1,
        },
        ...dataColumns,
      ]
    : dataColumns;

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
