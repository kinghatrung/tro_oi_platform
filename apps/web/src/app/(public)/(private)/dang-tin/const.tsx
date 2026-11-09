import {
  DIRECTION_LABELS,
  FURNISHING_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
} from '@tro-oi/shared';

import { PROVINCES } from '@/constants';

const toOptions = <TValue extends string>(labels: Record<TValue, string>) =>
  (Object.entries(labels) as [TValue, string][]).map(([value, label]) => ({ value, label }));

export const TRANSACTION_OPTIONS = toOptions(TRANSACTION_TYPE_LABELS);
export const DIRECTION_OPTIONS = toOptions(DIRECTION_LABELS);
export const FURNISHING_OPTIONS = toOptions(FURNISHING_STATUS_LABELS);
export const CITY_OPTIONS = PROVINCES.map((city) => ({ value: city, label: city }));

export const MAX_IMAGES = 20;
