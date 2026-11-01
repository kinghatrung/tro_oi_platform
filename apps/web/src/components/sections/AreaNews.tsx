import type { ListingStat } from '@tro-oi/shared';

import { SectionNews } from './SectionNews';

/** Displays the area-based property news section. */
export function AreaNews({ stats }: { stats: ListingStat[] }) {
  return <SectionNews title="Tìm theo khu vực" stats={stats} />;
}
