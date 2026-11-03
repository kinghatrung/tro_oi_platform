'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  App,
  Button,
  Card,
  Flex,
  Input,
  Popconfirm,
  Segmented,
  Select,
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from 'antd';
import { Check, Eye, EyeOff, Trash2, X } from 'lucide-react';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
  ProductStatus,
  type AdminProductQuery,
  type ProductItem,
} from '@tro-oi/shared';

import { searchAdminProducts } from '@/api/admin';
import { deleteProduct, updateProduct } from '@/api/products';
import { NO_IMAGE } from '@/constants';
import {
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_STATUS_TAG_COLORS,
} from '@/lib/constants/constantsProduct';
import { formatRelativeTime, formatVietnameseCurrency } from '@/utils/helpers';

import { useAdminTable } from '../useAdminTable';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  ...Object.values(ProductStatus).map((status) => ({
    value: status,
    label: PRODUCT_STATUS_LABELS[status],
  })),
];
const CATEGORY_OPTIONS = PRODUCT_CATEGORY_OPTIONS.map(({ value, label }) => ({ value, label }));

/** Quản lý toàn bộ tin Chợ ơi: duyệt, ẩn/hiện, xoá. */
export default function AdminProductsPage() {
  const { message } = App.useApp();
  const searchParams = useSearchParams();
  const initialQuery = useMemo<AdminProductQuery>(
    () => ({
      status: (searchParams.get('status') as ProductStatus) || undefined,
      sellerId: searchParams.get('sellerId') || undefined,
    }),
    [searchParams],
  );
  const { items, isLoading, query, updateQuery, reload, pagination } = useAdminTable(
    searchAdminProducts,
    initialQuery,
  );

  const runAction = useCallback(
    async (action: () => Promise<unknown>, successText: string) => {
      try {
        await action();
        message.success(successText);
        await reload();
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [message, reload],
  );

  const setStatus = useCallback(
    (product: ProductItem, status: ProductStatus, successText: string) =>
      runAction(() => updateProduct(product.id, { status }), successText),
    [runAction],
  );

  const columns = useMemo<TableColumnsType<ProductItem>>(
    () => [
      {
        title: 'Món đồ',
        key: 'product',
        render: (_, product) => (
          <Flex gap={12} align="center" className="min-w-64">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-soft">
              <Image
                src={product.images[0] || NO_IMAGE}
                alt=""
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 font-semibold text-ink">{product.title}</p>
              <p className="text-xs text-subtle">
                {PRODUCT_CATEGORY_LABELS[product.category]} · {product.address?.city}
              </p>
            </div>
          </Flex>
        ),
      },
      {
        title: 'Người bán',
        key: 'seller',
        width: 150,
        render: (_, product) =>
          product.seller && (
            <Link href={`/nguoi-dung/${product.seller.id}`} target="_blank">
              {product.seller.name}
            </Link>
          ),
      },
      {
        title: 'Giá',
        dataIndex: 'price',
        width: 120,
        render: (price: number) => (
          <span className="font-semibold text-price">
            {price === 0 ? 'Cho tặng' : formatVietnameseCurrency(price)}
          </span>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        width: 120,
        render: (status: ProductStatus) => (
          <Tag color={PRODUCT_STATUS_TAG_COLORS[status]}>{PRODUCT_STATUS_LABELS[status]}</Tag>
        ),
      },
      {
        title: 'Ngày đăng',
        dataIndex: 'createdAt',
        width: 120,
        render: (value: string) => formatRelativeTime(value),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 150,
        fixed: 'right',
        render: (_, product) => (
          <Flex gap={4}>
            {product.status === ProductStatus.PENDING && (
              <>
                <Tooltip title="Duyệt">
                  <Button
                    size="small"
                    type="primary"
                    aria-label="Duyệt"
                    icon={<Check size={14} />}
                    onClick={() => setStatus(product, ProductStatus.ACTIVE, 'Đã duyệt')}
                  />
                </Tooltip>
                <Tooltip title="Từ chối (ẩn)">
                  <Button
                    size="small"
                    aria-label="Từ chối"
                    icon={<X size={14} />}
                    onClick={() => setStatus(product, ProductStatus.CLOSED, 'Đã từ chối')}
                  />
                </Tooltip>
              </>
            )}
            {product.status === ProductStatus.ACTIVE && (
              <>
                <Tooltip title="Xem trên web">
                  <Link href={`/cho-oi/${product.id}`} target="_blank">
                    <Button size="small" aria-label="Xem" icon={<Eye size={14} />} />
                  </Link>
                </Tooltip>
                <Tooltip title="Ẩn">
                  <Button
                    size="small"
                    aria-label="Ẩn"
                    icon={<EyeOff size={14} />}
                    onClick={() => setStatus(product, ProductStatus.CLOSED, 'Đã ẩn')}
                  />
                </Tooltip>
              </>
            )}
            {product.status === ProductStatus.CLOSED && (
              <Tooltip title="Hiển thị lại">
                <Button
                  size="small"
                  aria-label="Hiển thị lại"
                  icon={<Eye size={14} />}
                  onClick={() => setStatus(product, ProductStatus.ACTIVE, 'Đã hiển thị lại')}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Xoá vĩnh viễn món đồ này?"
              okText="Xoá"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              onConfirm={() => runAction(() => deleteProduct(product.id), 'Đã xoá')}
            >
              <Button size="small" danger aria-label="Xoá" icon={<Trash2 size={14} />} />
            </Popconfirm>
          </Flex>
        ),
      },
    ],
    [runAction, setStatus],
  );

  return (
    <Card variant="borderless">
      <h1 className="text-primary mb-4 text-xl!">Tin Chợ ơi</h1>
      <Flex wrap gap={8} align="center" className="mb-4!">
        <Segmented
          options={STATUS_FILTERS}
          value={query.status ?? ''}
          onChange={(value) => updateQuery({ status: (value as ProductStatus) || undefined })}
        />
        <Input.Search
          allowClear
          placeholder="Tìm tên món đồ"
          className="max-w-72"
          onSearch={(value) => updateQuery({ keyword: value.trim() || undefined })}
        />
        <Select
          allowClear
          placeholder="Danh mục"
          className="min-w-40"
          options={CATEGORY_OPTIONS}
          value={query.category}
          onChange={(value) => updateQuery({ category: value })}
        />
        {query.sellerId && (
          <Tag closable onClose={() => updateQuery({ sellerId: undefined })}>
            Đang lọc theo 1 người bán
          </Tag>
        )}
      </Flex>
      <Table<ProductItem>
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
