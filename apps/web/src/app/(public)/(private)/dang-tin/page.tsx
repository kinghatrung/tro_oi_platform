'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  App,
  Card,
  Checkbox,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Segmented,
  Select,
  Skeleton,
  Upload,
  type UploadFile,
} from 'antd';
import { ImagePlus } from 'lucide-react';
import { FaYoutube } from 'react-icons/fa';
import {
  ListingStatus,
  TransactionType,
  type CreateListingRequest,
  type Listing,
} from '@tro-oi/shared';

import { createListing, getMyListings, updateListing } from '@/api/listings';
import { antdUploadRequest } from '@/api/uploads';
import { FormSection } from '@/components/common';
import { AMENITY_ITEMS } from '@/lib/constants/constantsRoom';
import { YOUTUBE_URL_PATTERN } from '@/lib/youtube';
import { useRequireUser } from '@/stores/useAuthStore';
import { formatListingPrice, formatNumber } from '@/utils/helpers';

import { CategoryPicker } from './CategoryPicker';
import { PostSidebar, type PostPreview } from './PostSidebar';
import {
  CITY_OPTIONS,
  DIRECTION_OPTIONS,
  FURNISHING_OPTIONS,
  MAX_IMAGES,
  TRANSACTION_OPTIONS,
} from './const';

type ListingFormValues = Omit<CreateListingRequest, 'images'>;

const toFileList = (images: string[]): UploadFile[] =>
  images.map((url, index) => ({ uid: `${index}-${url}`, name: url, status: 'done', url }));

const fileUrl = (file: UploadFile) => (file.response as string | undefined) ?? file.url;

const AMENITY_OPTIONS = AMENITY_ITEMS.map(({ value, label, icon }) => ({
  value,
  label: (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {label}
    </span>
  ),
}));

const formatPrice = (value?: number | string) => (value ? formatNumber(Number(value)) : '');
const parsePrice = (value?: string) => Number(value?.replace(/\D/g, '') || 0);

const DESCRIPTION_PLACEHOLDER = `VD:
- Phòng 25m², khép kín, có gác xép, cửa sổ thoáng.
- Đầy đủ điều hoà, nóng lạnh, giường tủ.
- Điện 3.500đ/số, nước 100.000đ/người, internet miễn phí.
- Giờ giấc tự do, khoá vân tay, có chỗ để xe.`;

/** Đăng tin mới, hoặc sửa tin của tôi khi có ?id=. */
export default function PostListingPage() {
  const router = useRouter();
  const editId = useSearchParams().get('id');
  const { message } = App.useApp();
  const user = useRequireUser();
  const [form] = Form.useForm<ListingFormValues>();
  const values = Form.useWatch([], form);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [editing, setEditing] = useState<Listing>();
  const [isLoading, setIsLoading] = useState(Boolean(editId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUploading = fileList.some((file) => file.status === 'uploading');

  const doneImages = useMemo(
    () => fileList.filter((file) => file.status === 'done' && fileUrl(file)),
    [fileList],
  );
  const preview = useMemo<PostPreview>(
    () => ({
      title: values?.title,
      price: values?.price,
      area: values?.area,
      transaction: values?.transaction,
      category: values?.category,
      city: values?.address?.city,
      district: values?.address?.district,
      coverUrl: doneImages[0] && fileUrl(doneImages[0]),
      imageCount: doneImages.length,
    }),
    [doneImages, values],
  );

  const handleSubmit = useCallback(
    async (formValues: ListingFormValues) => {
      const images = doneImages.map(fileUrl).filter((url): url is string => Boolean(url));
      if (images.length === 0) {
        message.error('Cần ít nhất 1 ảnh');
        return;
      }

      setIsSubmitting(true);
      try {
        // Form không có field toạ độ: giữ geo cũ nếu không đổi khu vực, tránh mất bản đồ
        const oldAddress = editing?.address;
        const isSameArea =
          oldAddress?.city === formValues.address.city &&
          oldAddress?.district === formValues.address.district;
        const address = { ...formValues.address, geo: isSameArea ? oldAddress?.geo : undefined };
        // "" = gỡ video khi sửa tin (ô trống → undefined sẽ không xoá được video cũ)
        const body = {
          ...formValues,
          address,
          images,
          videoUrl: formValues.videoUrl?.trim() ?? '',
        };
        const saved = editing ? await updateListing(editing.id, body) : await createListing(body);
        if (saved.status === ListingStatus.PENDING) {
          message.info('Tin đã gửi, đang chờ quản trị viên duyệt');
        } else {
          message.success(editing ? 'Đã cập nhật tin' : 'Đăng tin thành công');
        }
        router.push(
          saved.status === ListingStatus.ACTIVE
            ? `/phong-tro/${saved.id}`
            : '/kenh-nguoi-dang/tin-dang',
        );
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [doneImages, editing, message, router],
  );

  const handleCancel = useCallback(() => router.back(), [router]);

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
    <Form
      form={form}
      layout="vertical"
      requiredMark="optional"
      initialValues={{ transaction: TransactionType.RENT }}
      onFinish={handleSubmit}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
    >
      <Card variant="borderless" className="mb-4!">
        <h1 className="text-primary text-xl!">{editing ? 'Sửa tin đăng' : 'Đăng tin mới'}</h1>
        <p className="text-sm text-subtle">
          Điền đủ 6 bước bên dưới. Trường có nhãn &quot;(optional)&quot; có thể bỏ trống.
        </p>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Flex vertical gap={16}>
            <FormSection step={1} title="Loại tin" description="Bạn muốn cho thuê hay bán?">
              <Form.Item name="transaction" rules={[{ required: true }]}>
                <Segmented block size="large" options={TRANSACTION_OPTIONS} />
              </Form.Item>
              <Form.Item
                name="category"
                label="Loại hình"
                className="mb-0!"
                rules={[{ required: true, message: 'Chọn loại hình' }]}
              >
                <CategoryPicker />
              </Form.Item>
            </FormSection>

            <FormSection
              step={2}
              title="Hình ảnh"
              description={`Tối đa ${MAX_IMAGES} ảnh JPG/PNG/WEBP, mỗi ảnh ≤ 5MB. Ảnh đầu tiên là ảnh bìa.`}
            >
              <Upload
                listType="picture-card"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                maxCount={MAX_IMAGES}
                fileList={fileList}
                customRequest={antdUploadRequest}
                onChange={({ fileList: next, file }) => {
                  setFileList(next);
                  if (file.status === 'error') {
                    message.error(file.error?.message ?? 'Tải ảnh thất bại');
                  }
                }}
              >
                {fileList.length < MAX_IMAGES && (
                  <div className="flex flex-col items-center gap-1 text-body">
                    <ImagePlus size={22} />
                    <span className="text-xs">Thêm ảnh</span>
                  </div>
                )}
              </Upload>
              <Form.Item
                name="videoUrl"
                label="Video YouTube (tuỳ chọn)"
                className="mt-4! mb-0!"
                rules={[
                  {
                    pattern: YOUTUBE_URL_PATTERN,
                    message:
                      'Dán link YouTube dạng youtube.com/watch?v=..., youtu.be/... hoặc shorts',
                  },
                ]}
              >
                <Input
                  allowClear
                  prefix={<FaYoutube size={16} className="text-red-500" />}
                  placeholder="https://youtu.be/..."
                />
              </Form.Item>
            </FormSection>

            <FormSection
              step={3}
              title="Vị trí"
              description="Địa chỉ giúp người thuê tìm thấy tin."
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['address', 'city']}
                    label="Tỉnh/thành phố"
                    rules={[{ required: true, message: 'Chọn tỉnh/thành phố' }]}
                  >
                    <Select showSearch options={CITY_OPTIONS} placeholder="Chọn tỉnh/thành" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['address', 'district']}
                    label="Quận/huyện"
                    rules={[{ required: true, whitespace: true, message: 'Nhập quận/huyện' }]}
                  >
                    <Input placeholder="VD: Cầu Giấy" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['address', 'ward']}
                    label="Phường/xã"
                    className="mb-0! md:mb-6!"
                  >
                    <Input placeholder="VD: Dịch Vọng" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['address', 'street']}
                    label="Số nhà, tên đường"
                    className="mb-0!"
                  >
                    <Input placeholder="VD: Số 12 ngõ 165 Xuân Thuỷ" />
                  </Form.Item>
                </Col>
              </Row>
            </FormSection>

            <FormSection step={4} title="Giá & diện tích">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="price"
                    label={
                      values?.transaction === TransactionType.BUY ? 'Giá bán' : 'Giá thuê / tháng'
                    }
                    rules={[{ required: true, message: 'Nhập giá' }]}
                    extra={
                      values?.price && values.transaction
                        ? `= ${formatListingPrice(values.price, values.transaction)}`
                        : undefined
                    }
                    className="mb-0!"
                  >
                    <InputNumber<number>
                      min={0}
                      step={100_000}
                      className="w-full!"
                      size="large"
                      formatter={formatPrice}
                      parser={parsePrice}
                      suffix="đ"
                      placeholder="VD: 3.500.000"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="area" label="Diện tích" className="mb-0!">
                    <InputNumber
                      min={1}
                      className="w-full!"
                      size="large"
                      suffix="m²"
                      placeholder="VD: 25"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </FormSection>

            <FormSection
              step={5}
              title="Đặc điểm"
              description="Thông tin chi tiết về căn phòng/nhà."
            >
              <Row gutter={16}>
                <Col xs={8}>
                  <Form.Item name="bedrooms" label="Phòng ngủ">
                    <InputNumber min={0} precision={0} className="w-full!" />
                  </Form.Item>
                </Col>
                <Col xs={8}>
                  <Form.Item name="bathrooms" label="Phòng vệ sinh">
                    <InputNumber min={0} precision={0} className="w-full!" />
                  </Form.Item>
                </Col>
                <Col xs={8}>
                  <Form.Item name="floorCount" label="Số tầng">
                    <InputNumber min={0} precision={0} className="w-full!" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="furnishing" label="Nội thất" className="mb-0! md:mb-6!">
                    <Radio.Group
                      options={FURNISHING_OPTIONS}
                      optionType="button"
                      buttonStyle="solid"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="direction" label="Hướng">
                    <Select allowClear options={DIRECTION_OPTIONS} placeholder="Chọn hướng" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item name="amenities" label="Tiện ích" className="mb-0!">
                    <Checkbox.Group
                      options={AMENITY_OPTIONS}
                      className="grid! grid-cols-2 gap-y-3 md:grid-cols-3"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </FormSection>

            <FormSection
              step={6}
              title="Tiêu đề & mô tả"
              description="Tiêu đề ngắn gọn, nêu điểm nổi bật: loại phòng, diện tích, vị trí."
            >
              <Form.Item
                name="title"
                label="Tiêu đề"
                rules={[
                  { required: true, whitespace: true, message: 'Nhập tiêu đề' },
                  { min: 10, max: 150, message: 'Tiêu đề từ 10 đến 150 ký tự' },
                ]}
              >
                <Input
                  size="large"
                  showCount
                  maxLength={150}
                  placeholder="VD: Phòng trọ khép kín 25m² full đồ gần ĐH Quốc gia"
                />
              </Form.Item>
              <Form.Item name="description" label="Mô tả chi tiết" className="mb-0!">
                <Input.TextArea
                  autoSize={{ minRows: 6, maxRows: 16 }}
                  showCount
                  maxLength={5000}
                  placeholder={DESCRIPTION_PLACEHOLDER}
                />
              </Form.Item>
            </FormSection>
          </Flex>
        </Col>

        <Col xs={24} lg={8}>
          <PostSidebar
            preview={preview}
            isEditing={Boolean(editing)}
            isSubmitting={isSubmitting}
            isUploading={isUploading}
            onCancel={handleCancel}
          />
        </Col>
      </Row>
    </Form>
  );
}
