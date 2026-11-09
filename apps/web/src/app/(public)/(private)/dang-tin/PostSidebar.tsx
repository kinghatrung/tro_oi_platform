'use client';

import Image from 'next/image';
import { Button, Card, Divider, Flex, Progress } from 'antd';
import { CircleCheck, Circle, Lightbulb, MapPin } from 'lucide-react';
import {
  PROPERTY_CATEGORY_LABELS,
  type PropertyCategory,
  type TransactionType,
} from '@tro-oi/shared';

import { NO_IMAGE } from '@/constants';
import { formatListingPrice } from '@/utils/helpers';

export interface PostPreview {
  title?: string;
  price?: number;
  area?: number;
  transaction?: TransactionType;
  category?: PropertyCategory;
  city?: string;
  ward?: string;
  coverUrl?: string;
  imageCount: number;
}

interface PostSidebarProps {
  preview: PostPreview;
  isEditing: boolean;
  isSubmitting: boolean;
  isUploading: boolean;
  onCancel: () => void;
}

const TIPS = [
  'Ảnh thật, đủ sáng, chụp ngang giúp tin được xem nhiều hơn.',
  'Ghi rõ giá đã gồm/chưa gồm điện, nước, internet.',
  'Mô tả giờ giấc, chỗ để xe, an ninh khu vực.',
];

/** Cột phải form đăng tin: xem trước, checklist hoàn thiện, nút đăng. */
export function PostSidebar({
  preview,
  isEditing,
  isSubmitting,
  isUploading,
  onCancel,
}: PostSidebarProps) {
  const checklist = [
    { label: 'Loại hình', isDone: Boolean(preview.category) },
    { label: 'Ít nhất 1 ảnh', isDone: preview.imageCount > 0 },
    { label: 'Tỉnh/thành, phường/xã', isDone: Boolean(preview.city && preview.ward) },
    { label: 'Giá', isDone: preview.price != null },
    { label: 'Tiêu đề từ 10 ký tự', isDone: (preview.title?.trim().length ?? 0) >= 10 },
  ];
  const percent = Math.round(
    (checklist.filter((item) => item.isDone).length / checklist.length) * 100,
  );
  const location = [preview.ward, preview.city].filter(Boolean).join(', ');

  return (
    <Flex vertical gap={16} className="lg:sticky lg:top-4">
      <Card variant="borderless" title="Xem trước tin">
        <div className="overflow-hidden rounded-lg border border-line">
          <div className="relative aspect-video">
            <Image
              src={preview.coverUrl || NO_IMAGE}
              alt="Ảnh bìa"
              fill
              sizes="360px"
              className="object-cover"
            />
            {preview.imageCount > 0 && (
              <span className="absolute right-2 bottom-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                {preview.imageCount} ảnh
              </span>
            )}
          </div>
          <div className="p-3">
            <p className="text-default line-clamp-2 font-semibold">
              {preview.title?.trim() || 'Tiêu đề tin đăng'}
            </p>
            <p className="mt-1 font-bold text-price">
              {preview.price != null && preview.transaction
                ? formatListingPrice(preview.price, preview.transaction)
                : 'Giá'}
              {preview.area ? ` · ${preview.area} m²` : ''}
            </p>
            <Flex align="center" gap={4} className="mt-1 text-sm text-subtle">
              <MapPin size={14} />
              <span className="line-clamp-1">{location || 'Khu vực'}</span>
            </Flex>
            {preview.category && (
              <p className="mt-1 text-xs text-body">{PROPERTY_CATEGORY_LABELS[preview.category]}</p>
            )}
          </div>
        </div>

        <Divider className="my-4!" />

        <Flex justify="space-between" className="mb-2">
          <span className="text-sm font-semibold text-ink">Mức hoàn thiện</span>
          <span className="text-sm text-body">{percent}%</span>
        </Flex>
        <Progress percent={percent} showInfo={false} size="small" />
        <Flex vertical gap={6} className="mt-3!">
          {checklist.map((item) => (
            <Flex key={item.label} align="center" gap={8} className="text-sm">
              {item.isDone ? (
                <CircleCheck size={16} className="text-[#22c55e]" />
              ) : (
                <Circle size={16} className="text-subtle" />
              )}
              <span className={item.isDone ? 'text-ink' : 'text-subtle'}>{item.label}</span>
            </Flex>
          ))}
        </Flex>

        <Flex vertical gap={8} className="mt-5!">
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isSubmitting}
            disabled={isUploading}
          >
            {isUploading ? 'Đang tải ảnh...' : isEditing ? 'Lưu thay đổi' : 'Đăng tin'}
          </Button>
          <Button block onClick={onCancel}>
            Huỷ
          </Button>
        </Flex>
      </Card>

      <Card variant="borderless" size="small">
        <Flex align="center" gap={8} className="mb-2 font-semibold text-ink">
          <Lightbulb size={16} className="text-[#f59e0b]" />
          Mẹo đăng tin hiệu quả
        </Flex>
        <ul className="list-disc space-y-1 pl-5 text-sm text-body">
          {TIPS.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </Card>
    </Flex>
  );
}
