'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/** false khi render server / hydrate, true sau đó — đọc localStorage mà không lệch HTML. */
export const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
