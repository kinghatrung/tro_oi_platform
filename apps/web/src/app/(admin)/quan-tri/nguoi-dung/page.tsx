'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flex, Form, Select, Tag, type TableColumnsType } from 'antd';
import { Ban, ExternalLink, House, LockOpen, Pencil, ShoppingBag } from 'lucide-react';
import { USER_ROLE_LABELS, type AdminUser, type AdminUserQuery } from '@tro-oi/shared';

import { searchAdminUsers, updateAdminUser } from '@/api/admin';
import {
  DataTable,
  EntityCell,
  FilterBar,
  IconAction,
  PageCard,
  RowActions,
} from '@/components/admin';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatRelativeTime } from '@/utils/helpers';

import { ADMIN_BASE } from '../const';
import { useAdminTable } from '../useAdminTable';
import { BLOCK_OPTIONS, ROLE_OPTIONS } from './const';
import { UserFormDrawer, type UserFormValues } from './UserFormDrawer';

/** isBlocked dạng chuỗi vì Select không nhận giá trị boolean. */
type AdvancedFilters = Pick<AdminUserQuery, 'role'> & { isBlocked?: 'true' | 'false' };
const DEFAULT_FILTERS: AdvancedFilters = { role: undefined, isBlocked: undefined };

/** Quản lý người dùng: tìm, lọc, sửa vai trò, khoá/mở khoá, xem tin đã đăng. */
export default function AdminUsersPage() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const blockedParam = useSearchParams().get('isBlocked');
  const initialQuery = useMemo<AdminUserQuery>(
    () => (blockedParam ? { isBlocked: blockedParam === 'true' } : {}),
    [blockedParam],
  );
  const { items, isLoading, query, updateQuery, reload, runAction, pagination } = useAdminTable(
    searchAdminUsers,
    initialQuery,
    'người dùng',
  );
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const handleSubmit = useCallback(
    (user: AdminUser, values: UserFormValues) =>
      runAction(() => updateAdminUser(user.id, values), `Đã cập nhật ${user.name}`),
    [runAction],
  );

  const columns = useMemo<TableColumnsType<AdminUser>>(
    () => [
      {
        title: 'Người dùng',
        key: 'user',
        render: (_, user) => (
          <EntityCell
            avatar={user.avatar ?? null}
            title={user.name}
            subtitle={[user.phone?.replace(/^\+84/, '0'), user.email].filter(Boolean).join(' · ')}
          />
        ),
      },
      {
        title: 'Vai trò',
        dataIndex: 'role',
        width: 130,
        render: (role: AdminUser['role']) => <Tag>{USER_ROLE_LABELS[role]}</Tag>,
      },
      {
        title: 'Tin đã đăng',
        key: 'counts',
        width: 130,
        render: (_, user) => (
          <Flex gap={12} className="text-sm" onClick={(event) => event.stopPropagation()}>
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
        width: 120,
        render: (isBlocked: boolean) =>
          isBlocked ? <Tag color="error">Đã khoá</Tag> : <Tag color="success">Hoạt động</Tag>,
      },
      {
        title: 'Tham gia',
        dataIndex: 'createdAt',
        width: 120,
        render: (value: string) => formatRelativeTime(value),
      },
      {
        title: 'Thao tác',
        key: 'actions',
        width: 120,
        fixed: 'right',
        render: (_, user) => (
          <RowActions>
            <IconAction title="Sửa" icon={<Pencil size={14} />} onClick={() => setEditing(user)} />
            <IconAction
              title="Xem hồ sơ công khai"
              icon={<ExternalLink size={14} />}
              href={`/nguoi-dung/${user.id}`}
            />
            {user.id !== currentUserId && (
              <IconAction
                title={user.isBlocked ? 'Mở khoá' : 'Khoá tài khoản'}
                icon={user.isBlocked ? <LockOpen size={14} /> : <Ban size={14} />}
                danger={!user.isBlocked}
                confirm={{
                  title: user.isBlocked ? 'Mở khoá tài khoản này?' : 'Khoá tài khoản này?',
                  description: user.isBlocked
                    ? undefined
                    : 'Người dùng sẽ bị đăng xuất và không đăng nhập được.',
                  okText: user.isBlocked ? 'Mở khoá' : 'Khoá',
                }}
                onClick={() =>
                  runAction(
                    () => updateAdminUser(user.id, { isBlocked: !user.isBlocked }),
                    user.isBlocked ? `Đã mở khoá ${user.name}` : `Đã khoá ${user.name}`,
                  )
                }
              />
            )}
          </RowActions>
        ),
      },
    ],
    [currentUserId, runAction],
  );

  return (
    <PageCard>
      <FilterBar<AdvancedFilters>
        keyword={{ placeholder: 'Tìm tên, số điện thoại, email' }}
        onSearch={(keyword) => updateQuery({ keyword })}
        onReload={reload}
        advanced={{
          values: {
            role: query.role,
            isBlocked:
              query.isBlocked === undefined ? undefined : query.isBlocked ? 'true' : 'false',
          },
          defaultValues: DEFAULT_FILTERS,
          onApply: ({ role, isBlocked }) =>
            updateQuery({
              role,
              isBlocked: isBlocked === undefined ? undefined : isBlocked === 'true',
            }),
          fields: (
            <>
              <Form.Item name="role" label="Vai trò">
                <Select allowClear placeholder="Tất cả" options={ROLE_OPTIONS} />
              </Form.Item>
              <Form.Item name="isBlocked" label="Trạng thái">
                <Select allowClear placeholder="Tất cả" options={BLOCK_OPTIONS} />
              </Form.Item>
            </>
          ),
        }}
      />
      <DataTable<AdminUser>
        mobileKeys={['role', 'isBlocked', 'actions']}
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        pagination={pagination}
        onRow={(user) => ({ onClick: () => setEditing(user), className: 'cursor-pointer' })}
      />
      <UserFormDrawer
        user={editing}
        isSelf={editing?.id === currentUserId}
        onClose={() => setEditing(null)}
        onSubmit={handleSubmit}
      />
    </PageCard>
  );
}
