import { IsNotEmpty, IsString } from 'class-validator';

export class SocialLoginDto {
  /** Firebase ID token sau khi đăng nhập Google / Facebook ở frontend (signInWithPopup). */
  @IsString()
  @IsNotEmpty()
  firebaseToken: string;
}
