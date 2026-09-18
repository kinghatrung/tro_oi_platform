'use client';

import dynamic from 'next/dynamic';

/** Loads the browser-only location map without server-side rendering. */
export const LocationMap = dynamic(() => import('./LocationMap').then((mod) => mod.LocationMap), {
  ssr: false,
});

export * from './FloatingInput';
export * from './CardItem';
export * from './CarouselItem';
export * from './LocationCard';
export * from './ButtonDropdown';
export * from './CardDropdown';
export * from './PaginationControl';
