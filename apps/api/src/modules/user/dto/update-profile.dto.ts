import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { IMAGE_URL_PATTERN } from '../../listing/dto/listing.dto.js';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(2, 50, { message: 'Tên phải từ 2 đến 50 ký tự' })
  name?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @Matches(IMAGE_URL_PATTERN, { message: 'URL ảnh đại diện không hợp lệ' })
  avatar?: string;

  /** Ảnh bìa hồ sơ; "" = gỡ, dùng lại dải màu mặc định. */
  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @Matches(IMAGE_URL_PATTERN, { message: 'URL ảnh bìa không hợp lệ' })
  coverImage?: string;
}
