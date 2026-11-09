'use client';

import Link from 'next/link';
import { Segmented, Tag, type TableColumnsType } from 'antd';
import {
  AUDIT_TARGET_LABELS,
  AuditTargetType,
  type AuditLog,
  type AuditLogQuery,
} from '@tro-oi/shared';

import { searchAuditLogs } from '@/api/admin';
import { DataTable, FilterBar, PageCard } from '@/components/admin';

import { useAdminTable } from '../useAdminTable';

const ALL = 'all';
const TARGET_FILTERS = [
  { value: ALL, label: 'Tất cả' },
  ...Object.values(AuditTargetType).map((type) => ({
    value: type,
    label: AUDIT_TARGET_LABELS[type],
  })),
];
const INITIAL_QUERY: AuditLogQuery = {};

/** Trang công khai của đối tượng (nếu có). */
const TARGET_HREF: Partial<Record<AuditTargetType, (id: string) => string>> = {
  [AuditTargetType.LISTING]: (id) => `/phong-tro/${id}`,
  [AuditTargetType.PRODUCT]: (id) => `/cho-oi/${id}`,
  [AuditTargetType.USER]: (id) => `/nguoi-dung/${id}`,
  [AuditTargetType.REVIEW]: (id) => `/nguoi-dung/${id}`,
};

const COLUMNS: TableColumnsType<AuditLog> = [
  {
    title: 'Thời gian',
    dataIndex: 'createdAt',
    width: 170,
    render: (value: string) => new Date(value).toLocaleString('vi-VN'),
  },
  {
    title: 'Người thực hiện',
    key: 'actor',
    width: 180,
    render: (_, log) => log.actor?.name ?? <span className="text-subtle">(Đã xoá)</span>,
  },
  {
    title: 'Thao tác',
    dataIndex: 'action',
    width: 200,
    render: (action: string) => <span className="font-medium text-ink">{action}</span>,
  },
  {
    title: 'Đối tượng',
    key: 'target',
    render: (_, log) => {
      const href = log.targetId && TARGET_HREF[log.targetType]?.(log.targetId);
      return (
        <div className="min-w-56">
          <Tag>{AUDIT_TARGET_LABELS[log.targetType]}</Tag>
          {log.targetTitle &&
            (href ? (
              <Link href={href} target="_blank" className="font-semibold">
                {log.targetTitle}
              </Link>
            ) : (
              <span className="font-semibold">{log.targetTitle}</span>
            ))}
        </div>
      );
    },
  },
];

/** Nhật ký thao tác của admin: duyệt/ẩn/xoá tin, quyền & khoá người dùng, báo cáo, thiết lập. */
export default function AdminAuditLogPage() {
  const { items, isLoading, query, updateQuery, reload, pagination } = useAdminTable(
    searchAuditLogs,
    INITIAL_QUERY,
    'thao tác',
  );

  return (
    <PageCard>
      <FilterBar
        onReload={reload}
        quickFilters={
          <Segmented
            options={TARGET_FILTERS}
            value={query.targetType ?? ALL}
            onChange={(value) =>
              updateQuery({ targetType: value === ALL ? undefined : (value as AuditTargetType) })
            }
          />
        }
      />
      <DataTable<AuditLog>
        rowKey="id"
        columns={COLUMNS}
        dataSource={items}
        loading={isLoading}
        pagination={pagination}
      />
    </PageCard>
  );
}
