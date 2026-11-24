'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Rate, type TableColumnsType } from 'antd';
import { Check, Trash2 } from 'lucide-react';
import type { BaseListRequest, PendingReview } from '@tro-oi/shared';

import { approveReview, searchPendingReviews } from '@/api/admin';
import { deleteReview } from '@/api/reviews';
import { DataTable, FilterBar, IconAction, PageCard, RowActions } from '@/components/admin';
import { formatRelativeTime } from '@/utils/helpers';

import { useAdminTable } from '../useAdminTable';

const INITIAL_QUERY: BaseListRequest = {};

const person = (value: PendingReview['reviewer']) =>
  value ? (
    <Link href={`/nguoi-dung/${value.id}`} target="_blank">
      {value.name}
    </Link>
  ) : (
    <span className="text-subtle">Người dùng đã xoá</span>
  );

/** Đánh giá chờ duyệt (khi bật "Duyệt đánh giá trước khi hiển thị"): duyệt hoặc từ chối (xoá). */
export default function AdminReviewsPage() {
  const { items, isLoading, reload, runAction, pagination } = useAdminTable(
    searchPendingReviews,
    INITIAL_QUERY,
    'đánh giá chờ duyệt',
  );

  const columns = useMemo<TableColumnsType<PendingReview>>(
    () => [
      {
        title: 'Đánh giá',
        key: 'review',
        render: (_, review) => (
          <div className="flex flex-col gap-1">
            <Rate disabled value={review.rating} className="text-sm!" />
            <span className="whitespace-pre-line text-body">
              {review.comment || <span className="text-subtle">(không có nhận xét)</span>}
            </span>
          </div>
        ),
      },
      {
        title: 'Người viết',
        key: 'reviewer',
        width: 150,
        render: (_, review) => person(review.reviewer),
      },
      {
        title: 'Người được đánh giá',
        key: 'target',
        width: 170,
        render: (_, review) => person(review.target),
      },
      {
        title: 'Gửi lúc',
        dataIndex: 'updatedAt',
        width: 120,
        render: (value: string) => formatRelativeTime(value),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_, review) => (
          <RowActions>
            <IconAction
              title="Duyệt — hiện công khai"
              icon={<Check size={14} />}
              onClick={() => runAction(() => approveReview(review.id), 'Đã duyệt đánh giá')}
            />
            <IconAction
              title="Từ chối — xoá đánh giá"
              icon={<Trash2 size={14} />}
              danger
              confirm={{ title: 'Xoá đánh giá này?', okText: 'Xoá' }}
              onClick={() => runAction(() => deleteReview(review.id), 'Đã xoá đánh giá')}
            />
          </RowActions>
        ),
      },
    ],
    [runAction],
  );

  return (
    <PageCard>
      <FilterBar onReload={reload} />
      <DataTable<PendingReview>
        mobileKeys={['review', 'actions']}
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        pagination={pagination}
      />
    </PageCard>
  );
}
