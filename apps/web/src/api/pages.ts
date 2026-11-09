import type { ApiResponse, PageSlug, PageSummary, PublicPage } from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function getPublishedPages() {
  const res = (await axiosClient.get('/pages')) as ApiResponse<PageSummary[]>;
  return res.data;
}

export async function getPage(slug: PageSlug) {
  const res = (await axiosClient.get(`/pages/${slug}`)) as ApiResponse<PublicPage>;
  return res.data;
}
