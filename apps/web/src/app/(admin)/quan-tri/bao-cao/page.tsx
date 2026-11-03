'use client';

import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import {
  App,
  Button,
  Card,
  Flex,
  Popconfirm,
  Segmented,
  Select,
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from 'antd';
import { Check, EyeOff, X } from 'lucide-react';
import {
  ListingStatus,
  ProductStatus,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  ReportStatus,
  ReportTargetType,
  type AdminReportQuery,
  type Report,
} from '@tro-oi/shared';

import { searchAdminReports, updateAdminReport } from '@/api/admin';
import { updateListing } from '@/api/listings';
import { updateProduct } from '@/api/products';
import { formatRelativeTime } from '@/utils/helpers';

import { useAdminTable } from '../useAdminTable';

const STATUS_FILTERS = Object.values(ReportStatus).map((status) => ({
  value: status,
  label: REPORT_STATUS_LABELS[status],
}));
const STATUS_COLORS: Record<ReportStatus, string> = {
  [ReportStatus.OPEN]: 'warning',
  [ReportStatus.RESOLVED]: 'success',
  [ReportStatus.DISMISSED]: 'default',
};
const TARGET_OPTIONS = [
  { value: ReportTargetType.LISTING, label: 'Trọ ơi' },
  { value: ReportTargetType.PRODUCT, label: 'Chợ ơi' },
];
const INITIAL_QUERY: AdminReportQuery = { status: ReportStatus.OPEN };

const targetHref = (report: Report) =>
  report.targetType === ReportTargetType.LISTING
    ? `/phong-tro/${report.targetId}`
    : `/cho-oi/${report.targetId}`;

/** Xử lý báo cáo vi phạm: ẩn tin bị báo cáo, đánh dấu đã xử lý hoặc bỏ qua. */
export default function AdminReportsPage() {
  const { message } = App.useApp();
  const { items, isLoading, query, updateQuery, reload, pagination } = useAdminTable(
    searchAdminReports,
    INITIAL_QUERY,
  );

  const setReportStatus = useCallback(
    async (report: Report, status: ReportStatus, hideTarget = false) => {
      try {
        if (hideTarget) {
          await (report.targetType === ReportTargetType.LISTING
            ? updateListing(report.targetId, { status: ListingStatus.CLOSED })
            : updateProduct(report.targetId, { status: ProductStatus.CLOSED }));
        }
        await updateAdminReport(report.id, status);
        message.success(hideTarget ? 'Đã ẩn tin và đóng báo cáo' : 'Đã cập nhật báo cáo');
        await reload();
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [message, reload],
  );

  const columns = useMemo<TableColumnsType<Report>>(
    () => [
      {
        title: 'Tin bị báo cáo',
        key: 'target',
        render: (_, report) => (
          <div className="min-w-56">
            <Tag>{report.targetType === ReportTargetType.LISTING ? 'Trọ ơi' : 'Chợ ơi'}</Tag>
            {report.targetTitle ? (
              <Link href={targetHref(report)} target="_blank" className="font-semibold">
                {report.targetTitle}
              </Link>
            ) : (
              <span className="text-subtle">(Tin đã bị xoá)</span>
            )}
          </div>
        ),
      },
      {
        title: 'Lý do',
        key: 'reason',
        render: (_, report) => (
          <div className="min-w-48">
            <p className="font-medium text-ink">{REPORT_REASON_LABELS[report.reason]}</p>
            {report.note && <p className="text-xs text-body whitespace-pre-line">{report.note}</p>}
          </div>
        ),
      },
      {
        title: 'Người báo cáo',
        key: 'reporter',
        width: 150,
        render: (_, report) =>
          report.reporter && (
            <Link href={`/nguoi-dung/${report.reporter.id}`} target="_blank">
              {report.reporter.name}
            </Link>
          ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        width: 120,
        render: (status: ReportStatus) => (
          <Tag color={STATUS_COLORS[status]}>{REPORT_STATUS_LABELS[status]}</Tag>
        ),
      },
      {
        title: 'Thời gian',
        dataIndex: 'createdAt',
        width: 120,
        render: (value: string) => formatRelativeTime(value),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 130,
        fixed: 'right',
        render: (_, report) =>
          report.status === ReportStatus.OPEN && (
            <Flex gap={4}>
              {report.targetTitle && (
                <Popconfirm
                  title="Ẩn tin này và đóng báo cáo?"
                  okText="Ẩn tin"
                  cancelText="Huỷ"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => setReportStatus(report, ReportStatus.RESOLVED, true)}
                >
                  <Tooltip title="Ẩn tin vi phạm">
                    <Button size="small" danger aria-label="Ẩn tin" icon={<EyeOff size={14} />} />
                  </Tooltip>
                </Popconfirm>
              )}
              <Tooltip title="Đánh dấu đã xử lý">
                <Button
                  size="small"
                  aria-label="Đã xử lý"
                  icon={<Check size={14} />}
                  onClick={() => setReportStatus(report, ReportStatus.RESOLVED)}
                />
              </Tooltip>
              <Tooltip title="Bỏ qua (không vi phạm)">
                <Button
                  size="small"
                  aria-label="Bỏ qua"
                  icon={<X size={14} />}
                  onClick={() => setReportStatus(report, ReportStatus.DISMISSED)}
                />
              </Tooltip>
            </Flex>
          ),
      },
    ],
    [setReportStatus],
  );

  return (
    <Card variant="borderless">
      <h1 className="text-primary mb-4 text-xl!">Báo cáo vi phạm</h1>
      <Flex wrap gap={8} align="center" className="mb-4!">
        <Segmented
          options={STATUS_FILTERS}
          value={query.status}
          onChange={(value) => updateQuery({ status: value as ReportStatus })}
        />
        <Select
          allowClear
          placeholder="Nguồn"
          className="min-w-32"
          options={TARGET_OPTIONS}
          value={query.targetType}
          onChange={(value) => updateQuery({ targetType: value })}
        />
      </Flex>
      <Table<Report>
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        pagination={pagination}
        scroll={{ x: 1000 }}
      />
    </Card>
  );
}
