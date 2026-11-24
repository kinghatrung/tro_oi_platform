import type {
  ApiResponse,
  CreateSavedSearchRequest,
  Listing,
  ProductItem,
  SavedSearch,
  UpdateProfileRequest,
  User,
} from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function getMe() {
  const res = (await axiosClient.get('/users/me')) as ApiResponse<User>;
  return res.data;
}

export async function updateMe(body: UpdateProfileRequest) {
  const res = (await axiosClient.patch('/users/me', body)) as ApiResponse<User>;
  return res.data;
}

export async function getUser(id: string) {
  const res = (await axiosClient.get(`/users/${id}`)) as ApiResponse<User>;
  return res.data;
}

export async function getFavorites() {
  const res = (await axiosClient.get('/users/me/favorites')) as ApiResponse<Listing[]>;
  return res.data;
}

export async function addFavorite(listingId: string) {
  await axiosClient.put(`/users/me/favorites/${listingId}`);
}

export async function removeFavorite(listingId: string) {
  await axiosClient.delete(`/users/me/favorites/${listingId}`);
}

/** Tin đã xem gần đây của tài khoản (đồng bộ giữa thiết bị), mới xem trước. */
export async function getViewedListings() {
  const res = (await axiosClient.get('/users/me/viewed-listings')) as ApiResponse<Listing[]>;
  return res.data;
}

export async function recordViewedListing(listingId: string) {
  await axiosClient.put(`/users/me/viewed-listings/${listingId}`);
}

export async function getViewedProducts() {
  const res = (await axiosClient.get('/users/me/viewed-products')) as ApiResponse<ProductItem[]>;
  return res.data;
}

export async function recordViewedProduct(productId: string) {
  await axiosClient.put(`/users/me/viewed-products/${productId}`);
}

export async function getFavoriteProducts() {
  const res = (await axiosClient.get('/users/me/favorite-products')) as ApiResponse<ProductItem[]>;
  return res.data;
}

export async function addFavoriteProduct(productId: string) {
  await axiosClient.put(`/users/me/favorite-products/${productId}`);
}

export async function removeFavoriteProduct(productId: string) {
  await axiosClient.delete(`/users/me/favorite-products/${productId}`);
}

export async function getSavedSearches() {
  const res = (await axiosClient.get('/users/me/saved-searches')) as ApiResponse<SavedSearch[]>;
  return res.data;
}

export async function createSavedSearch(body: CreateSavedSearchRequest) {
  const res = (await axiosClient.post(
    '/users/me/saved-searches',
    body,
  )) as ApiResponse<SavedSearch>;
  return res.data;
}

export async function deleteSavedSearch(id: string) {
  await axiosClient.delete(`/users/me/saved-searches/${id}`);
}

/** Gộp tài khoản khác (token Firebase của nó chứng minh sở hữu) vào tài khoản đang đăng nhập. */
export async function mergeAccount(firebaseToken: string) {
  const res = (await axiosClient.post('/users/me/merge', { firebaseToken })) as ApiResponse<User>;
  return res.data;
}

/** Toàn bộ dữ liệu của tôi (JSON) — trang cá nhân lưu thành file. */
export async function exportMyData() {
  const res = (await axiosClient.get('/users/me/export')) as ApiResponse<unknown>;
  return res.data;
}

/** Tự xoá tài khoản (ẩn danh hoá). `confirm` phải đúng chuỗi xác nhận của API. */
export async function deleteMyAccount(confirm: string) {
  await axiosClient.delete('/users/me', { data: { confirm } });
}
