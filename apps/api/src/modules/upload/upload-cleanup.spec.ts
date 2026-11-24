import {
  findOrphans,
  ORPHAN_MIN_AGE_MS,
  uploadedAt,
} from './upload-cleanup.service.js';

const NOW = 1_800_000_000_000;
const old = `${NOW - ORPHAN_MIN_AGE_MS - 1}-ab12cd.jpg`;
const fresh = `${NOW - 60_000}-ef34ab.jpg`;

describe('UploadCleanupService — chọn file mồ côi', () => {
  it('đọc thời điểm từ tên do API sinh; tên lạ → null', () => {
    expect(uploadedAt('1730450000000-ab12cd.mp4')).toBe(1_730_450_000_000);
    expect(uploadedAt('logo.png')).toBeNull();
    expect(uploadedAt('../1730450000000-ab12cd.jpg')).toBeNull();
  });

  it('chỉ xoá file không ai dùng, tên do API sinh và quá 7 ngày', () => {
    const used = `${NOW - ORPHAN_MIN_AGE_MS * 2}-aaaaaa.png`;
    expect(
      findOrphans([old, fresh, used, 'manual.jpg'], new Set([used]), NOW),
    ).toEqual([old]);
  });
});
