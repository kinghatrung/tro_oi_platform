import type {
  AdminListingQuery,
  ListingMapPoint,
  AdminPage,
  AdminProductQuery,
  AdminReportQuery,
  AdminStats,
  AdminUpdateUserRequest,
  AdminUser,
  AdminUserQuery,
  ApiResponse,
  AuditLog,
  AuditLogQuery,
  Listing,
  PageSlug,
  PagedResponse,
  ProductItem,
  Report,
  ReportStatus,
  UpsertPageRequest,
  User,
  ProductMapPoint,
} from '@tro-oi/shared';

import axiosClient from './axiosClient';

/** Các thao tác chỉ dành cho admin (API /admin/*). Sửa/xoá tin dùng chung api/listings, api/products. */

export async function getAdminStats() {
  const res = (await axiosClient.get('/admin/stats')) as ApiResponse<AdminStats>;
  return res.data;
}

export async function searchAdminUsers(params: AdminUserQuery) {
  const res = (await axiosClient.get('/admin/users', { params })) as ApiResponse<
    PagedResponse<AdminUser>
  >;
  return res.data;
}

export async function updateAdminUser(id: string, body: AdminUpdateUserRequest) {
  const res = (await axiosClient.patch(`/admin/users/${id}`, body)) as ApiResponse<User>;
  return res.data;
}

export async function searchAdminListings(params: AdminListingQuery) {
  const res = (await axiosClient.get('/admin/listings', { params })) as ApiResponse<
    PagedResponse<Listing>
  >;
  return res.data;
}

/** Tin có toạ độ cho bản đồ quản trị (bỏ qua page/pageSize). */
export async function getAdminListingMap(params: AdminListingQuery) {
  const res = (await axiosClient.get('/admin/listings/map', { params })) as ApiResponse<
    ListingMapPoint[]
  >;
  return res.data;
}

/** Món Chợ ơi có toạ độ cho bản đồ quản trị (bỏ qua page/pageSize). */
export async function getAdminProductMap(params: AdminProductQuery) {
  const res = (await axiosClient.get('/admin/products/map', { params })) as ApiResponse<
    ProductMapPoint[]
  >;
  return res.data;
}

export async function searchAdminProducts(params: AdminProductQuery) {
  const res = (await axiosClient.get('/admin/products', { params })) as ApiResponse<
    PagedResponse<ProductItem>
  >;
  return res.data;
}

export async function searchAdminReports(params: AdminReportQuery) {
  const res = (await axiosClient.get('/admin/reports', { params })) as ApiResponse<
    PagedResponse<Report>
  >;
  return res.data;
}

export async function updateAdminReport(id: string, status: ReportStatus) {
  await axiosClient.patch(`/admin/reports/${id}`, { status });
}

export async function searchAuditLogs(params: AuditLogQuery) {
  const res = (await axiosClient.get('/admin/audit-logs', { params })) as ApiResponse<
    PagedResponse<AuditLog>
  >;
  return res.data;
}

export async function getAdminPage(slug: PageSlug) {
  const res = (await axiosClient.get(`/admin/pages/${slug}`)) as ApiResponse<AdminPage>;
  return res.data;
}

export async function updateAdminPage(slug: PageSlug, body: UpsertPageRequest) {
  const res = (await axiosClient.put(`/admin/pages/${slug}`, body)) as ApiResponse<AdminPage>;
  return res.data;
}
