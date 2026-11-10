'use client';

import { useCallback, useState } from 'react';
import { App, Form, Input, Modal, Radio } from 'antd';
import {
  REPORT_REASON_LABELS,
  REVIEW_REPORT_REASON_LABELS,
  ReportTargetType,
  type ReportReason,
} from '@tro-oi/shared';

import { createReport } from '@/api/reports';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
}

interface ReportFormValues {
  reason: ReportReason;
  note?: string;
}

const toOptions = (labels: Partial<Record<ReportReason, string>>) =>
  (Object.entries(labels) as [ReportReason, string][]).map(([value, label]) => ({ value, label }));
const REASON_OPTIONS = toOptions(REPORT_REASON_LABELS);
const REVIEW_REASON_OPTIONS = toOptions(REVIEW_REPORT_REASON_LABELS);

/**
 * Báo cáo tin / đánh giá vi phạm → admin xử lý ở /quan-tri/bao-cao.
 * Ngoại lệ có chủ đích của "component thuần UI": tự gọi API để dùng chung cho Trọ ơi và Chợ ơi.
 * Nơi mở modal phải đảm bảo người dùng đã đăng nhập.
 */
export function ReportModal({ open, onClose, targetType, targetId }: ReportModalProps) {
  const isReview = targetType === ReportTargetType.REVIEW;
  const { message } = App.useApp();
  const [form] = Form.useForm<ReportFormValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (values: ReportFormValues) => {
      setIsSubmitting(true);
      try {
        await createReport({ targetType, targetId, ...values });
        message.success('Đã gửi báo cáo, cảm ơn bạn!');
        form.resetFields();
        onClose();
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, message, onClose, targetId, targetType],
  );

  return (
    <Modal
      title={isReview ? 'Báo cáo đánh giá' : 'Báo cáo tin đăng'}
      open={open}
      onCancel={onClose}
      onOk={form.submit}
      okText="Gửi báo cáo"
      cancelText="Huỷ"
      okButtonProps={{ danger: true }}
      confirmLoading={isSubmitting}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="reason"
          label="Lý do"
          rules={[{ required: true, message: 'Chọn lý do báo cáo' }]}
        >
          <Radio.Group
            options={isReview ? REVIEW_REASON_OPTIONS : REASON_OPTIONS}
            className="flex! flex-col gap-2"
          />
        </Form.Item>
        <Form.Item name="note" label="Mô tả thêm" className="mb-0!">
          <Input.TextArea
            rows={3}
            maxLength={500}
            showCount
            placeholder="Thông tin giúp quản trị viên xác minh nhanh hơn"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
