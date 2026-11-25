import { useEffect } from 'react';
import type { FormInstance } from 'antd';

/**
 * Chỗ trang web "mở cửa" cho trợ lý AI thao tác (lib/assistantActions.ts): form điền sẵn được và
 * lệnh không bấm thẳng được (mở hộp báo cáo nằm trong menu, mở hộp sửa hồ sơ). Trang đăng ký khi
 * hiển thị, tự gỡ khi rời trang — trợ lý chỉ làm được việc trên trang đang mở.
 */

export type AssistantFormKey = 'listing' | 'product' | 'profile' | 'review' | 'report';
export type AssistantCommand = 'edit-profile' | 'report';
/** Tên field theo thứ tự hiện trên form; field lồng nhau dạng ['address', 'city']. */
export type FieldPath = string | readonly string[];

type Filler = (values: Record<string, unknown>) => Promise<void>;

const forms = new Map<AssistantFormKey, Filler>();
const commands = new Map<AssistantCommand, () => void>();

const STEP_MS = 450;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Giá trị theo đường dẫn field trong object trợ lý gửi; không có → undefined. */
const valueAt = (values: Record<string, unknown>, path: readonly string[]) =>
  path.reduce<unknown>(
    (current, key) =>
      current && typeof current === 'object'
        ? (current as Record<string, unknown>)[key]
        : undefined,
    values,
  );

/**
 * Điền từng ô theo thứ tự trên form, cuộn tới ô vừa điền — người dùng thấy trợ lý đang gõ hộ.
 * Chỉ field có trong `fields` (danh sách của trang) — giá trị lạ trợ lý gửi bị bỏ qua.
 */
async function fillStepByStep(
  form: FormInstance,
  fields: readonly FieldPath[],
  values: Record<string, unknown>,
) {
  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const filled: string[][] = [];
  for (const field of fields) {
    const path = typeof field === 'string' ? [field] : [...field];
    const value = valueAt(values, path);
    if (value === undefined) continue;
    form.setFieldValue(path, value);
    form.scrollToField(path, { block: 'center', behavior: isReduced ? 'auto' : 'smooth' });
    filled.push(path);
    await sleep(isReduced ? 120 : STEP_MS);
  }
  // Hiện lỗi ngay ở ô vừa điền nếu sai (vd tiêu đề quá ngắn); ô còn trống (ảnh…) không báo đỏ
  if (filled.length > 0) await form.validateFields(filled).catch(() => undefined);
}

/** Trang đăng ký form cho trợ lý điền sẵn (`enabled` = form đang hiện, vd hộp thoại đang mở). */
export function useAssistantForm(
  key: AssistantFormKey,
  form: FormInstance,
  fields: readonly FieldPath[],
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;
    const filler: Filler = (values) => fillStepByStep(form, fields, values);
    forms.set(key, filler);
    return () => {
      if (forms.get(key) === filler) forms.delete(key);
    };
  }, [enabled, fields, form, key]);
}

/** Trang đăng ký lệnh cho trợ lý (vd mở hộp báo cáo). `run` nên ổn định (useCallback). */
export function useAssistantCommand(name: AssistantCommand, run: () => void) {
  useEffect(() => {
    commands.set(name, run);
    return () => {
      if (commands.get(name) === run) commands.delete(name);
    };
  }, [name, run]);
}

export const assistantForm = (key: AssistantFormKey) => forms.get(key);
export const assistantCommand = (name: AssistantCommand) => commands.get(name);
