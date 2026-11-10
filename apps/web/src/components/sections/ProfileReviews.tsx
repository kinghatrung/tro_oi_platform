'use client';

import { useEffect, useState } from 'react';
import { App, Avatar, Button, Card, Form, Input, Popconfirm, Rate } from 'antd';
import { Flag, Trash2 } from 'lucide-react';
import {
  ReportTargetType,
  UserRole,
  type MyReviewStatus,
  type Review,
  type ReviewPage,
} from '@tro-oi/shared';

import { deleteReview, getMyReview, getReviews, upsertReview } from '@/api/reviews';
import { useAuthStore } from '@/stores/useAuthStore';
import { RelativeTime, ReportModal } from '@/components/common';

interface ReviewForm {
  rating: number;
  comment?: string;
}

interface ProfileReviewsProps {
  userId: string;
  /** Trang đầu, server đã tải. */
  initial: ReviewPage;
}

/**
 * Đánh giá trên hồ sơ công khai: điểm trung bình, danh sách, form viết/sửa
 * (chỉ người đã nhắn tin với chủ hồ sơ). Người viết / admin xoá được.
 */
export function ProfileReviews({ userId, initial }: ProfileReviewsProps) {
  const { message } = App.useApp();
  const viewer = useAuthStore((state) => state.user);
  const [form] = Form.useForm<ReviewForm>();
  const [data, setData] = useState(initial);
  const [mine, setMine] = useState<MyReviewStatus | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [reportingId, setReportingId] = useState<string>();
  const isSelf = viewer?.id === userId;

  useEffect(() => {
    if (!viewer || isSelf) return;
    getMyReview(userId)
      .then((status) => {
        setMine(status);
        if (status.review) {
          form.setFieldsValue({ rating: status.review.rating, comment: status.review.comment });
        }
      })
      .catch((error: Error) => message.error(error.message));
  }, [form, isSelf, message, userId, viewer]);

  // Điểm trung bình đổi theo → tải lại trang đầu
  const reload = async () => setData(await getReviews(userId));

  const handleSubmit = async (values: ReviewForm) => {
    setIsSaving(true);
    try {
      const review = await upsertReview({ userId, ...values });
      message.success(mine?.review ? 'Đã cập nhật đánh giá' : 'Cảm ơn bạn đã đánh giá');
      setMine({ canReview: true, review });
      await reload();
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (review: Review) => {
    try {
      await deleteReview(review.id);
      if (review.id === mine?.review?.id) {
        setMine({ ...mine, review: null });
        form.resetFields();
      }
      message.success('Đã xoá đánh giá');
      await reload();
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const loadMore = async () => {
    try {
      const next = await getReviews(userId, data.page + 1);
      setData((current) => ({ ...next, items: [...current.items, ...next.items] }));
    } catch (error) {
      message.error((error as Error).message);
    }
  };

  const canDelete = (review: Review) =>
    viewer && (review.reviewer?.id === viewer.id || viewer.role === UserRole.ADMIN);
  // Đã đăng nhập, không phải đánh giá của mình (admin xoá thẳng, không cần báo cáo)
  const canReport = (review: Review) =>
    viewer && review.reviewer?.id !== viewer.id && viewer.role !== UserRole.ADMIN;

  return (
    <Card variant="borderless" id="danh-gia">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="text-primary">Đánh giá</h2>
        {data.average === null ? (
          <span className="text-subtle">Chưa có đánh giá</span>
        ) : (
          <>
            <Rate disabled allowHalf value={data.average} />
            <span className="font-bold text-ink">{data.average}/5</span>
            <span className="text-subtle">({data.count} đánh giá)</span>
          </>
        )}
      </div>

      {mine?.canReview && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mb-6 rounded-lg bg-soft p-4"
        >
          <p className="mb-2 font-semibold text-ink">
            {mine.review ? 'Đánh giá của bạn' : 'Viết đánh giá'}
          </p>
          <Form.Item
            name="rating"
            rules={[{ required: true, message: 'Chọn số sao' }]}
            className="mb-2!"
          >
            <Rate />
          </Form.Item>
          <Form.Item name="comment" className="mb-3!">
            <Input.TextArea
              maxLength={1000}
              showCount
              autoSize={{ minRows: 2, maxRows: 6 }}
              placeholder="Chia sẻ trải nghiệm khi liên hệ, xem phòng, mua đồ..."
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isSaving}>
            {mine.review ? 'Cập nhật đánh giá' : 'Gửi đánh giá'}
          </Button>
        </Form>
      )}
      {mine && !mine.canReview && (
        <p className="mb-4 text-sm text-subtle">
          Bạn cần nhắn tin trao đổi với người này trước khi đánh giá.
        </p>
      )}

      {data.items.length > 0 && (
        <ul className="divide-y divide-line">
          {data.items.map((review) => (
            <li key={review.id} className="flex gap-3 py-4">
              <Avatar src={review.reviewer?.avatar}>{review.reviewer?.name.charAt(0)}</Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3">
                  <span className="font-semibold text-ink">
                    {review.reviewer?.name ?? 'Người dùng'}
                  </span>
                  <Rate disabled value={review.rating} className="text-sm!" />
                  <span className="text-xs text-subtle">
                    <RelativeTime date={review.updatedAt} />
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-1 whitespace-pre-line text-default">{review.comment}</p>
                )}
              </div>
              {canReport(review) && (
                <Button
                  type="text"
                  aria-label="Báo cáo đánh giá"
                  title="Báo cáo đánh giá vi phạm"
                  icon={<Flag size={16} />}
                  onClick={() => setReportingId(review.id)}
                />
              )}
              {canDelete(review) && (
                <Popconfirm
                  title="Xoá đánh giá này?"
                  okText="Xoá"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => handleDelete(review)}
                >
                  <Button type="text" aria-label="Xoá đánh giá" icon={<Trash2 size={16} />} />
                </Popconfirm>
              )}
            </li>
          ))}
        </ul>
      )}
      {data.items.length < data.total && (
        <Button block className="mt-2" onClick={loadMore}>
          Xem thêm đánh giá
        </Button>
      )}
      {reportingId && (
        <ReportModal
          open
          onClose={() => setReportingId(undefined)}
          targetType={ReportTargetType.REVIEW}
          targetId={reportingId}
        />
      )}
    </Card>
  );
}
