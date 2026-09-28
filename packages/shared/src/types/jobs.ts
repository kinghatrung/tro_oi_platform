import type { AddressInfo, BaseListRequest } from './common';

/** Hình thức công việc. */
export enum JobType {
  FULL_TIME = 'full-time',
  PART_TIME = 'part-time',
  FREELANCE = 'freelance',
  INTERNSHIP = 'internship'
}

/** Nhãn hiển thị tiếng Việt cho JobType. */
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  [JobType.FULL_TIME]: 'Toàn thời gian',
  [JobType.PART_TIME]: 'Bán thời gian',
  [JobType.FREELANCE]: 'Freelance',
  [JobType.INTERNSHIP]: 'Thực tập'
};

/** Đơn vị trả lương. */
export enum SalaryUnit {
  MONTH = 'month',
  HOUR = 'hour'
}

/** Tin tuyển dụng (hướng đến sinh viên/người đi làm xa). */
export interface Job {
  id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  description?: string;
  type: JobType;
  /** Lương tối thiểu, đơn vị VND. */
  salaryMin?: number;
  /** Lương tối đa, đơn vị VND. */
  salaryMax?: number;
  salaryUnit?: SalaryUnit;
  address?: AddressInfo;
  contactPhone?: string;
  contactEmail?: string;
  /** ISO 8601 — thời điểm tin tuyển dụng hết hạn. */
  expiresAt?: string;
  /** ISO 8601. */
  createdAt: string;
  /** ISO 8601. */
  updatedAt: string;
}

/** Tham số tìm kiếm/lọc tin tuyển dụng. */
export interface SearchJobRequest extends BaseListRequest {
  keyword?: string;
  type?: JobType;
  city?: string;
  district?: string;
}
