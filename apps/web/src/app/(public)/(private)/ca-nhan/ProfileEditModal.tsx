'use client';

import { useCallback, useState } from 'react';
import { App, Avatar, Form, Input, Modal, Upload } from 'antd';
import { Camera, UserRound } from 'lucide-react';
import type { UpdateProfileRequest, User } from '@tro-oi/shared';

import { antdUploadRequest } from '@/api/uploads';
import { updateMe } from '@/api/users';

interface ProfileEditModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onSaved: (user: User) => void;
}

/** Sửa tên, email, giới thiệu, ảnh đại diện. */
export function ProfileEditModal({ user, open, onClose, onSaved }: ProfileEditModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<UpdateProfileRequest>();
  const [avatar, setAvatar] = useState(user.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = useCallback(
    async (values: UpdateProfileRequest) => {
      setIsSaving(true);
      try {
        const updated = await updateMe({ ...values, email: values.email || undefined, avatar });
        message.success('Đã cập nhật hồ sơ');
        onSaved(updated);
        onClose();
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setIsSaving(false);
      }
    },
    [avatar, message, onClose, onSaved],
  );

  return (
    <Modal
      title="Chỉnh sửa hồ sơ"
      open={open}
      onCancel={onClose}
      onOk={form.submit}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={isSaving}
      okButtonProps={{ disabled: isUploading }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ name: user.name, email: user.email, bio: user.bio }}
        onFinish={handleSubmit}
      >
        <Form.Item label="Ảnh đại diện">
          <Upload
            accept="image/jpeg,image/png,image/webp"
            showUploadList={false}
            customRequest={antdUploadRequest}
            onChange={({ file }) => {
              setIsUploading(file.status === 'uploading');
              if (file.status === 'done') setAvatar(file.response as string);
              if (file.status === 'error') message.error(file.error?.message ?? 'Tải ảnh thất bại');
            }}
          >
            <div className="relative cursor-pointer w-fit">
              <Avatar size={96} src={avatar} icon={<UserRound size={48} />} />
              <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-white shadow">
                <Camera size={16} />
              </span>
            </div>
          </Upload>
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên hiển thị"
          rules={[{ required: true, min: 2, max: 50, message: 'Tên phải từ 2 đến 50 ký tự' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="bio" label="Giới thiệu">
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>
      </Form>
    </Modal>
  );
}
