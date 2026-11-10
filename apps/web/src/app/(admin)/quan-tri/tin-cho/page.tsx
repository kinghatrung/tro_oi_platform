'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Form, Segmented, Select, Tag, type TableColumnsType } from 'antd';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_STATUS_LABELS,
  ProductStatus,
  type AdminProductQuery,
  type ProductItem,
} from '@tro-oi/shared';

import { searchAdminProducts } from '@/api/admin';
import { deleteProduct, updateProduct } from '@/api/products';
import { DataTable, EntityCell, FilterBar, ModerationActions, PageCard } from '@/components/admin';
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

type AdvancedFilters = Pick<AdminProductQuery, 'category'>;
const DEFAULT_FILTERS: AdvancedFilters = { category: undefined };

/** Quản lý toàn bộ tin Chợ ơi: duyệt, ẩn/hiện, xoá. */
export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const initialQuery = useMemo<AdminProductQuery>(
    () => ({
      status: (searchParams.get('status') as ProductStatus) || undefined,
      sellerId: searchParams.get('sellerId') || undefined,
    }),
    [searchParams],
  );
  const { items, isLoading, query, updateQuery, reload, runAction, pagination } = useAdminTable(
    searchAdminProducts,
    initialQuery,
    'món đồ',
  );

  const columns = useMemo<TableColumnsType<ProductItem>>(
    () => [
      {
        title: 'Món đồ',
        key: 'product',
        render: (_, product) => (
          <EntityCell
            image={product.images[0]}
            title={product.title}
            subtitle={`${PRODUCT_CATEGORY_LABELS[product.category]} · ${product.address?.city ?? ''}`}
          />
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
        width: 120,
        fixed: 'right',
        render: (_, product) => (
          <ModerationActions
            status={product.status}
            viewHref={`/cho-oi/${product.id}`}
            onSetVisible={(visible, text) =>
              runAction(
                () =>
                  updateProduct(product.id, {
                    status: visible ? ProductStatus.ACTIVE : ProductStatus.CLOSED,
                  }),
                text,
              )
            }
            onDelete={() => runAction(() => deleteProduct(product.id), 'Đã xoá')}
          />
        ),
      },
    ],
    [runAction],
  );

  return (
    <PageCard>
      <FilterBar<AdvancedFilters>
        keyword={{ placeholder: 'Tìm tên món đồ' }}
        onSearch={(keyword) => updateQuery({ keyword })}
        onReload={reload}
        quickFilters={
          <>
            <Segmented
              options={STATUS_FILTERS}
              value={query.status ?? ''}
              onChange={(value) => updateQuery({ status: (value as ProductStatus) || undefined })}
            />
            {query.sellerId && (
              <Tag closable onClose={() => updateQuery({ sellerId: undefined })}>
                Đang lọc theo 1 người bán
              </Tag>
            )}
          </>
        }
        advanced={{
          values: { category: query.category },
          defaultValues: DEFAULT_FILTERS,
          onApply: updateQuery,
          fields: (
            <Form.Item name="category" label="Danh mục">
              <Select allowClear placeholder="Tất cả" options={CATEGORY_OPTIONS} />
            </Form.Item>
          ),
        }}
      />
      <DataTable<ProductItem>
        mobileKeys={['price', 'status', 'actions']}
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        pagination={pagination}
      />
    </PageCard>
  );
}
