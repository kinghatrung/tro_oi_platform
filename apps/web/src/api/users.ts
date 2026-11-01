import type { ApiResponse, Listing, UpdateProfileRequest, User } from '@tro-oi/shared';

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
