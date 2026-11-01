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
