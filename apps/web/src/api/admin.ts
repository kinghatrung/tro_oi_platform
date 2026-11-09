import type {
  AdminListingQuery,
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
  PagedResponse,
  ProductItem,
  Report,
  ReportStatus,
  User,
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
