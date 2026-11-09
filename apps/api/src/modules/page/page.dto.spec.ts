import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpsertPageDto } from './page.dto.js';

const errors = (content: string) =>
  validateSync(
    plainToInstance(UpsertPageDto, { title: 'Điều khoản', content }),
  );

describe('UpsertPageDto', () => {
  it('chặn bản nháp còn ô [[...]] chưa điền', () => {
    expect(errors('Đơn vị vận hành: [[Tên đơn vị]]')).not.toHaveLength(0);
  });

  it('nội dung đã điền / rỗng (gỡ trang) hợp lệ', () => {
    expect(errors('## Điều 1\nNội dung [ghi chú] bình thường')).toHaveLength(0);
    expect(errors('')).toHaveLength(0);
  });
});
