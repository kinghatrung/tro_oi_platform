import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

import { WARDS } from './wards.js';

/** Phường/xã có thuộc tỉnh/thành không (tên đầy đủ như "Phường Cầu Giấy"). */
export const isWardOf = (ward: unknown, city: unknown) =>
  typeof ward === 'string' &&
  typeof city === 'string' &&
  (WARDS[city]?.includes(ward) ?? false);

/**
 * `ward` phải thuộc tỉnh/thành ở field `cityField` cùng object (danh sách TỰ SINH, mô hình 2 cấp).
 * Field rỗng / không gửi để @IsOptional / @IsNotEmpty xử lý.
 */
export function IsWardOf(cityField: string, options?: ValidationOptions) {
  return (target: object, propertyName: string) =>
    registerDecorator({
      name: 'isWardOf',
      target: target.constructor,
      propertyName,
      constraints: [cityField],
      options: {
        message: 'Phường/xã không thuộc tỉnh/thành đã chọn',
        ...options,
      },
      validator: {
        validate: (value: unknown, args: ValidationArguments) =>
          value === undefined ||
          value === '' ||
          isWardOf(value, (args.object as Record<string, unknown>)[cityField]),
      },
    });
}
