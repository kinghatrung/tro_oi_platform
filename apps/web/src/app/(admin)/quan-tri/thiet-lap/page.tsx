'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  App,
  Button,
  Card,
  ColorPicker,
  Flex,
  Form,
  Input,
  Radio,
  Switch,
  Tabs,
  type TabsProps,
} from 'antd';
import type { Color } from 'antd/es/color-picker';
import { Save } from 'lucide-react';
import {
  AnnouncementType,
  ThemeMode,
  type SiteSettings,
  type UpdateSiteSettingsRequest,
} from '@tro-oi/shared';

import { updateSiteSettings } from '@/api/settings';
import { useSiteSettings } from '@/app/providers';

import { ImageListField, ImageUrlField } from './ImageFields';

const COLOR_PRESETS = [
  {
    label: 'Gợi ý',
    colors: [
      '#16a6a3',
      '#1677ff',
      '#722ed1',
      '#eb2f96',
      '#fa541c',
      '#13c2c2',
      '#52c41a',
      '#0f172a',
    ],
  },
];
const THEME_OPTIONS = [
  { value: ThemeMode.LIGHT, label: 'Sáng' },
  { value: ThemeMode.DARK, label: 'Tối' },
];
const ANNOUNCEMENT_OPTIONS = [
  { value: AnnouncementType.INFO, label: 'Thông tin' },
  { value: AnnouncementType.SUCCESS, label: 'Tích cực' },
  { value: AnnouncementType.WARNING, label: 'Cảnh báo' },
];

/** Hàng Switch có mô tả (tab Tính năng). */
function SwitchField({
  name,
  label,
  description,
}: {
  name: keyof SiteSettings;
  label: string;
  description: string;
}) {
  return (
    <Flex justify="space-between" align="center" gap={16} className="border-b border-line py-3">
      <div>
        <p className="font-semibold text-ink">{label}</p>
        <p className="text-sm text-subtle">{description}</p>
      </div>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch />
      </Form.Item>
    </Flex>
  );
}

/** Thiết lập website: tên, giao diện (logo, màu, theme), trang chủ, thông báo, bật/tắt tính năng. */
export default function AdminSettingsPage() {
  const router = useRouter();
  const { message } = App.useApp();
  const settings = useSiteSettings();
  const [form] = Form.useForm<UpdateSiteSettingsRequest>();
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = useCallback(
    async (values: UpdateSiteSettingsRequest) => {
      setIsSaving(true);
      try {
        await updateSiteSettings(values);
        message.success('Đã lưu thiết lập, đang áp dụng lên website');
        // Layout gốc đọc lại thiết lập mới (tiêu đề, màu, theme...)
        router.refresh();
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setIsSaving(false);
      }
    },
    [message, router],
  );

  const tabs = useMemo<TabsProps['items']>(
    () => [
      {
        key: 'general',
        label: 'Chung',
        children: (
          <>
            <Form.Item
              name="siteName"
              label="Tên website"
              rules={[{ required: true, min: 2, max: 40 }]}
            >
              <Input placeholder="Trọ ơi" />
            </Form.Item>
            <Form.Item
              name="tagline"
              label="Khẩu hiệu"
              extra="Tiêu đề tab trang chủ = Tên website: Khẩu hiệu"
              rules={[{ max: 80 }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="description" label="Mô tả (SEO)" rules={[{ max: 300 }]}>
              <Input.TextArea rows={3} showCount maxLength={300} />
            </Form.Item>
            <Form.Item
              name="contactEmail"
              label="Email hỗ trợ"
              rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="contactPhone" label="Hotline" rules={[{ max: 20 }]}>
              <Input placeholder="Bỏ trống để ẩn" />
            </Form.Item>
          </>
        ),
      },
      {
        key: 'appearance',
        label: 'Giao diện',
        children: (
          <>
            <Form.Item name="logoUrl" label="Logo" rules={[{ required: true }]}>
              <ImageUrlField previewClassName="h-12 w-40" />
            </Form.Item>
            <Form.Item
              name="faviconUrl"
              label="Favicon (icon trên tab trình duyệt)"
              rules={[{ required: true }]}
            >
              <ImageUrlField previewClassName="size-12" />
            </Form.Item>
            <Form.Item
              name="primaryColor"
              label="Màu chủ đạo (Trọ ơi)"
              getValueFromEvent={(color: Color) => color.toHexString()}
              extra="Áp dụng cho nút, link, điểm nhấn trên website"
            >
              <ColorPicker showText presets={COLOR_PRESETS} disabledAlpha />
            </Form.Item>
            <Form.Item
              name="marketplaceColor"
              label="Màu chủ đạo (Chợ ơi)"
              getValueFromEvent={(color: Color) => color.toHexString()}
              extra="Theme riêng cho các trang Chợ ơi"
            >
              <ColorPicker showText presets={COLOR_PRESETS} disabledAlpha />
            </Form.Item>
            <Form.Item name="defaultTheme" label="Giao diện mặc định">
              <Radio.Group options={THEME_OPTIONS} optionType="button" buttonStyle="solid" />
            </Form.Item>
            <SwitchField
              name="allowThemeToggle"
              label="Cho phép người dùng đổi sáng/tối"
              description="Hiện nút mặt trăng/mặt trời trên thanh điều hướng"
            />
          </>
        ),
      },
      {
        key: 'home',
        label: 'Trang chủ & thông báo',
        children: (
          <>
            <Form.Item
              name="heroTitle"
              label="Dòng chữ lớn trên banner trang chủ"
              rules={[{ max: 80 }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="banners"
              label="Banner quảng bá (kéo thả không hỗ trợ — xoá/thêm theo thứ tự)"
            >
              <ImageListField />
            </Form.Item>
            <SwitchField
              name="announcementEnabled"
              label="Hiện thanh thông báo"
              description="Dải thông báo trên cùng mọi trang (bảo trì, khuyến mãi...)"
            />
            <Form.Item name="announcementType" label="Kiểu thông báo" className="mt-4!">
              <Radio.Group options={ANNOUNCEMENT_OPTIONS} optionType="button" />
            </Form.Item>
            <Form.Item name="announcementText" label="Nội dung thông báo" rules={[{ max: 200 }]}>
              <Input showCount maxLength={200} />
            </Form.Item>
            <Form.Item name="footerText" label="Chữ chân trang" rules={[{ max: 500 }]}>
              <Input.TextArea rows={3} showCount maxLength={500} />
            </Form.Item>
          </>
        ),
      },
      {
        key: 'features',
        label: 'Tính năng',
        children: (
          <>
            <SwitchField
              name="enableMarketplace"
              label="Bật Chợ ơi"
              description="Tắt để ẩn mục Chợ ơi và chặn đăng bán đồ mới"
            />
            <SwitchField
              name="requireListingApproval"
              label="Duyệt tin Trọ ơi trước khi hiển thị"
              description="Tin mới ở trạng thái Chờ duyệt cho tới khi quản trị viên duyệt"
            />
            <SwitchField
              name="requireProductApproval"
              label="Duyệt tin Chợ ơi trước khi hiển thị"
              description="Món đồ mới chờ quản trị viên duyệt"
            />
          </>
        ),
      },
    ],
    [],
  );

  return (
    <Card variant="borderless">
      <Flex justify="space-between" align="center" className="mb-2!">
        <div>
          <h1 className="text-primary text-xl!">Thiết lập website</h1>
          {settings.updatedAt && (
            <p className="text-xs text-subtle">
              Cập nhật lần cuối: {new Date(settings.updatedAt).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
        <Button type="primary" icon={<Save size={16} />} loading={isSaving} onClick={form.submit}>
          Lưu thay đổi
        </Button>
      </Flex>
      <Form
        form={form}
        layout="vertical"
        initialValues={settings}
        onFinish={handleSubmit}
        className="max-w-200"
      >
        <Tabs items={tabs} />
      </Form>
    </Card>
  );
}
