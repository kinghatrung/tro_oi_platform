'use client';

import { useState, type ReactNode } from 'react';
import { Badge, Button, Flex, Form, Input, Popover } from 'antd';
import { Filter, RotateCw, Search } from 'lucide-react';

export interface FilterBarAdvanced<A extends object> {
  /** Các `<Form.Item name=...>` của bộ lọc nâng cao. */
  fields: ReactNode;
  /** Bộ lọc đang áp dụng — mỗi lần mở popover bắt đầu từ đây. */
  values: A;
  /** Giá trị khi "Đặt lại"; khác mặc định mới tính vào số trên nút phễu. */
  defaultValues: A;
  onApply: (values: A) => void;
}

interface FilterBarProps<A extends object> {
  /** Có thì hiện ô từ khoá; Enter hoặc "Tìm kiếm" gọi `onSearch`. */
  keyword?: { placeholder: string; value?: string };
  onSearch?: (keyword: string | undefined) => void;
  /** Bộ lọc nhanh ngay trên thanh (Segmented trạng thái, tag đang lọc...). */
  quickFilters?: ReactNode;
  advanced?: FilterBarAdvanced<A>;
  /** Có thì hiện nút "Làm mới" tải lại bảng. */
  onReload?: () => void;
}

const isEmpty = (value: unknown) => value === undefined || value === null || value === '';

/** Popover phễu "Lọc nâng cao": form trong popover, Đặt lại / Áp dụng. */
function AdvancedFilterPopover<A extends object>({
  fields,
  values,
  defaultValues,
  onApply,
}: FilterBarAdvanced<A>) {
  const [form] = Form.useForm<A>();
  const [open, setOpen] = useState(false);
  const activeCount = (Object.keys(defaultValues) as (keyof A)[]).filter(
    (key) => !isEmpty(values[key]) && values[key] !== defaultValues[key],
  ).length;

  const handleOpenChange = (next: boolean) => {
    if (next) form.setFieldsValue(values as Parameters<typeof form.setFieldsValue>[0]);
    setOpen(next);
  };
  const handleApply = () => {
    onApply({ ...defaultValues, ...form.getFieldsValue() });
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
      trigger="click"
      placement="bottomRight"
      title="Lọc nâng cao"
      content={
        <Form form={form} layout="vertical" className="w-72" onFinish={handleApply}>
          {fields}
          <Flex justify="end" gap={8}>
            <Button
              onClick={() =>
                form.setFieldsValue(defaultValues as Parameters<typeof form.setFieldsValue>[0])
              }
            >
              Đặt lại
            </Button>
            <Button type="primary" htmlType="submit">
              Áp dụng
            </Button>
          </Flex>
        </Form>
      }
    >
      <Badge count={activeCount} size="small">
        <Button icon={<Filter size={16} />} aria-label="Lọc nâng cao" />
      </Badge>
    </Popover>
  );
}

/**
 * Thanh lọc đầu trang danh sách (theo cbs-fe):
 * [từ khoá] [lọc nhanh] ……… [phễu nâng cao] [Tìm kiếm] [Làm mới].
 */
export function FilterBar<A extends object>({
  keyword,
  onSearch,
  quickFilters,
  advanced,
  onReload,
}: FilterBarProps<A>) {
  const [text, setText] = useState(keyword?.value ?? '');
  const search = () => onSearch?.(text.trim() || undefined);

  return (
    <Flex wrap gap={8} align="center" justify="space-between">
      {/* basis-80: đủ chỗ thì chung hàng với nhóm nút, hẹp thì xuống hàng riêng */}
      <Flex wrap gap={8} align="center" className="min-w-0 grow basis-80">
        {keyword && (
          <Input
            allowClear
            prefix={<Search size={16} className="text-subtle" />}
            placeholder={keyword.placeholder}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onPressEnter={search}
            className="w-full! sm:w-72!"
          />
        )}
        {quickFilters && (
          <div className="flex max-w-full items-center gap-2 overflow-x-auto no-scrollbar">
            {quickFilters}
          </div>
        )}
      </Flex>
      <Flex wrap gap={8} align="center">
        {advanced && <AdvancedFilterPopover<A> {...advanced} />}
        {keyword && (
          <Button type="primary" icon={<Search size={16} />} onClick={search}>
            Tìm kiếm
          </Button>
        )}
        {onReload && (
          <Button icon={<RotateCw size={16} />} onClick={onReload}>
            Làm mới
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
