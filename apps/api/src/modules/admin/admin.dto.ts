import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { USER_ROLES, type UserRole } from '../auth/schemas/user.schema.js';
import { SearchListingDto } from '../listing/dto/listing.dto.js';
import {
  LISTING_STATUSES,
  type ListingStatus,
} from '../listing/schemas/listing.schema.js';
import { SearchProductDto } from '../product/dto/product.dto.js';
import {
  PRODUCT_STATUSES,
  type ProductStatus,
} from '../product/schemas/product.schema.js';

/** Query string "true"/"false" → boolean. */
const toBoolean = ({ value }: { value: unknown }) =>
  value === 'true' ? true : value === 'false' ? false : value;

export class AdminUserQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRole;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 20;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsIn(USER_ROLES)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

/** Như tìm kiếm công khai nhưng xem được mọi trạng thái. */
export class AdminListingQueryDto extends SearchListingDto {
  @IsOptional()
  @IsIn(LISTING_STATUSES)
  status?: ListingStatus;
}

export class AdminProductQueryDto extends SearchProductDto {
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatus;
}
