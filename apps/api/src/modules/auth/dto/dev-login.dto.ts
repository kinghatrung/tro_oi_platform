import { Matches } from 'class-validator';

export class DevLoginDto {
  @Matches(/^(0|\+84)(3|5|7|8|9)\d{8}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phone: string;
}
