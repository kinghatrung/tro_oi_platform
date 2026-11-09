import type { ReactNode } from 'react';
import { Form, Switch } from 'antd';

/** Tiêu đề nhóm trường trong form quản trị (giống Section của DynamicForm bên cbs-fe). */
export function FormSectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4 border-b border-line pb-2 not-first:mt-6">
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      {description && <p className="text-xs text-subtle">{description}</p>}
    </div>
  );
}

interface SwitchFieldProps {
  name: string;
  label: ReactNode;
  description?: ReactNode;
}

/** Hàng Switch có mô tả, gắn vào Form.Item `name`. */
export function SwitchField({ name, label, description }: SwitchFieldProps) {
  return (
    // div thường: antd Flex reset margin/padding đè lên class Tailwind
    <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3">
      <div>
        <p className="font-semibold text-ink">{label}</p>
        {description && <p className="text-sm text-subtle">{description}</p>}
      </div>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch />
      </Form.Item>
    </div>
  );
}
