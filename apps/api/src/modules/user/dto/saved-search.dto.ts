import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSavedSearchDto {
  /** Query string của /tim-kiem, vd "category=phong-tro&city=Hà+Nội". */
  @IsString()
  @MaxLength(1000)
  query: string;

  @IsString()
  @IsNotEmpty({ message: 'Thiếu tên tìm kiếm' })
  @MaxLength(200)
  title: string;
}
