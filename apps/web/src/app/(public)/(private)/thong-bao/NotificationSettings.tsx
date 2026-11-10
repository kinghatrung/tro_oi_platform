'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { App, Switch } from 'antd';
import { BellRing, Mail, MessageSquareText, MonitorSmartphone } from 'lucide-react';
import type { NotificationPreferences } from '@tro-oi/shared';

import { getNotificationPreferences, updateNotificationPreferences } from '@/api/notifications';
import { canUsePush, disablePush, enablePush, isPushOn } from '@/lib/push';

type Channel = 'push' | 'email' | 'sms';

function SettingRow({
  icon,
  title,
  hint,
  control,
}: {
  icon: ReactNode;
  title: string;
  hint: ReactNode;
  control: ReactNode;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-soft text-body">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{title}</p>
        <p className="text-xs text-subtle">{hint}</p>
      </div>
      {control}
    </li>
  );
}

/** Bật / tắt kênh nhận thông báo; kênh máy chủ chưa cấu hình thì không hiện. */
export function NotificationSettings() {
  const { message } = App.useApp();
  const [prefs, setPrefs] = useState<NotificationPreferences>();
  const [pushSupported, setPushSupported] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [busy, setBusy] = useState<Channel>();

  useEffect(() => {
    let isCurrent = true;
    getNotificationPreferences()
      .then((loaded) => isCurrent && setPrefs(loaded))
      .catch((error: Error) => message.error(error.message));
    void canUsePush().then((supported) => {
      if (!isCurrent) return;
      setPushSupported(supported);
      setPushOn(supported && isPushOn());
    });
    return () => {
      isCurrent = false;
    };
  }, [message]);

  const run = async (channel: Channel, action: () => Promise<void>, done: string) => {
    setBusy(channel);
    try {
      await action();
      message.success(done);
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setBusy(undefined);
    }
  };

  const togglePush = (on: boolean) =>
    run(
      'push',
      async () => {
        if (on) {
          await enablePush();
          if (!prefs?.push) setPrefs(await updateNotificationPreferences({ push: true }));
        } else {
          await disablePush();
        }
        setPushOn(on);
      },
      on
        ? 'Đã bật thông báo đẩy trên trình duyệt này'
        : 'Đã tắt thông báo đẩy trên trình duyệt này',
    );

  const togglePref = (channel: 'email' | 'sms', on: boolean) =>
    run(
      channel,
      async () => setPrefs(await updateNotificationPreferences({ [channel]: on })),
      'Đã lưu cài đặt',
    );

  if (!prefs) return null;
  const { channels } = prefs;

  return (
    <section className="mb-5 rounded-lg border border-line px-4">
      <h2 className="pt-3 text-base font-bold text-ink">Cách nhận thông báo</h2>
      <ul className="divide-y divide-line">
        <SettingRow
          icon={<BellRing size={18} />}
          title="Trên web"
          hint="Chuông thông báo cập nhật ngay khi bạn đang mở Trọ ơi"
          control={<span className="text-sm text-subtle">Luôn bật</span>}
        />
        {channels.push && (
          <SettingRow
            icon={<MonitorSmartphone size={18} />}
            title="Thông báo đẩy trên trình duyệt này"
            hint={
              pushSupported
                ? 'Nhận thông báo và tin nhắn mới cả khi đã đóng trang'
                : 'Trình duyệt này không hỗ trợ (trên iPhone: thêm Trọ ơi vào màn hình chính trước)'
            }
            control={
              <Switch
                aria-label="Thông báo đẩy trên trình duyệt này"
                checked={pushOn}
                disabled={!pushSupported}
                loading={busy === 'push'}
                onChange={togglePush}
              />
            }
          />
        )}
        {channels.email && (
          <SettingRow
            icon={<Mail size={18} />}
            title="Email"
            hint={
              prefs.hasEmail ? (
                'Gửi tới email trong trang cá nhân của bạn'
              ) : (
                <>
                  Chưa có email — <Link href="/ca-nhan">thêm email ở trang cá nhân</Link>
                </>
              )
            }
            control={
              <Switch
                aria-label="Nhận thông báo qua email"
                checked={prefs.hasEmail && prefs.email}
                disabled={!prefs.hasEmail}
                loading={busy === 'email'}
                onChange={(on) => togglePref('email', on)}
              />
            }
          />
        )}
        {channels.sms && (
          <SettingRow
            icon={<MessageSquareText size={18} />}
            title="SMS"
            hint="Gửi tới số điện thoại đăng nhập"
            control={
              <Switch
                aria-label="Nhận thông báo qua SMS"
                checked={prefs.sms}
                loading={busy === 'sms'}
                onChange={(on) => togglePref('sms', on)}
              />
            }
          />
        )}
      </ul>
    </section>
  );
}
