import { IsString, Length, Matches, MaxLength } from 'class-validator';

export class UpsertPageDto {
  @IsString()
  @Length(2, 100, { message: 'Tiêu đề từ 2 đến 100 ký tự' })
  title: string;

  /** "" = gỡ trang (web 404). Chặn công bố bản nháp còn ô [[...]] chưa điền. */
  @IsString()
  @MaxLength(50_000, { message: 'Nội dung tối đa 50.000 ký tự' })
  @Matches(/^(?![\s\S]*\[\[)/, {
    message:
      'Nội dung còn mục [[...]] chưa điền — điền hoặc xoá trước khi đăng',
  })
  content: string;
}
