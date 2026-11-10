'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  Flex,
  Input,
  Popconfirm,
  Segmented,
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from 'antd';
import { CircleCheck, Eye, EyeOff, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CONDITION_LABELS,
  PRODUCT_STATUS_LABELS,
  ProductStatus,
  type ProductItem,
} from '@tro-oi/shared';

import { deleteProduct, getMyProducts, updateProduct } from '@/api/products';
import { withMobileSummary } from '@/components/admin';
import { EmptyState, EmptyVariant } from '@/components/common';
import { NO_IMAGE } from '@/constants';
import { PRODUCT_STATUS_TAG_COLORS } from '@/lib/constants/constantsProduct';
import { useRequireUser } from '@/stores/useAuthStore';
import { formatNumber, formatRelativeTime, formatVietnameseCurrency } from '@/utils/helpers';

type StatusFilter = 'all' | ProductStatus;

const PAGE_SIZE = 10;

/** Đồ của tôi trên Chợ ơi: lọc trạng thái, tìm theo tên, đánh dấu đã bán, ẩn/hiện, sửa, xoá. */
export default function SellerProductsPage() {
  const { message } = App.useApp();
  const user = useRequireUser();
  const [products, setProducts] = useState<ProductItem[]>();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [keyword, setKeyword] = useState('');

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
  const visibleProducts = useMemo(() => {
    const search = keyword.trim().toLowerCase();
    return products?.filter(
      (item) =>
        (filter === 'all' || item.status === filter) && item.title.toLowerCase().includes(search),
    );
  }, [filter, keyword, products]);

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
        // Rộng cố định như trang Tin đăng: không có width thì cột co lại, đè lên cột Trạng thái
        width: 300,
        render: (_, product) => (
          <Flex gap={12} align="center">
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
              <p className="line-clamp-1 text-xs text-subtle">
                {[
                  PRODUCT_CATEGORY_LABELS[product.category],
                  PRODUCT_CONDITION_LABELS[product.condition],
                  product.address?.city,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              {product.moderationNote && product.status !== 'active' && (
                <p className="mt-1 line-clamp-2 text-xs text-body">
                  <b className="text-ink">Lý do bị ẩn:</b> {product.moderationNote}
                </p>
              )}
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
        key: 'views',
        width: 130,
        sorter: (a, b) => (a.viewCount ?? 0) - (b.viewCount ?? 0),
        render: (_, product) => (
          <span className="flex items-center gap-1.5 text-sm text-body">
            <Eye size={15} /> {formatNumber(product.viewCount ?? 0)} lượt xem
          </span>
        ),
      },
      {
        title: 'Thời gian',
        key: 'dates',
        width: 150,
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.createdAt.localeCompare(b.createdAt),
        render: (_, product) => (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-body">Đăng {formatRelativeTime(product.createdAt)}</span>
            <span className="text-subtle">Sửa {formatRelativeTime(product.updatedAt)}</span>
          </div>
        ),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 140,
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
      <Flex justify="space-between" align="center" wrap gap={12} className="mb-4!">
        {/* Màn hẹp: cuộn ngang thay vì bị cắt mất lựa chọn cuối */}
        <div className="no-scrollbar max-w-full overflow-x-auto">
          <Segmented
            options={filterOptions}
            value={filter}
            onChange={(value) => setFilter(value as StatusFilter)}
          />
        </div>
        <Input.Search
          allowClear
          placeholder="Tìm theo tên món đồ"
          className="max-w-72"
          onChange={(event) => setKeyword(event.target.value)}
        />
      </Flex>
      <Table<ProductItem>
        rowKey="id"
        // Điện thoại: 1 cột (trạng thái, số liệu, nút thao tác nằm dưới tên)
        columns={withMobileSummary(columns, ['status', 'views', 'actions'])}
        dataSource={visibleProducts}
        loading={!products}
        pagination={{ pageSize: PAGE_SIZE, hideOnSinglePage: true }}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <EmptyState size="small" variant={EmptyVariant.LISTING} description="Không có món đồ" />
          ),
        }}
      />
    </Card>
  );
}
