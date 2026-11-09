import { PageSlug } from '@tro-oi/shared';

import { ContentPage, contentPageMetadata } from '@/components/sections/ContentPage';

/** Nội dung do admin soạn ở /quan-tri/trang-chinh-sach; chưa đăng → 404. */
export const generateMetadata = () => contentPageMetadata(PageSlug.PRIVACY);

export default function PrivacyPage() {
  return <ContentPage slug={PageSlug.PRIVACY} />;
}
