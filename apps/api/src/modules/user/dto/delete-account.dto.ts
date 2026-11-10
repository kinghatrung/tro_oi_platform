import { Equals } from 'class-validator';

/** Chuỗi người dùng phải gõ để xác nhận (web hiển thị y hệt). */
export const DELETE_ACCOUNT_CONFIRMATION = 'XOA TAI KHOAN';

export class DeleteAccountDto {
  @Equals(DELETE_ACCOUNT_CONFIRMATION, {
    message: `Gõ đúng "${DELETE_ACCOUNT_CONFIRMATION}" để xác nhận`,
  })
  confirm: string;
}
