import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { UpdateProductDto } from './product.dto.js';

const addressErrors = (geo: unknown) =>
  validateSync(
    plainToInstance(UpdateProductDto, {
      address: { city: 'Hà Nội', geo },
    }),
  );

describe('Vị trí món đồ (address.geo)', () => {
  it('không ghim hoặc toạ độ hợp lệ → qua', () => {
    expect(addressErrors(undefined)).toHaveLength(0);
    expect(addressErrors({ latitude: 21.03, longitude: 105.8 })).toHaveLength(
      0,
    );
  });

  it.each([
    { latitude: 91, longitude: 105.8 },
    { latitude: 21.03, longitude: -181 },
    { latitude: '21', longitude: 105.8 },
    { latitude: 21.03 },
  ])('toạ độ sai bị từ chối: %j', (geo) => {
    expect(addressErrors(geo)).not.toHaveLength(0);
  });
});
