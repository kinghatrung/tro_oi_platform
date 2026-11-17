'use client';

import { Segmented, Tag, Tooltip, type TableColumnsType } from 'antd';
import { ThumbsDown, ThumbsUp } from 'lucide-react';

import {
  searchAssistantLogs,
  type AssistantLogFilter,
  type AssistantLogFlag,
  type AssistantLogItem,
} from '@/api/assistant';
import { DataTable, FilterBar, PageCard } from '@/components/admin';

import { useAdminTable } from '../useAdminTable';

const FILTERS: { value: AssistantLogFilter; label: string }[] = [
  { value: 'review', label: 'Cần xem lại' },
  { value: 'disliked', label: '👎 Chưa tốt' },
  { value: 'liked', label: '👍 Hữu ích' },
  { value: 'all', label: 'Tất cả' },
];

/** Dấu dịch vụ AI tự gắn — nghĩa của từng dấu, để admin biết cần sửa gì. */
const FLAGS: Record<AssistantLogFlag, { label: string; color: string; hint: string }> = {
  error: {
    label: 'Lỗi',
    color: 'error',
    hint: 'Model lỗi / quá tải — người dùng không nhận được câu trả lời',
  },
  no_answer: { label: 'Không trả lời', color: 'warning', hint: 'Model không viết câu trả lời' },
  no_results: {
    label: '0 kết quả',
    color: 'warning',
    hint: 'Công cụ tìm không ra gì — có thể thiếu tin ở khu vực đó, hoặc AI lọc sai',
  },
  tool_error: {
    label: 'Công cụ lỗi',
    color: 'orange',
    hint: 'AI gọi công cụ sai tham số hoặc API báo lỗi',
  },
};

const INITIAL_QUERY = { filter: 'review' as AssistantLogFilter };

const COLUMNS: TableColumnsType<AssistantLogItem> = [
  {
    title: 'Thời gian',
    dataIndex: 'createdAt',
    width: 150,
    render: (value: string, item) => (
      <div className="text-sm">
        <p>{new Date(value).toLocaleString('vi-VN')}</p>
        <Tag className="mt-1">{item.section === 'market' ? 'Chợ ơi' : 'Trọ ơi'}</Tag>
      </div>
    ),
  },
  {
    title: 'Hội thoại',
    key: 'conversation',
    render: (_, item) => (
      <div className="min-w-72 max-w-xl space-y-1 text-sm">
        <p className="font-semibold text-ink">❓ {item.question}</p>
        <p className="line-clamp-4 whitespace-pre-line text-body">
          {item.answer || <span className="text-subtle">(không có câu trả lời)</span>}
        </p>
        {item.cards > 0 && <p className="text-xs text-subtle">+ {item.cards} thẻ tin</p>}
        {item.error && <p className="text-xs text-red-500">{item.error}</p>}
      </div>
    ),
  },
  {
    title: 'AI đã làm',
    key: 'tools',
    width: 220,
    render: (_, item) =>
      item.tools.length === 0 ? (
        <span className="text-xs text-subtle">Không gọi công cụ</span>
      ) : (
        <div className="flex flex-col gap-1">
          {item.tools.map((tool, index) => (
            <Tooltip
              key={index}
              title={<pre className="m-0 text-xs">{JSON.stringify(tool.args, null, 2)}</pre>}
            >
              <Tag className="w-fit cursor-help" color={tool.error ? 'orange' : undefined}>
                {tool.name}
                {tool.total !== undefined && ` → ${tool.total}`}
                {tool.error && ' ⚠'}
              </Tag>
            </Tooltip>
          ))}
        </div>
      ),
  },
  {
    title: 'Dấu hiệu',
    key: 'flags',
    width: 150,
    render: (_, item) => (
      <div className="flex flex-wrap gap-1">
        {item.rating === 1 && (
          <Tag color="success" icon={<ThumbsUp size={12} className="mr-1 inline" />}>
            Hữu ích
          </Tag>
        )}
        {item.rating === -1 && (
          <Tag color="error" icon={<ThumbsDown size={12} className="mr-1 inline" />}>
            Chưa tốt
          </Tag>
        )}
        {item.flags.map((flag) => (
          <Tooltip key={flag} title={FLAGS[flag].hint}>
            <Tag color={FLAGS[flag].color}>{FLAGS[flag].label}</Tag>
          </Tooltip>
        ))}
      </div>
    ),
  },
  {
    title: 'Model',
    key: 'model',
    width: 170,
    render: (_, item) => (
      <div className="text-xs text-body">
        <p className="break-all">{item.model.replace(/^openai-compatible:/, '')}</p>
        <p>{(item.ms / 1000).toFixed(1)} giây</p>
      </div>
    ),
  },
];

/**
 * Nhật ký trợ lý AI (dịch vụ apps/ai): câu hỏi, câu trả lời, công cụ AI đã gọi, 👍/👎.
 * Mặc định chỉ các câu cần xem lại (bị 👎, lỗi, 0 kết quả…) — nguồn để sửa prompt / thêm kiến thức.
 */
export default function AdminAssistantPage() {
  const { items, isLoading, query, updateQuery, reload, pagination } = useAdminTable(
    searchAssistantLogs,
    INITIAL_QUERY,
    'lượt hỏi',
  );

  return (
    <PageCard>
      <FilterBar
        onReload={reload}
        quickFilters={
          <Segmented
            options={FILTERS}
            value={query.filter ?? 'review'}
            onChange={(value) => updateQuery({ filter: value as AssistantLogFilter })}
          />
        }
      />
      <DataTable<AssistantLogItem>
        mobileKeys={['createdAt', 'conversation', 'flags']}
        rowKey="id"
        columns={COLUMNS}
        dataSource={items}
        loading={isLoading}
        pagination={pagination}
      />
    </PageCard>
  );
}
