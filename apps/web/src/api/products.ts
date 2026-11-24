import type {
  ApiResponse,
  CreateProductRequest,
  PagedResponse,
  ProductItem,
  SearchProductRequest,
  SitemapChunk,
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

/** 1 phần sitemap món đang bán (id, ngày sửa, ảnh đầu). */
export async function getProductSitemap(chunk: number) {
  const res = (await axiosClient.get('/products/sitemap', {
    params: { chunk },
  })) as ApiResponse<SitemapChunk>;
  return res.data;
}

/** Báo đã xem món đồ (gọi từ trình duyệt; API chống đếm trùng / bot). */
export async function countProductView(id: string) {
  await axiosClient.post(`/products/${id}/view`);
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
