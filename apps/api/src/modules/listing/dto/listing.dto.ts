import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import {
  AMENITIES,
  DIRECTIONS,
  FURNISHING_STATUSES,
  LISTING_CATEGORIES,
  LISTING_STATUSES,
  TRANSACTION_TYPES,
  type Amenity,
  type Direction,
  type FurnishingStatus,
  type ListingCategory,
  type ListingStatus,
  type TransactionType,
} from '../schemas/listing.schema.js';
import { PROVINCES } from '../../../common/provinces.js';

/** URL tuyệt đối http(s) hoặc đường dẫn gốc "/..." (ảnh mẫu của web). */
export const IMAGE_URL_PATTERN = /^(https?:\/\/|\/)\S+$/;

/** Link YouTube: watch?v=, youtu.be/, shorts/, embed/ (id 11 ký tự). Web nhúng qua youtube-nocookie. */
export const YOUTUBE_URL_PATTERN =
  /^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/)|youtu\.be\/)[\w-]{11}([?&#]\S*)?$/;

export const LISTING_SORT_FIELDS = ['createdAt', 'price', 'area'] as const;

export class SearchListingDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  keyword?: string;

  @IsOptional()
  @IsIn(TRANSACTION_TYPES)
  transaction?: TransactionType;

  @IsOptional()
  @IsIn(LISTING_CATEGORIES)
  category?: ListingCategory;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  /** Phường/xã — khớp chính xác (vd "Phường Cầu Giấy"). */
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
  @Type(() => Number)
  @Min(0)
  minArea?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  maxArea?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms?: number;

  /** "wifi,parking" → tin có đủ cả hai. */
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : value,
  )
  @IsArray()
  @IsIn(AMENITIES, { each: true })
  amenities?: Amenity[];

  @IsOptional()
  @IsMongoId()
  authorId?: string;

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
  pageSize: number = 10;

  @IsOptional()
  @IsIn(LISTING_SORT_FIELDS)
  sortBy: (typeof LISTING_SORT_FIELDS)[number] = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'desc';
}

class GeoPointDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}

class AddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng chọn phường/xã' })
  @MaxLength(100)
  ward: string;

  /** Quận/huyện — chỉ còn ở dữ liệu trước 1/7/2025 (mô hình 3 cấp), form mới không gửi. */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsIn(PROVINCES, { message: 'Vui lòng chọn tỉnh/thành phố' })
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  fullAddress?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  geo?: GeoPointDto;
}

export class CreateListingDto {
  @IsString()
  @Length(10, 150, { message: 'Tiêu đề phải từ 10 đến 150 ký tự' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  /** Link YouTube; "" = gỡ video khi sửa tin. */
  @IsOptional()
  @ValidateIf((_, value) => value !== '')
  @Matches(YOUTUBE_URL_PATTERN, {
    message:
      'Link video phải là link YouTube (youtube.com/watch?v=..., youtu.be/..., shorts)',
  })
  videoUrl?: string;

  @IsIn(LISTING_CATEGORIES)
  category: ListingCategory;

  @IsIn(TRANSACTION_TYPES)
  transaction: TransactionType;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  area?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bedrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  bathrooms?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  floorCount?: number;

  @IsOptional()
  @IsIn(DIRECTIONS)
  direction?: Direction;

  @IsOptional()
  @IsIn(FURNISHING_STATUSES)
  furnishing?: FurnishingStatus;

  @IsOptional()
  @IsArray()
  @IsIn(AMENITIES, { each: true, message: 'Tiện ích không hợp lệ' })
  amenities?: Amenity[];

  @IsArray()
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 ảnh' })
  @ArrayMaxSize(20)
  @Matches(IMAGE_URL_PATTERN, { each: true, message: 'URL ảnh không hợp lệ' })
  images: string[];

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}

export class UpdateListingDto extends PartialType(CreateListingDto) {
  @IsOptional()
  @IsIn(LISTING_STATUSES)
  status?: ListingStatus;
}
