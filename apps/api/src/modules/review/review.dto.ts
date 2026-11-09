import { Type } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { REVIEW_COMMENT_MAX } from './review.schema.js';

export class ReviewQueryDto {
  @IsMongoId({ message: 'Người dùng không hợp lệ' })
  userId: string;

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
}

export class MyReviewQueryDto {
  @IsMongoId({ message: 'Người dùng không hợp lệ' })
  userId: string;
}

export class UpsertReviewDto {
  /** Người được đánh giá. */
  @IsMongoId({ message: 'Người dùng không hợp lệ' })
  userId: string;

  @Type(() => Number)
  @IsInt({ message: 'Chọn số sao từ 1 đến 5' })
  @Min(1, { message: 'Chọn số sao từ 1 đến 5' })
  @Max(5, { message: 'Chọn số sao từ 1 đến 5' })
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(REVIEW_COMMENT_MAX, {
    message: `Nhận xét tối đa ${REVIEW_COMMENT_MAX} ký tự`,
  })
  comment?: string;
}
