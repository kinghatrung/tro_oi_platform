'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Skeleton,
  Upload,
  type UploadFile,
} from 'antd';
import { ImagePlus } from 'lucide-react';
import {
  ListingStatus,
  TransactionType,
  type CreateListingRequest,
  type Listing,
} from '@tro-oi/shared';

import { createListing, getMyListings, updateListing } from '@/api/listings';
import { antdUploadRequest } from '@/api/uploads';
import { useRequireUser } from '@/stores/useAuthStore';
import { formatNumber } from '@/utils/helpers';

import {
  CATEGORY_OPTIONS,
  CITY_OPTIONS,
  DIRECTION_OPTIONS,
  FURNISHING_OPTIONS,
  MAX_IMAGES,
  TRANSACTION_OPTIONS,
} from './const';

type ListingFormValues = Omit<CreateListingRequest, 'images'>;

const toFileList = (images: string[]): UploadFile[] =>
  images.map((url, index) => ({ uid: `${index}-${url}`, name: url, status: 'done', url }));

const formatPrice = (value?: number | string) => (value ? formatNumber(Number(value)) : '');
const parsePrice = (value?: string) => Number(value?.replace(/\D/g, '') || 0);

/** Đăng tin mới, hoặc sửa tin của tôi khi có ?id=. */
export default function PostListingPage() {
  const router = useRouter();
  const editId = useSearchParams().get('id');
  const { message } = App.useApp();
  const user = useRequireUser();
  const [form] = Form.useForm<ListingFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [editing, setEditing] = useState<Listing>();
  const [isLoading, setIsLoading] = useState(Boolean(editId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUploading = fileList.some((file) => file.status === 'uploading');

  const handleSubmit = useCallback(
    async (values: ListingFormValues) => {
      const images = fileList
        .filter((file) => file.status === 'done')
        .map((file) => (file.response as string | undefined) ?? file.url)
        .filter((url): url is string => Boolean(url));
      if (images.length === 0) {
        message.error('Cần ít nhất 1 ảnh');
        return;
      }

      setIsSubmitting(true);
      try {
        // Form không có field toạ độ: giữ geo cũ nếu không đổi khu vực, tránh mất bản đồ
        const oldAddress = editing?.address;
        const isSameArea =
          oldAddress?.city === values.address.city &&
          oldAddress?.district === values.address.district;
        const address = { ...values.address, geo: isSameArea ? oldAddress?.geo : undefined };
        const body = { ...values, address, images };
        const saved = editing ? await updateListing(editing.id, body) : await createListing(body);
        message.success(editing ? 'Đã cập nhật tin' : 'Đăng tin thành công');
        router.push(saved.status === ListingStatus.ACTIVE ? `/phong-tro/${saved.id}` : '/ca-nhan');
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editing, fileList, message, router],
  );

  // Tin cần sửa lấy từ danh sách của tôi (GET /listings/:id chỉ trả tin active)
  useEffect(() => {
    if (!user || !editId) return;
    getMyListings()
      .then((listings) => {
        const listing = listings.find((item) => item.id === editId);
        if (!listing) {
          message.error('Không tìm thấy tin đăng của bạn');
          router.replace('/dang-tin');
          return;
        }
        setEditing(listing);
        setFileList(toFileList(listing.images));
        form.setFieldsValue(listing);
      })
      .catch((error: Error) => message.error(error.message))
      .finally(() => setIsLoading(false));
  }, [editId, form, message, router, user]);

  if (!user || isLoading) {
    return (
      <Card variant="borderless">
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  return (
    <Card variant="borderless">
      <h1 className="text-primary text-xl! mb-4">{editing ? 'Sửa tin đăng' : 'Đăng tin mới'}</h1>

      <Form
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{ transaction: TransactionType.RENT }}
        onFinish={handleSubmit}
        scrollToFirstError
      >
        <Form.Item label={`Hình ảnh (tối đa ${MAX_IMAGES})`} required>
          <Upload
            listType="picture-card"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            maxCount={MAX_IMAGES}
            fileList={fileList}
            customRequest={antdUploadRequest}
            onChange={({ fileList: next, file }) => {
              setFileList(next);
              if (file.status === 'error') message.error(file.error?.message ?? 'Tải ảnh thất bại');
            }}
          >
            {fileList.length < MAX_IMAGES && (
              <div className="flex flex-col items-center gap-1">
                <ImagePlus size={20} />
                <span className="text-xs">Thêm ảnh</span>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="transaction" label="Hình thức" rules={[{ required: true }]}>
              <Radio.Group options={TRANSACTION_OPTIONS} optionType="button" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="category"
              label="Loại hình"
              rules={[{ required: true, message: 'Chọn loại hình' }]}
            >
              <Select options={CATEGORY_OPTIONS} placeholder="Chọn loại hình" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, min: 10, max: 150, message: 'Tiêu đề từ 10 đến 150 ký tự' }]}
        >
          <Input
            showCount
            maxLength={150}
            placeholder="VD: Phòng trọ khép kín 25m² gần ĐH Quốc gia"
          />
        </Form.Item>

        <Form.Item name="description" label="Mô tả chi tiết">
          <Input.TextArea rows={6} showCount maxLength={5000} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name="price"
              label="Giá (VNĐ)"
              rules={[{ required: true, message: 'Nhập giá' }]}
            >
              <InputNumber<number>
                min={0}
                className="w-full!"
                formatter={formatPrice}
                parser={parsePrice}
                addonAfter="đ"
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="area" label="Diện tích">
              <InputNumber min={1} className="w-full!" addonAfter="m²" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="bedrooms" label="Phòng ngủ">
              <InputNumber min={0} precision={0} className="w-full!" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="bathrooms" label="Phòng vệ sinh">
              <InputNumber min={0} precision={0} className="w-full!" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="floorCount" label="Số tầng">
              <InputNumber min={0} precision={0} className="w-full!" />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="direction" label="Hướng">
              <Select allowClear options={DIRECTION_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={12} md={8}>
            <Form.Item name="furnishing" label="Nội thất">
              <Select allowClear options={FURNISHING_OPTIONS} />
            </Form.Item>
          </Col>
        </Row>

        <p className="text-primary mb-2">Địa chỉ</p>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item
              name={['address', 'city']}
              label="Tỉnh/thành phố"
              rules={[{ required: true, message: 'Chọn tỉnh/thành phố' }]}
            >
              <Select showSearch options={CITY_OPTIONS} placeholder="Chọn tỉnh/thành" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name={['address', 'district']}
              label="Quận/huyện"
              rules={[{ required: true, whitespace: true, message: 'Nhập quận/huyện' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name={['address', 'ward']} label="Phường/xã">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name={['address', 'street']} label="Số nhà, tên đường">
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          loading={isSubmitting}
          disabled={isUploading}
          className="w-full md:w-60"
        >
          {editing ? 'Lưu thay đổi' : 'Đăng tin'}
        </Button>
      </Form>
    </Card>
  );
}
