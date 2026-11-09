import { parseContent } from './page-content.js';

describe('parseContent', () => {
  it('tiêu đề, đoạn văn (gộp dòng liền nhau), danh sách', () => {
    const text = [
      '# Điều 1',
      'Dòng một',
      'dòng hai.',
      '',
      '### 1.1 Mục nhỏ',
      '- A',
      '* B',
      'Đoạn sau danh sách',
    ].join('\r\n');
    expect(parseContent(text)).toEqual([
      { type: 'h2', text: 'Điều 1' },
      { type: 'p', text: 'Dòng một dòng hai.' },
      { type: 'h3', text: '1.1 Mục nhỏ' },
      { type: 'ul', items: ['A', 'B'] },
      { type: 'p', text: 'Đoạn sau danh sách' },
    ]);
  });

  it('HTML giữ nguyên là chữ (web không render HTML)', () => {
    expect(parseContent('<script>alert(1)</script>')).toEqual([
      { type: 'p', text: '<script>alert(1)</script>' },
    ]);
  });

  it('rỗng → không có khối', () => {
    expect(parseContent('  \n\n ')).toEqual([]);
  });
});
