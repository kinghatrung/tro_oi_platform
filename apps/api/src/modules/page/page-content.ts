/** Khối hiển thị của trang nội dung — web render thành chữ thuần, không HTML. */
export type ContentBlock =
  { type: 'h2' | 'h3' | 'p'; text: string } | { type: 'ul'; items: string[] };

/**
 * Văn bản admin soạn → khối: "# " / "## " = h2, "### " = h3, "- " hoặc "* " = gạch đầu dòng,
 * dòng trống = sang đoạn mới, các dòng liền nhau gộp thành 1 đoạn.
 */
export function parseContent(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) blocks.push({ type: 'p', text: paragraph.join(' ') });
    paragraph = [];
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    const item = /^[-*]\s+(.+)$/.exec(line);
    if (!line) {
      flush();
    } else if (heading) {
      flush();
      blocks.push({
        type: heading[1].length === 3 ? 'h3' : 'h2',
        text: heading[2],
      });
    } else if (item) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.type === 'ul') last.items.push(item[1]);
      else blocks.push({ type: 'ul', items: [item[1]] });
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
