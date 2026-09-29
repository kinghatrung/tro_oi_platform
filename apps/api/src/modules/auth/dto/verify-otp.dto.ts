import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyOtpDto {
  /** Firebase ID token từ frontend sau khi xác minh OTP thành công. */
  @IsString()
  @IsNotEmpty()
  firebaseToken: string;
}
