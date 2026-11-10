import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { PROVINCES } from '../../../common/provinces.js';
import {
  GeoPointDto,
  IMAGE_URL_PATTERN,
} from '../../listing/dto/listing.dto.js';
import {
  PRODUCT_CATEGORIES,
  PRODUCT_CONDITIONS,
  PRODUCT_STATUSES,
  type ProductCategory,
  type ProductCondition,
  type ProductStatus,
} from '../schemas/product.schema.js';

export class SearchProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @IsOptional()
  @IsIn(PRODUCT_CATEGORIES)
  category?: ProductCategory;

  @IsOptional()
  @IsIn(PRODUCT_CONDITIONS)
  condition?: ProductCondition;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsMongoId()
  sellerId?: string;

  @IsOptional()
  @IsMongoId()
  excludeId?: string;

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
  pageSize: number = 12;

  @IsOptional()
  @IsIn(['createdAt', 'price'])
  sortBy: 'createdAt' | 'price' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'desc';
}

class ProductAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  /** Quận/huyện — chỉ còn ở dữ liệu trước 1/7/2025 (mô hình 3 cấp), form mới không gửi. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsIn(PROVINCES, { message: 'Vui lòng chọn tỉnh/thành phố' })
  city: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  geo?: GeoPointDto;
}

export class CreateProductDto {
  @IsString()
  @Length(5, 120, { message: 'Tiêu đề phải từ 5 đến 120 ký tự' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(3000)
  description?: string;

  @IsIn(PRODUCT_CATEGORIES)
  category: ProductCategory;

  @IsIn(PRODUCT_CONDITIONS)
  condition: ProductCondition;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsBoolean()
  isNegotiable?: boolean;

  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 ảnh' })
  @ArrayMaxSize(10)
  @Matches(IMAGE_URL_PATTERN, { each: true, message: 'URL ảnh không hợp lệ' })
  images: string[];

  @ValidateNested()
  @Type(() => ProductAddressDto)
  address: ProductAddressDto;
}

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsOptional()
  @IsIn(PRODUCT_STATUSES)
  status?: ProductStatus;

  /** Admin: lý do từ chối / ẩn (vào thông báo cho chủ tin + nhật ký). Người khác gửi → bỏ qua. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  moderationNote?: string;
}
