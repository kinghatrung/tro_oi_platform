/** Trùng YOUTUBE_URL_PATTERN bên api (listing.dto.ts): watch?v=, youtu.be/, shorts/, embed/. */
export const YOUTUBE_URL_PATTERN =
  /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})([?&#]\S*)?$/;

/** Link YouTube → URL nhúng youtube-nocookie (không cookie theo dõi trước khi bấm phát). */
export function youtubeEmbedUrl(url?: string) {
  const id = url?.match(YOUTUBE_URL_PATTERN)?.[4];
  return id && `https://www.youtube-nocookie.com/embed/${id}`;
}
