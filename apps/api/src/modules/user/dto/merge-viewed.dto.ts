import { ArrayMaxSize, IsArray, IsMongoId, IsOptional } from 'class-validator';

/** Lịch sử xem lúc chưa đăng nhập (mới xem trước) — POST /users/me/viewed. */
export class MergeViewedDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsMongoId({ each: true })
  listingIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(15)
  @IsMongoId({ each: true })
  productIds?: string[];
}
