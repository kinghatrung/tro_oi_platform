'use client';

import { useState } from 'react';
import { App, Button, Progress, Upload } from 'antd';
import { Trash2, Video } from 'lucide-react';

import { uploadVideo, VIDEO_MAX_MB } from '@/api/uploads';

const ACCEPT = 'video/mp4,video/webm,video/quicktime';

interface VideoUploadFieldProps {
  /** URL video đã tải lên ("" / undefined = chưa có). Dùng trong Form.Item name="video". */
  value?: string;
  onChange?: (url: string) => void;
}

/** Tải 1 video cho tin (POST /uploads/video): nút chọn file + % tiến trình, xem trước, gỡ. */
export function VideoUploadField({ value, onChange }: VideoUploadFieldProps) {
  const { message } = App.useApp();
  const [percent, setPercent] = useState<number>();

  if (value) {
    return (
      <div className="flex flex-col items-start gap-2">
        <video
          src={value}
          controls
          preload="metadata"
          className="max-h-72 w-full rounded-lg bg-black"
        />
        <Button danger size="small" icon={<Trash2 size={14} />} onClick={() => onChange?.('')}>
          Gỡ video
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Upload
        accept={ACCEPT}
        showUploadList={false}
        disabled={percent !== undefined}
        beforeUpload={(file) => {
          if (file.size > VIDEO_MAX_MB * 1024 * 1024) {
            message.error(`Video tối đa ${VIDEO_MAX_MB}MB`);
            return Upload.LIST_IGNORE;
          }
          return true;
        }}
        customRequest={({ file, onSuccess, onError }) => {
          setPercent(0);
          uploadVideo(file as Blob, setPercent)
            .then((url) => {
              onChange?.(url);
              onSuccess?.(url);
            })
            .catch((error: Error) => {
              message.error(error.message);
              onError?.(error);
            })
            .finally(() => setPercent(undefined));
        }}
      >
        <Button icon={<Video size={16} />} loading={percent !== undefined}>
          {percent === undefined ? 'Tải video lên' : `Đang tải ${percent}%`}
        </Button>
      </Upload>
      {percent !== undefined && <Progress percent={percent} size="small" className="max-w-72" />}
      <span className="text-xs text-subtle">MP4, WEBM hoặc MOV, tối đa {VIDEO_MAX_MB}MB.</span>
    </div>
  );
}
