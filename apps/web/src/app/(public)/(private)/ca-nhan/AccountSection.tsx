'use client';

import { useState } from 'react';
import { App, Button, Card, Input, Modal } from 'antd';
import { Download, Trash2 } from 'lucide-react';

import { deleteMyAccount, exportMyData } from '@/api/users';
import { useAuthStore } from '@/stores/useAuthStore';

/** Khớp DELETE_ACCOUNT_CONFIRMATION của API (delete-account.dto.ts). */
const CONFIRMATION = 'XOA TAI KHOAN';

/** Lưu object thành file JSON trên máy người dùng. */
const saveJson = (data: unknown, name: string) => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};

/** Quyền với dữ liệu cá nhân: tải dữ liệu (JSON) và tự xoá tài khoản (ẩn danh hoá). */
export function AccountSection() {
  const { message } = App.useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await exportMyData();
      saveJson(data, `tro-oi-du-lieu-${new Date().toISOString().slice(0, 10)}.json`);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMyAccount(CONFIRMATION);
      message.success('Đã xoá tài khoản');
      useAuthStore.getState().logout();
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- cố ý tải lại toàn trang
      window.location.assign('/');
    } catch (error) {
      message.error((error as Error).message);
      setIsDeleting(false);
    }
  };

  const closeDelete = () => {
    setIsDeleteOpen(false);
    setTyped('');
  };

  return (
    <Card variant="borderless">
      <h2 className="text-primary mb-1">Dữ liệu &amp; tài khoản</h2>
      <p className="mb-4 text-sm text-body">
        Tải về toàn bộ dữ liệu Trọ ơi đang lưu về bạn, hoặc xoá tài khoản vĩnh viễn.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button icon={<Download size={16} />} loading={isExporting} onClick={handleExport}>
          Tải dữ liệu của tôi
        </Button>
        <Button danger icon={<Trash2 size={16} />} onClick={() => setIsDeleteOpen(true)}>
          Xoá tài khoản
        </Button>
      </div>

      <Modal
        title="Xoá tài khoản vĩnh viễn?"
        open={isDeleteOpen}
        onCancel={closeDelete}
        onOk={handleDelete}
        okText="Xoá tài khoản"
        cancelText="Huỷ"
        okButtonProps={{ danger: true, disabled: typed.trim() !== CONFIRMATION }}
        confirmLoading={isDeleting}
        destroyOnHidden
      >
        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-body">
          <li>Tin Trọ ơi, món Chợ ơi, tin đã lưu, tìm kiếm đã lưu và thông báo sẽ bị xoá.</li>
          <li>
            Đánh giá người khác viết về bạn sẽ bị xoá; hồ sơ công khai không còn truy cập được.
          </li>
          <li>
            Tin nhắn và đánh giá bạn đã viết vẫn còn để cuộc trò chuyện của người khác không bị
            hỏng, nhưng hiển thị là &quot;Người dùng đã xoá&quot;.
          </li>
          <li>Không thể khôi phục. Số điện thoại này có thể đăng ký lại thành tài khoản mới.</li>
        </ul>
        <p className="mb-2 text-sm text-body">Nên tải dữ liệu về trước khi xoá.</p>
        <label htmlFor="delete-confirm" className="mb-1 block text-sm text-ink">
          Gõ <b>{CONFIRMATION}</b> để xác nhận
        </label>
        <Input
          id="delete-confirm"
          value={typed}
          onChange={(event) => setTyped(event.target.value.toUpperCase())}
          placeholder={CONFIRMATION}
          autoComplete="off"
        />
      </Modal>
    </Card>
  );
}
