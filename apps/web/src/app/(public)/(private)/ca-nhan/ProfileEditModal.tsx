'use client';

import Image from 'next/image';
import { useCallback, useState } from 'react';
import { App, Avatar, Button, Form, Input, Modal, Upload, type UploadProps } from 'antd';
import { Camera, Trash2, UserRound } from 'lucide-react';
import type { UpdateProfileRequest, User } from '@tro-oi/shared';

import { antdUploadRequest } from '@/api/uploads';
import { updateMe } from '@/api/users';

interface ProfileEditModalProps {
  user: User;
  open: boolean;
  onClose: () => void;
  onSaved: (user: User) => void;
}

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

/** Sửa tên, email, giới thiệu, ảnh đại diện, ảnh bìa. */
export function ProfileEditModal({ user, open, onClose, onSaved }: ProfileEditModalProps) {
  const { message } = App.useApp();
  const [form] = Form.useForm<UpdateProfileRequest>();
  const [avatar, setAvatar] = useState(user.avatar);
  /** "" = không có ảnh bìa (gửi "" để gỡ ảnh cũ). */
  const [cover, setCover] = useState(user.coverImage ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  /** onChange của Upload: khoá nút Lưu khi đang tải, xong thì gán URL. */
  const onUploadChange =
    (setUrl: (url: string) => void): UploadProps['onChange'] =>
    ({ file }) => {
      setIsUploading(file.status === 'uploading');
      if (file.status === 'done') setUrl(file.response as string);
      if (file.status === 'error') message.error(file.error?.message ?? 'Tải ảnh thất bại');
    };

  const handleSubmit = useCallback(
    async (values: UpdateProfileRequest) => {
      setIsSaving(true);
      try {
        const updated = await updateMe({
          ...values,
          email: values.email || undefined,
          avatar,
          coverImage: cover,
        });
        message.success('Đã cập nhật hồ sơ');
        onSaved(updated);
        onClose();
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setIsSaving(false);
      }
    },
    [avatar, cover, message, onClose, onSaved],
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
        <Form.Item label="Ảnh bìa" extra="Nên dùng ảnh ngang, rộng từ 1200px.">
          <div className="relative h-28 w-full overflow-hidden rounded-lg bg-linear-to-r from-brand-dark via-brand to-[#d9f5f3]">
            {cover && <Image src={cover} alt="" fill sizes="480px" className="object-cover" />}
            <div className="absolute right-2 bottom-2 flex gap-2">
              <Upload
                accept={IMAGE_ACCEPT}
                showUploadList={false}
                customRequest={antdUploadRequest}
                onChange={onUploadChange(setCover)}
              >
                <Button size="small" icon={<Camera size={14} />}>
                  {cover ? 'Đổi ảnh bìa' : 'Tải ảnh bìa'}
                </Button>
              </Upload>
              {cover && (
                <Button
                  size="small"
                  danger
                  icon={<Trash2 size={14} />}
                  onClick={() => setCover('')}
                >
                  Gỡ
                </Button>
              )}
            </div>
          </div>
        </Form.Item>
        <Form.Item label="Ảnh đại diện">
          <Upload
            accept={IMAGE_ACCEPT}
            showUploadList={false}
            customRequest={antdUploadRequest}
            onChange={onUploadChange(setAvatar)}
          >
            <div className="relative cursor-pointer w-fit">
              <Avatar size={96} src={avatar} icon={<UserRound size={48} />} />
              <span className="absolute bottom-0 right-0 flex size-8 items-center justify-center rounded-full bg-surface shadow">
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
