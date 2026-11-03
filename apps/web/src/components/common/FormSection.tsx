import type { ReactNode } from 'react';
import { Card, Flex } from 'antd';

interface FormSectionProps {
  step: number;
  title: string;
  description?: string;
  children: ReactNode;
}

/** Khối form có số thứ tự + tiêu đề + mô tả ngắn (form đăng tin, đăng bán). */
export function FormSection({ step, title, description, children }: FormSectionProps) {
  return (
    <Card variant="borderless">
      <Flex gap={12} className="mb-4!">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
          {step}
        </span>
        <div>
          <h2 className="text-[16px] font-bold text-ink">{title}</h2>
          {description && <p className="text-sm text-subtle">{description}</p>}
        </div>
      </Flex>
      {children}
    </Card>
  );
}
