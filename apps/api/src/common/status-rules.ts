import { ForbiddenException } from '@nestjs/common';

/**
 * Chủ tin (không phải admin) chỉ được chuyển giữa các trạng thái trong `ownerStatuses`
 * và không được tự đổi trạng thái tin đang chờ duyệt (tránh tự duyệt khi bật kiểm duyệt).
 */
export function assertOwnerStatusChange(
  current: string,
  next: string | undefined,
  ownerStatuses: readonly string[],
  isAdmin: boolean,
) {
  if (isAdmin || next === undefined || next === current) return;
  if (current === 'pending') {
    throw new ForbiddenException('Tin đang chờ duyệt, chưa thể đổi trạng thái');
  }
  if (!ownerStatuses.includes(next)) {
    throw new ForbiddenException('Không thể chuyển tin sang trạng thái này');
  }
}
