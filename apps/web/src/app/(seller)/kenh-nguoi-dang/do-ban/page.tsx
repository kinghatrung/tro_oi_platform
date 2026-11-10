'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Flex,
  Popconfirm,
  Segmented,
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from 'antd';
import { CircleCheck, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import { PRODUCT_STATUS_LABELS, ProductStatus, type ProductItem } from '@tro-oi/shared';

import { deleteProduct, getMyProducts, updateProduct } from '@/api/products';
import { EmptyState, EmptyVariant } from '@/components/common';
import { NO_IMAGE } from '@/constants';
import { PRODUCT_STATUS_TAG_COLORS } from '@/lib/constants/constantsProduct';
import { useRequireUser } from '@/stores/useAuthStore';
import { formatRelativeTime, formatVietnameseCurrency } from '@/utils/helpers';

type StatusFilter = 'all' | ProductStatus;

/** Đồ của tôi trên Chợ ơi: đánh dấu đã bán, ẩn/hiện, sửa, xoá. */
export default function SellerProductsPage() {
  const { message } = App.useApp();
  const user = useRequireUser();
  const [products, setProducts] = useState<ProductItem[]>();
  const [filter, setFilter] = useState<StatusFilter>('all');

  const filterOptions = useMemo(() => {
    const count = (status: ProductStatus) =>
      products?.filter((item) => item.status === status).length ?? 0;
    return [
      { value: 'all', label: `Tất cả (${products?.length ?? 0})` },
      ...Object.values(ProductStatus).map((status) => ({
        value: status,
        label: `${PRODUCT_STATUS_LABELS[status]} (${count(status)})`,
      })),
    ];
  }, [products]);
  const visibleProducts = useMemo(
    () => products?.filter((item) => filter === 'all' || item.status === filter),
    [filter, products],
  );

  const changeStatus = useCallback(
    async (product: ProductItem, status: ProductStatus) => {
      try {
        const updated = await updateProduct(product.id, { status });
        setProducts((current) => current?.map((item) => (item.id === updated.id ? updated : item)));
        message.success(`Đã chuyển sang "${PRODUCT_STATUS_LABELS[status]}"`);
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [message],
  );

  const handleDelete = useCallback(
    async (product: ProductItem) => {
      try {
        await deleteProduct(product.id);
        setProducts((current) => current?.filter((item) => item.id !== product.id));
        message.success('Đã xoá');
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [message],
  );

  const columns = useMemo<TableColumnsType<ProductItem>>(
    () => [
      {
        title: 'Món đồ',
        key: 'product',
        render: (_, product) => (
          <Flex gap={12} align="center" className="min-w-64">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-soft">
              <Image
                src={product.images[0] || NO_IMAGE}
                alt={product.title}
                fill
                sizes="64px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0">
              {product.status === ProductStatus.ACTIVE ? (
                <Link href={`/cho-oi/${product.id}`} className="line-clamp-2 font-semibold">
                  {product.title}
                </Link>
              ) : (
                <p className="line-clamp-2 font-semibold text-ink">{product.title}</p>
              )}
              <p className="text-sm font-semibold text-price">
                {product.price === 0 ? 'Cho tặng' : formatVietnameseCurrency(product.price)}
              </p>
            </div>
          </Flex>
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
        title: 'Lượt xem',
        dataIndex: 'viewCount',
        width: 100,
        align: 'right',
        sorter: (a, b) => (a.viewCount ?? 0) - (b.viewCount ?? 0),
      },
      {
        title: 'Ngày đăng',
        dataIndex: 'createdAt',
        width: 130,
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
        render: (value: string) => formatRelativeTime(value),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 170,
        fixed: 'right',
        render: (_, product) => (
          <Flex gap={4}>
            <Tooltip title="Sửa">
              <Link href={`/cho-oi/dang-ban?id=${product.id}`}>
                <Button size="small" aria-label="Sửa" icon={<Pencil size={14} />} />
              </Link>
            </Tooltip>
            {product.status === ProductStatus.ACTIVE && (
              <>
                <Tooltip title="Đánh dấu đã bán">
                  <Button
                    size="small"
                    aria-label="Đánh dấu đã bán"
                    icon={<CircleCheck size={14} />}
                    onClick={() => changeStatus(product, ProductStatus.SOLD)}
                  />
                </Tooltip>
                <Tooltip title="Ẩn">
                  <Button
                    size="small"
                    aria-label="Ẩn"
                    icon={<EyeOff size={14} />}
                    onClick={() => changeStatus(product, ProductStatus.CLOSED)}
                  />
                </Tooltip>
              </>
            )}
            {(product.status === ProductStatus.SOLD || product.status === ProductStatus.CLOSED) && (
              <Tooltip title="Đăng bán lại">
                <Button
                  size="small"
                  aria-label="Đăng bán lại"
                  icon={<Eye size={14} />}
                  onClick={() => changeStatus(product, ProductStatus.ACTIVE)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Xoá món đồ này?"
              okText="Xoá"
              cancelText="Huỷ"
              okButtonProps={{ danger: true }}
              onConfirm={() => handleDelete(product)}
            >
              <Button size="small" danger aria-label="Xoá" icon={<Trash2 size={14} />} />
            </Popconfirm>
          </Flex>
        ),
      },
    ],
    [changeStatus, handleDelete],
  );

  useEffect(() => {
    if (!user) return;
    getMyProducts()
      .then(setProducts)
      .catch((error: Error) => message.error(error.message));
  }, [message, user]);

  return (
    <Card variant="borderless">
      <Flex justify="space-between" align="center" wrap gap={12} className="mb-4!">
        <h1 className="text-primary text-xl!">Đồ đang bán (Chợ ơi)</h1>
        <Link href="/cho-oi/dang-ban">
          <Button type="primary" icon={<Plus size={16} />}>
            Đăng bán đồ
          </Button>
        </Link>
      </Flex>
      <Segmented
        options={filterOptions}
        value={filter}
        onChange={(value) => setFilter(value as StatusFilter)}
        className="mb-4!"
      />
      <Table<ProductItem>
        rowKey="id"
        columns={columns}
        dataSource={visibleProducts}
        loading={!products}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 800 }}
        locale={{
          emptyText: (
            <EmptyState
              size="small"
              variant={EmptyVariant.LISTING}
              description="Chưa có món đồ nào"
            />
          ),
        }}
      />
    </Card>
  );
}
