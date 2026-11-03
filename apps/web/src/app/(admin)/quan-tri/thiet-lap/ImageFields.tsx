'use client';

import { useState } from 'react';
import { App, Button, Flex, Input, Upload, type UploadFile } from 'antd';
import { ImagePlus, Upload as UploadIcon } from 'lucide-react';

import { antdUploadRequest } from '@/api/uploads';

const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';

interface ImageUrlFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  /** Lớp kích thước ô xem trước, vd "h-10 w-40". */
  previewClassName?: string;
}

/** Control Form.Item cho 1 ảnh: xem trước + tải lên + dán URL. */
export function ImageUrlField({
  value,
  onChange,
  previewClassName = 'h-12 w-40',
}: ImageUrlFieldProps) {
  const { message } = App.useApp();

  return (
    <Flex gap={12} align="center" wrap>
      <div
        className={`flex items-center justify-center overflow-hidden rounded-md border border-line bg-soft p-1 ${previewClassName}`}
      >
        {value && (
          // eslint-disable-next-line @next/next/no-img-element -- xem trước URL tuỳ ý admin nhập
          <img src={value} alt="Xem trước" className="max-h-full max-w-full object-contain" />
        )}
      </div>
      <Flex vertical gap={8} className="min-w-64 flex-1">
        <Input
          value={value}
          onChange={(event) => onChange?.(event.target.value)}
          placeholder="/images/... hoặc https://..."
        />
        <Upload
          accept={IMAGE_ACCEPT}
          showUploadList={false}
          customRequest={antdUploadRequest}
          onChange={({ file }) => {
            if (file.status === 'done') onChange?.(file.response as string);
            if (file.status === 'error') message.error(file.error?.message ?? 'Tải ảnh thất bại');
          }}
        >
          <Button icon={<UploadIcon size={14} />}>Tải ảnh lên</Button>
        </Upload>
      </Flex>
    </Flex>
  );
}

interface ImageListFieldProps {
  value?: string[];
  onChange?: (value: string[]) => void;
  max?: number;
}

const toFileList = (urls: string[]): UploadFile[] =>
  urls.map((url, index) => ({ uid: `${index}-${url}`, name: url, status: 'done', url }));

/** Control Form.Item cho danh sách ảnh (banner): thêm, xoá, giữ thứ tự. */
export function ImageListField({ value = [], onChange, max = 10 }: ImageListFieldProps) {
  const { message } = App.useApp();
  // fileList cục bộ để hiện tiến trình upload; chỉ báo ra ngoài khi có URL hoàn chỉnh
  const [fileList, setFileList] = useState<UploadFile[]>(() => toFileList(value));

  return (
    <Upload
      listType="picture-card"
      accept={IMAGE_ACCEPT}
      multiple
      maxCount={max}
      fileList={fileList}
      customRequest={antdUploadRequest}
      onChange={({ fileList: next, file }) => {
        setFileList(next);
        if (file.status === 'error') message.error(file.error?.message ?? 'Tải ảnh thất bại');
        if (next.every((item) => item.status === 'done')) {
          onChange?.(
            next
              .map((item) => (item.response as string | undefined) ?? item.url)
              .filter((url): url is string => Boolean(url)),
          );
        }
      }}
    >
      {fileList.length < max && (
        <div className="flex flex-col items-center gap-1 text-body">
          <ImagePlus size={20} />
          <span className="text-xs">Thêm banner</span>
        </div>
      )}
    </Upload>
  );
}
