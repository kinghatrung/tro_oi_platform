'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Avatar, Button, Descriptions, Flex, Form, Select } from 'antd';
import { Save, UserRound, X } from 'lucide-react';
import type { AdminUser, UserRole } from '@tro-oi/shared';

import { AppDrawer, FormSectionTitle, SwitchField } from '@/components/admin';
import { formatRelativeTime } from '@/utils/helpers';

import { ADMIN_BASE } from '../const';
import { ROLE_OPTIONS } from './const';

export interface UserFormValues {
  role: UserRole;
  isBlocked: boolean;
}

interface UserFormDrawerProps {
  /** null = đóng drawer. */
  user: AdminUser | null;
  /** Không cho tự đổi vai trò / tự khoá chính mình. */
  isSelf: boolean;
  onClose: () => void;
  /** Trả về true khi lưu thành công (drawer tự đóng). */
  onSubmit: (user: AdminUser, values: UserFormValues) => Promise<boolean>;
}

/** Drawer xem + sửa người dùng: thông tin tài khoản, vai trò, khoá tài khoản. */
export function UserFormDrawer({ user, isSelf, onClose, onSubmit }: UserFormDrawerProps) {
  const [form] = Form.useForm<UserFormValues>();
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async (values: UserFormValues) => {
    if (!user) return;
    setIsSaving(true);
    if (await onSubmit(user, values)) onClose();
    setIsSaving(false);
  };

  return (
    <AppDrawer
      open={!!user}
      onClose={onClose}
      title="Cập nhật người dùng"
      subtitle={user?.name}
      footer={
        <>
          <Button icon={<X size={16} />} onClick={onClose}>
            Huỷ
          </Button>
          <Button
            type="primary"
            icon={<Save size={16} />}
            loading={isSaving}
            disabled={isSelf}
            onClick={form.submit}
          >
            Lưu
          </Button>
        </>
      }
    >
      {user && (
        <>
          <Flex gap={12} align="center" className="mb-4!">
            <Avatar size={56} src={user.avatar} icon={<UserRound size={24} />} />
            <div className="min-w-0">
              <p className="text-base font-semibold text-ink">{user.name}</p>
              <Link href={`/nguoi-dung/${user.id}`} target="_blank" className="text-sm">
                Xem hồ sơ công khai
              </Link>
            </div>
          </Flex>
          <FormSectionTitle title="Thông tin tài khoản" />
          <Descriptions
            column={1}
            size="small"
            className="mb-6!"
            items={[
              { label: 'Số điện thoại', children: user.phone?.replace(/^\+84/, '0') || '—' },
              { label: 'Email', children: user.email || '—' },
              { label: 'Tham gia', children: formatRelativeTime(user.createdAt) },
              {
                label: 'Tin Trọ ơi',
                children: (
                  <Link href={`${ADMIN_BASE}/tin-tro?authorId=${user.id}`}>
                    {user.listingCount} tin
                  </Link>
                ),
              },
              {
                label: 'Tin Chợ ơi',
                children: (
                  <Link href={`${ADMIN_BASE}/tin-cho?sellerId=${user.id}`}>
                    {user.productCount} món
                  </Link>
                ),
              },
            ]}
          />
        </>
      )}
      <FormSectionTitle
        title="Phân quyền"
        description={
          isSelf ? 'Không thể tự đổi vai trò hoặc tự khoá tài khoản của mình.' : undefined
        }
      />
      <Form
        key={user?.id}
        form={form}
        layout="vertical"
        disabled={isSelf}
        initialValues={user ? { role: user.role, isBlocked: user.isBlocked } : undefined}
        onFinish={handleFinish}
      >
        <Form.Item name="role" label="Vai trò" rules={[{ required: true }]}>
          <Select options={ROLE_OPTIONS} />
        </Form.Item>
        <SwitchField
          name="isBlocked"
          label="Khoá tài khoản"
          description="Người dùng bị đăng xuất và không đăng nhập được nữa"
        />
      </Form>
    </AppDrawer>
  );
}
