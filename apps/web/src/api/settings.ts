import type { ApiResponse, SiteSettings, UpdateSiteSettingsRequest } from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function getSiteSettings() {
  const res = (await axiosClient.get('/settings')) as ApiResponse<SiteSettings>;
  return res.data;
}

/** Chỉ admin. */
export async function updateSiteSettings(body: UpdateSiteSettingsRequest) {
  const res = (await axiosClient.put('/admin/settings', body)) as ApiResponse<SiteSettings>;
  return res.data;
}
