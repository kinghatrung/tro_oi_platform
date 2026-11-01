import type {
  ApiResponse,
  CreateListingRequest,
  Listing,
  ListingStat,
  PagedResponse,
  SearchListingRequest,
  UpdateListingRequest,
} from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function searchListings(params: SearchListingRequest) {
  const res = (await axiosClient.get('/listings', { params })) as ApiResponse<
    PagedResponse<Listing>
  >;
  return res.data;
}

export async function getListingStats() {
  const res = (await axiosClient.get('/listings/stats')) as ApiResponse<ListingStat[]>;
  return res.data;
}

export async function getMyListings() {
  const res = (await axiosClient.get('/listings/mine')) as ApiResponse<Listing[]>;
  return res.data;
}

export async function getListing(id: string) {
  const res = (await axiosClient.get(`/listings/${id}`)) as ApiResponse<Listing>;
  return res.data;
}

export async function createListing(body: CreateListingRequest) {
  const res = (await axiosClient.post('/listings', body)) as ApiResponse<Listing>;
  return res.data;
}

export async function updateListing(id: string, body: UpdateListingRequest) {
  const res = (await axiosClient.patch(`/listings/${id}`, body)) as ApiResponse<Listing>;
  return res.data;
}

export async function deleteListing(id: string) {
  await axiosClient.delete(`/listings/${id}`);
}
