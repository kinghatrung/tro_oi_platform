import type { CreateReportRequest } from '@tro-oi/shared';

import axiosClient from './axiosClient';

export async function createReport(body: CreateReportRequest) {
  await axiosClient.post('/reports', body);
}
