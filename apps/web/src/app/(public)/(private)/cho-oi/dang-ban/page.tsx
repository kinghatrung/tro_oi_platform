'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  App,
  Button,
  Card,
  Col,
  Flex,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Skeleton,
  Switch,
  Upload,
  type UploadFile,
} from 'antd';
import { ImagePlus } from 'lucide-react';
import { ProductStatus, type CreateProductRequest, type ProductItem } from '@tro-oi/shared';

import { createProduct, getMyProducts, updateProduct } from '@/api/products';
import { antdUploadRequest } from '@/api/uploads';
import { FormSection, GeoField } from '@/components/common';
import { PROVINCES } from '@/constants';
import { useWards } from '@/hooks/useWards';
import {
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_CONDITION_OPTIONS,
} from '@/lib/constants/constantsProduct';
import { useRequireUser } from '@/stores/useAuthStore';
import { formatNumber, formatVietnameseCurrency } from '@/utils/helpers';

type ProductFormValues = Omit<CreateProductRequest, 'images'>;

const MAX_IMAGES = 10;
const CITY_OPTIONS = PROVINCES.map((city) => ({ value: city, label: city }));
const CATEGORY_RADIO_OPTIONS = PRODUCT_CATEGORY_OPTIONS.map(({ value, label, icon }) => ({
  value,
  label: (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {label}
    </span>
  ),
}));

const fileUrl = (file: UploadFile) => (file.response as string | undefined) ?? file.url;
const toFileList = (images: string[]): UploadFile[] =>
  images.map((url, index) => ({ uid: `${index}-${url}`, name: url, status: 'done', url }));
const formatPrice = (value?: number | string) => (value ? formatNumber(Number(value)) : '');
const parsePrice = (value?: string) => Number(value?.replace(/\D/g, '') || 0);

/** Đăng bán món đồ mới, hoặc sửa món của tôi khi có ?id=. */
export default function PostProductPage() {
  const router = useRouter();
  const editId = useSearchParams().get('id');
  const { message } = App.useApp();
  const user = useRequireUser();
  const [form] = Form.useForm<ProductFormValues>();
  const price = Form.useWatch('price', form);
  const city = Form.useWatch(['address', 'city'], form);
  const wardOptions = useWards(city).map((ward) => ({ value: ward, label: ward }));
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [editing, setEditing] = useState<ProductItem>();
  const [isLoading, setIsLoading] = useState(Boolean(editId));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isUploading = fileList.some((file) => file.status === 'uploading');

  const handleSubmit = useCallback(
    async (values: ProductFormValues) => {
      const images = fileList
        .filter((file) => file.status === 'done')
        .map(fileUrl)
        .filter((url): url is string => Boolean(url));
      if (images.length === 0) {
        message.error('Cần ít nhất 1 ảnh');
        return;
      }

      setIsSubmitting(true);
      try {
        const body = { ...values, images };
        const saved = editing ? await updateProduct(editing.id, body) : await createProduct(body);
        if (saved.status === ProductStatus.PENDING) {
          message.info('Đã gửi, món đồ đang chờ quản trị viên duyệt');
        } else {
          message.success(editing ? 'Đã cập nhật' : 'Đăng bán thành công');
        }
        router.push(
          saved.status === ProductStatus.ACTIVE ? `/cho-oi/${saved.id}` : '/kenh-nguoi-dang/do-ban',
        );
      } catch (error) {
        message.error((error as Error).message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editing, fileList, message, router],
  );

  useEffect(() => {
    if (!user || !editId) return;
    getMyProducts()
      .then((products) => {
        const product = products.find((item) => item.id === editId);
        if (!product) {
          message.error('Không tìm thấy món đồ của bạn');
          router.replace('/cho-oi/dang-ban');
          return;
        }
        setEditing(product);
        setFileList(toFileList(product.images));
        form.setFieldsValue(product);
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
      initialValues={{ isNegotiable: true }}
      onFinish={handleSubmit}
      scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
      className="mx-auto max-w-220"
    >
      <Flex vertical gap={16}>
        <Card variant="borderless">
          <h1 className="text-primary text-xl!">
            {editing ? 'Sửa món đồ' : 'Đăng bán đồ trên Chợ ơi'}
          </h1>
          <p className="text-sm text-subtle">
            Pass lại đồ không dùng tới cho người cần. Đồ cho tặng thì để giá 0đ.
          </p>
        </Card>

        <FormSection
          step={1}
          title="Hình ảnh"
          description={`Tối đa ${MAX_IMAGES} ảnh, ảnh đầu tiên là ảnh bìa. Chụp rõ tình trạng thật.`}
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
              if (file.status === 'error') message.error(file.error?.message ?? 'Tải ảnh thất bại');
            }}
          >
            {fileList.length < MAX_IMAGES && (
              <div className="flex flex-col items-center gap-1 text-body">
                <ImagePlus size={22} />
                <span className="text-xs">Thêm ảnh</span>
              </div>
            )}
          </Upload>
        </FormSection>

        <FormSection step={2} title="Thông tin món đồ">
          <Form.Item
            name="title"
            label="Tên món đồ"
            rules={[
              { required: true, whitespace: true, message: 'Nhập tên món đồ' },
              { min: 5, max: 120, message: 'Tên từ 5 đến 120 ký tự' },
            ]}
          >
            <Input size="large" showCount maxLength={120} placeholder="VD: Tủ lạnh mini Aqua 90L" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Danh mục"
            rules={[{ required: true, message: 'Chọn danh mục' }]}
          >
            <Radio.Group options={CATEGORY_RADIO_OPTIONS} optionType="button" />
          </Form.Item>
          <Form.Item
            name="condition"
            label="Tình trạng"
            rules={[{ required: true, message: 'Chọn tình trạng' }]}
          >
            <Radio.Group
              options={PRODUCT_CONDITION_OPTIONS}
              optionType="button"
              buttonStyle="solid"
            />
          </Form.Item>
          <Row gutter={16} align="bottom">
            <Col xs={24} md={14}>
              <Form.Item
                name="price"
                label="Giá bán"
                rules={[{ required: true, message: 'Nhập giá (0 nếu cho tặng)' }]}
                extra={
                  price != null
                    ? price === 0
                      ? '= Cho tặng'
                      : `= ${formatVietnameseCurrency(price)}`
                    : undefined
                }
                className="mb-0!"
              >
                <InputNumber<number>
                  min={0}
                  step={10_000}
                  size="large"
                  className="w-full!"
                  formatter={formatPrice}
                  parser={parsePrice}
                  suffix="đ"
                  placeholder="VD: 500.000"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={10}>
              <Form.Item
                name="isNegotiable"
                label="Cho phép thương lượng"
                valuePropName="checked"
                className="mb-0!"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <FormSection step={3} title="Mô tả & khu vực">
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea
              autoSize={{ minRows: 4, maxRows: 12 }}
              showCount
              maxLength={3000}
              placeholder="Thời gian đã dùng, lý do pass, lỗi/hỏng (nếu có), có ship không..."
            />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name={['address', 'city']}
                label="Tỉnh/thành phố"
                rules={[{ required: true, message: 'Chọn tỉnh/thành phố' }]}
                className="mb-0!"
              >
                <Select
                  showSearch
                  options={CITY_OPTIONS}
                  placeholder="Chọn tỉnh/thành"
                  onChange={() => form.setFieldValue(['address', 'ward'], undefined)}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name={['address', 'ward']} label="Phường/xã" className="mb-0!">
                <Select
                  showSearch
                  allowClear
                  options={wardOptions}
                  disabled={!city}
                  placeholder={city ? 'Chọn phường/xã (tuỳ chọn)' : 'Chọn tỉnh/thành trước'}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                name={['address', 'geo']}
                label="Vị trí trên bản đồ"
                className="mt-4! mb-0!"
              >
                {/* Thường là chỗ ở của người bán → nhắc chỉ cần gần đúng */}
                <GeoField emptyHint="Chưa có vị trí — bấm lên bản đồ để đặt ghim (không bắt buộc; ghim gần đúng như đầu ngõ, toà nhà là đủ)" />
              </Form.Item>
            </Col>
          </Row>
        </FormSection>

        <Card variant="borderless" className="sticky! bottom-0 z-10 shadow-md">
          <Flex justify="end" gap={8}>
            <Button size="large" onClick={() => router.back()}>
              Huỷ
            </Button>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              loading={isSubmitting}
              disabled={isUploading}
            >
              {isUploading ? 'Đang tải ảnh...' : editing ? 'Lưu thay đổi' : 'Đăng bán'}
            </Button>
          </Flex>
        </Card>
      </Flex>
    </Form>
  );
}
