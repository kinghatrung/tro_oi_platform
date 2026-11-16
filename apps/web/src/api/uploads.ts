import type { UploadProps } from 'antd';
import type { ApiResponse, UploadResponse } from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function uploadImages(files: Blob[]) {
  const body = new FormData();
  files.forEach((file) => body.append('files', file));
  const res = (await axiosClient.post('/uploads', body)) as ApiResponse<UploadResponse>;
  return res.data.urls;
}

/** customRequest cho AntD Upload: upload từng file, response của file = URL ảnh. */
export const antdUploadRequest: NonNullable<UploadProps['customRequest']> = ({
  file,
  onSuccess,
  onError,
}) => {
  uploadImages([file as Blob])
    .then(([url]) => onSuccess?.(url))
    .catch((error: Error) => onError?.(error));
};

/** Tối đa của POST /uploads/video (VIDEO_MAX_MB bên API). */
export const VIDEO_MAX_MB = 50;

/** Tải 1 video tin đăng; `onProgress` nhận % đã gửi. */
export async function uploadVideo(file: Blob, onProgress?: (percent: number) => void) {
  const body = new FormData();
  body.append('file', file);
  const res = (await axiosClient.post('/uploads/video', body, {
    onUploadProgress: (event) =>
      event.total && onProgress?.(Math.round((event.loaded / event.total) * 100)),
  })) as ApiResponse<{ url: string }>;
  return res.data.url;
}
