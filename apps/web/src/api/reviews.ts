import type {
  ApiResponse,
  MyReviewStatus,
  Review,
  ReviewPage,
  UpsertReviewRequest,
} from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function getReviews(userId: string, page = 1, pageSize?: number) {
  const res = (await axiosClient.get('/reviews', {
    params: { userId, page, pageSize },
  })) as ApiResponse<ReviewPage>;
  return res.data;
}

export async function getMyReview(userId: string) {
  const res = (await axiosClient.get('/reviews/mine', {
    params: { userId },
  })) as ApiResponse<MyReviewStatus>;
  return res.data;
}

export async function upsertReview(body: UpsertReviewRequest) {
  const res = (await axiosClient.put('/reviews', body)) as ApiResponse<Review>;
  return res.data;
}

export async function deleteReview(id: string) {
  await axiosClient.delete(`/reviews/${id}`);
}
