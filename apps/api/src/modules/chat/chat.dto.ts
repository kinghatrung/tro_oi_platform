import { Type } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsMongoId,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

/** Đúng 1 trong 2 id (kiểm tra ở ChatService). */
export class StartConversationDto {
  @IsOptional()
  @IsMongoId({ message: 'Tin đăng không hợp lệ' })
  listingId?: string;

  @IsOptional()
  @IsMongoId({ message: 'Món đồ không hợp lệ' })
  productId?: string;
}

export class MessagesQueryDto {
  /** Lấy tin cũ hơn mốc này (ISO 8601) — tải thêm lịch sử. */
  @IsOptional()
  @IsISO8601()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 30;
}
