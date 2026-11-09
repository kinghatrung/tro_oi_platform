import { PageSlug } from '@tro-oi/shared';

import { ContentPage, contentPageMetadata } from '@/components/sections/ContentPage';

/** Nội dung do admin soạn ở /quan-tri/trang-chinh-sach; chưa đăng → 404. */
export const generateMetadata = () => contentPageMetadata(PageSlug.TERMS);

export default function TermsPage() {
  return <ContentPage slug={PageSlug.TERMS} />;
}
