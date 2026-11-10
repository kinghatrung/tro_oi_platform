import type { Types } from 'mongoose';

import type { AuditService } from '../modules/audit/audit.service.js';
import type {
  NotificationInput,
  NotificationService,
} from '../modules/notification/notification.service.js';
import type { AuthUser } from './current-user.decorator.js';

export type ModerationTarget = 'listing' | 'product';

const NOUN: Record<ModerationTarget, string> = {
  listing: 'Tin',
  product: 'Món đồ',
};
const MANAGE_LINK: Record<ModerationTarget, string> = {
  listing: '/kenh-nguoi-dang/tin-dang',
  product: '/kenh-nguoi-dang/do-ban',
};
const PUBLIC_LINK: Record<ModerationTarget, (id: string) => string> = {
  listing: (id) => `/phong-tro/${id}`,
  product: (id) => `/cho-oi/${id}`,
};

/**
 * Admin đổi trạng thái / xoá tin của người khác → nhãn nhật ký + thông báo cho chủ tin.
 * `to` = null: tin bị xoá. Không đổi trạng thái (chỉ sửa nội dung) → null.
 */
export function describeModeration(
  target: ModerationTarget,
  item: { id: string; title: string },
  from: string,
  to: string | null,
  /** Lý do admin nhập khi từ chối / ẩn — nối vào lời thông báo. */
  note?: string,
): { action: string; notice: NotificationInput } | null {
  if (from === to) return null;
  const result = describeChange(target, item, from, to);
  if (note && to !== 'active') {
    result.notice = {
      ...result.notice,
      message: `${result.notice.message} Lý do: ${note}`,
    };
  }
  return result;
}

/**
 * Lý do lưu trên tin sau khi đổi trạng thái: hiển thị lại → xoá; admin từ chối / ẩn tin người khác
 * → lý do mới (bỏ trống = xoá lý do cũ); còn lại (chủ tin tự đổi, chỉ sửa nội dung) → giữ nguyên.
 */
export function nextModerationNote(
  actor: AuthUser,
  owner: Types.ObjectId,
  from: string,
  to: string,
  note: string | undefined,
  current: string | undefined,
): string | undefined {
  if (to === 'active') return undefined;
  if (from === to || actor.role !== 'admin' || owner.equals(actor.sub)) {
    return current;
  }
  return note?.trim() || undefined;
}

function describeChange(
  target: ModerationTarget,
  item: { id: string; title: string },
  from: string,
  to: string | null,
): { action: string; notice: NotificationInput } {
  const noun = NOUN[target];
  const name = `"${item.title}"`;
  const manage = MANAGE_LINK[target];

  if (to === null) {
    return {
      action: 'Xoá',
      notice: {
        kind: 'error',
        title: `${noun} đã bị xoá`,
        message: `${name} đã bị quản trị viên xoá.`,
        link: manage,
      },
    };
  }
  if (to === 'active') {
    const approved = from === 'pending';
    return {
      action: approved ? 'Duyệt' : 'Hiển thị lại',
      notice: {
        kind: 'success',
        title: `${noun} ${approved ? 'đã được duyệt' : 'được hiển thị lại'}`,
        message: `${name} đang hiển thị công khai.`,
        link: PUBLIC_LINK[target](item.id),
      },
    };
  }
  if (from === 'pending') {
    return {
      action: 'Từ chối',
      notice: {
        kind: 'error',
        title: `${noun} không được duyệt`,
        message: `${name} chưa đạt yêu cầu nên không được hiển thị.`,
        link: manage,
      },
    };
  }
  if (to === 'closed') {
    return {
      action: 'Ẩn',
      notice: {
        kind: 'warning',
        title: `${noun} đã bị ẩn`,
        message: `${name} đã bị quản trị viên ẩn khỏi trang công khai.`,
        link: manage,
      },
    };
  }
  return {
    action: `Đổi trạng thái: ${to}`,
    notice: {
      kind: 'info',
      title: `${noun} đã được cập nhật`,
      message: `Quản trị viên đã cập nhật trạng thái ${name}.`,
      link: manage,
    },
  };
}

/** Admin xử lý tin của người khác → ghi nhật ký + báo chủ tin. Chủ tin (kể cả admin) tự làm → bỏ qua. */
export async function recordModeration(
  services: { audit: AuditService; notification: NotificationService },
  actor: AuthUser,
  target: ModerationTarget,
  owner: Types.ObjectId,
  item: { id: string; title: string },
  from: string,
  to: string | null,
  note?: string,
) {
  if (actor.role !== 'admin' || owner.equals(actor.sub)) return;
  const result = describeModeration(target, item, from, to, note);
  if (!result) return;
  await Promise.all([
    services.audit.log(actor.sub, {
      action: result.action,
      targetType: target,
      targetId: item.id,
      targetTitle: item.title,
      ...(note && to !== 'active' && { note }),
    }),
    services.notification.notify([{ user: owner, input: result.notice }]),
  ]);
}
