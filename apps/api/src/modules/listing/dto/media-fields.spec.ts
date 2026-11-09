import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpdateProfileDto } from '../../user/dto/update-profile.dto.js';
import { UpdateListingDto } from './listing.dto.js';

const listingErrors = (videoUrl: string) =>
  validateSync(plainToInstance(UpdateListingDto, { videoUrl }));
const profileErrors = (coverImage: string) =>
  validateSync(plainToInstance(UpdateProfileDto, { coverImage }));

describe('Video tin đăng / ảnh bìa hồ sơ', () => {
  it.each([
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ?t=30',
    'https://m.youtube.com/shorts/dQw4w9WgXcQ',
    '', // gỡ video
  ])('videoUrl hợp lệ: %s', (url) => {
    expect(listingErrors(url)).toHaveLength(0);
  });

  it.each([
    'http://www.youtube.com/watch?v=dQw4w9WgXcQ', // không https
    'https://vimeo.com/123456',
    'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ',
    'javascript:alert(1)',
  ])('videoUrl bị từ chối: %s', (url) => {
    expect(listingErrors(url)).not.toHaveLength(0);
  });

  it('coverImage: URL ảnh hoặc "" (gỡ); chuỗi lạ bị từ chối', () => {
    expect(profileErrors('http://localhost:5000/uploads/a.jpg')).toHaveLength(
      0,
    );
    expect(profileErrors('')).toHaveLength(0);
    expect(profileErrors('javascript:alert(1)')).not.toHaveLength(0);
  });
});
