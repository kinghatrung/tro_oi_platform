import type {
  ApiResponse,
  CreateProductRequest,
  PagedResponse,
  ProductItem,
  SearchProductRequest,
  UpdateProductRequest,
} from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function searchProducts(params: SearchProductRequest) {
  const res = (await axiosClient.get('/products', { params })) as ApiResponse<
    PagedResponse<ProductItem>
  >;
  return res.data;
}

export async function getMyProducts() {
  const res = (await axiosClient.get('/products/mine')) as ApiResponse<ProductItem[]>;
  return res.data;
}

export async function getProduct(id: string) {
  const res = (await axiosClient.get(`/products/${id}`)) as ApiResponse<ProductItem>;
  return res.data;
}

export async function createProduct(body: CreateProductRequest) {
  const res = (await axiosClient.post('/products', body)) as ApiResponse<ProductItem>;
  return res.data;
}

export async function updateProduct(id: string, body: UpdateProductRequest) {
  const res = (await axiosClient.patch(`/products/${id}`, body)) as ApiResponse<ProductItem>;
  return res.data;
}

export async function deleteProduct(id: string) {
  await axiosClient.delete(`/products/${id}`);
}
