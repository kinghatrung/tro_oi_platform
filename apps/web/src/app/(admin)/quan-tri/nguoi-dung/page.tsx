'use client';

import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  App,
  Avatar,
  Button,
  Card,
  Flex,
  Input,
  Popconfirm,
  Select,
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from 'antd';
import { Ban, ExternalLink, House, LockOpen, ShoppingBag, UserRound } from 'lucide-react';
import { USER_ROLE_LABELS, UserRole, type AdminUser, type AdminUserQuery } from '@tro-oi/shared';

import { searchAdminUsers, updateAdminUser } from '@/api/admin';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatRelativeTime } from '@/utils/helpers';

import { ADMIN_BASE } from '../const';
import { useAdminTable } from '../useAdminTable';

const ROLE_OPTIONS = (Object.entries(USER_ROLE_LABELS) as [UserRole, string][]).map(
  ([value, label]) => ({ value, label }),
);
const BLOCK_OPTIONS = [
  { value: 'false', label: 'Đang hoạt động' },
  { value: 'true', label: 'Đã khoá' },
];

/** Quản lý người dùng: tìm, đổi vai trò, khoá/mở khoá, xem tin đã đăng. */
export default function AdminUsersPage() {
  const { message } = App.useApp();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const blockedParam = useSearchParams().get('isBlocked');
  const initialQuery = useMemo<AdminUserQuery>(
    () => (blockedParam ? { isBlocked: blockedParam === 'true' } : {}),
    [blockedParam],
  );
  const { items, isLoading, query, updateQuery, reload, pagination } = useAdminTable(
    searchAdminUsers,
    initialQuery,
  );

  const handleUpdate = useCallback(
    async (user: AdminUser, changes: { role?: UserRole; isBlocked?: boolean }) => {
      try {
        await updateAdminUser(user.id, changes);
        message.success(`Đã cập nhật ${user.name}`);
        await reload();
      } catch (error) {
        message.error((error as Error).message);
      }
    },
    [message, reload],
  );

  const columns = useMemo<TableColumnsType<AdminUser>>(
    () => [
      {
        title: 'Người dùng',
        key: 'user',
        render: (_, user) => (
          <Flex gap={12} align="center" className="min-w-56">
            <Avatar src={user.avatar} icon={<UserRound size={18} />} />
            <div className="min-w-0">
              <p className="font-semibold text-ink">{user.name}</p>
              <p className="text-xs text-subtle">
                {user.phone?.replace(/^\+84/, '0')}
                {user.email && ` · ${user.email}`}
              </p>
            </div>
          </Flex>
        ),
      },
      {
        title: 'Vai trò',
        dataIndex: 'role',
        width: 170,
        render: (role: UserRole, user) => (
          <Select
            size="small"
            className="w-36"
            value={role}
            options={ROLE_OPTIONS}
            disabled={user.id === currentUserId}
            onChange={(value) => handleUpdate(user, { role: value })}
          />
        ),
      },
      {
        title: 'Tin đã đăng',
        key: 'counts',
        width: 150,
        render: (_, user) => (
          <Flex gap={12} className="text-sm">
            <Link
              href={`${ADMIN_BASE}/tin-tro?authorId=${user.id}`}
              className="flex items-center gap-1"
            >
              <House size={14} /> {user.listingCount}
            </Link>
            <Link
              href={`${ADMIN_BASE}/tin-cho?sellerId=${user.id}`}
              className="flex items-center gap-1"
            >
              <ShoppingBag size={14} /> {user.productCount}
            </Link>
          </Flex>
        ),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'isBlocked',
        width: 130,
        render: (isBlocked: boolean) =>
          isBlocked ? <Tag color="error">Đã khoá</Tag> : <Tag color="success">Hoạt động</Tag>,
      },
      {
        title: 'Tham gia',
        dataIndex: 'createdAt',
        width: 130,
        render: (value: string) => formatRelativeTime(value),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 110,
        fixed: 'right',
        render: (_, user) => (
          <Flex gap={4}>
            <Tooltip title="Xem hồ sơ công khai">
              <Link href={`/nguoi-dung/${user.id}`} target="_blank">
                <Button size="small" aria-label="Xem hồ sơ" icon={<ExternalLink size={14} />} />
              </Link>
            </Tooltip>
            {user.id !== currentUserId && (
              <Popconfirm
                title={user.isBlocked ? 'Mở khoá tài khoản này?' : 'Khoá tài khoản này?'}
                description={
                  user.isBlocked ? undefined : 'Người dùng sẽ bị đăng xuất và không đăng nhập được.'
                }
                okText={user.isBlocked ? 'Mở khoá' : 'Khoá'}
                cancelText="Huỷ"
                okButtonProps={{ danger: !user.isBlocked }}
                onConfirm={() => handleUpdate(user, { isBlocked: !user.isBlocked })}
              >
                <Tooltip title={user.isBlocked ? 'Mở khoá' : 'Khoá tài khoản'}>
                  <Button
                    size="small"
                    danger={!user.isBlocked}
                    aria-label={user.isBlocked ? 'Mở khoá' : 'Khoá tài khoản'}
                    icon={user.isBlocked ? <LockOpen size={14} /> : <Ban size={14} />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Flex>
        ),
      },
    ],
    [currentUserId, handleUpdate],
  );

  return (
    <Card variant="borderless">
      <h1 className="text-primary mb-4 text-xl!">Người dùng</h1>
      <Flex wrap gap={8} className="mb-4!">
        <Input.Search
          allowClear
          placeholder="Tìm tên, số điện thoại, email"
          className="max-w-80"
          onSearch={(value) => updateQuery({ keyword: value.trim() || undefined })}
        />
        <Select
          allowClear
          placeholder="Vai trò"
          className="min-w-40"
          options={ROLE_OPTIONS}
          value={query.role}
          onChange={(value) => updateQuery({ role: value })}
        />
        <Select
          allowClear
          placeholder="Trạng thái"
          className="min-w-40"
          options={BLOCK_OPTIONS}
          value={query.isBlocked === undefined ? undefined : String(query.isBlocked)}
          onChange={(value) =>
            updateQuery({ isBlocked: value === undefined ? undefined : value === 'true' })
          }
        />
      </Flex>
      <Table<AdminUser>
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        pagination={pagination}
        scroll={{ x: 900 }}
      />
    </Card>
  );
}
