'use client';

import { useRef, useState } from 'react';
import { App, Button, Card, Form, Input, Modal, Tag, Tooltip } from 'antd';
import { Phone } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF } from 'react-icons/fa6';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
} from 'firebase/auth';
import type { User } from '@tro-oi/shared';

import { linkPhone, linkSocial, unlinkPhone, unlinkSocial } from '@/api/auth';
import { ApiError } from '@/api/axiosClient';
import { mergeAccount } from '@/api/users';
import {
  firebaseErrorMessage,
  getFirebaseAuth,
  isPopupCancelled,
  PHONE_PATTERN,
  toE164,
} from '@/lib/firebase';
import { useAuthStore } from '@/stores/useAuthStore';

type Provider = 'google' | 'facebook';

const PROVIDER_LABELS: Record<NonNullable<User['socialProvider']>, string> = {
  'google.com': 'Google',
  'facebook.com': 'Facebook',
  social: 'Google / Facebook',
};

const NEEDS_FIREBASE = 'Cần cấu hình Firebase';

/** "+84901234567" → "0901 234 567". */
const formatPhone = (phone: string) =>
  phone.replace(/^\+84/, '0').replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');

/**
 * Liên kết đăng nhập: 1 tài khoản đăng nhập được bằng SĐT và Google / Facebook.
 * Gắn thêm qua Firebase (OTP / popup) → ID token → POST /auth/link/*. Định danh đã thuộc tài khoản
 * khác (409) → đề nghị gộp tài khoản đó vào đây bằng chính token vừa có (POST /users/me/merge).
 */
export function LinkedAccounts({ user }: { user: User }) {
  const { message, modal } = App.useApp();
  const setUser = useAuthStore((state) => state.setUser);
  const isFirebaseEnabled = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const [busy, setBusy] = useState<Provider | 'unlink' | 'unlink-phone'>();
  const [phoneMode, setPhoneMode] = useState<'add' | 'change'>();

  /** Liên kết; trùng tài khoản khác → hỏi gộp. Trả true khi đã liên kết / gộp xong. */
  const linkOrMerge = async (token: string, link: (token: string) => Promise<User>) => {
    try {
      setUser(await link(token));
      return true;
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 409)) throw error;
      const isConfirmed = await modal.confirm({
        title: 'Gộp tài khoản?',
        content: `${error.message}. Gộp tài khoản đó vào tài khoản này? Tin đăng, món đồ, tin nhắn, đánh giá và mục đã lưu sẽ chuyển sang đây, tài khoản kia bị xoá. Không hoàn tác được.`,
        okText: 'Gộp tài khoản',
        okButtonProps: { danger: true },
        cancelText: 'Huỷ',
      });
      if (!isConfirmed) return false;
      setUser(await mergeAccount(token));
      // Dữ liệu chuyển sang ở mọi nơi (tin, chat, thông báo, đã lưu, đã xem, số chưa đọc…) →
      // tải lại toàn trang để mọi phần hiện đúng, không sót phần nào còn số liệu cũ
      void message
        .success('Đã gộp tài khoản — đang tải lại dữ liệu…', 1.2)
        .then(() => window.location.reload());
      return true;
    }
  };

  const handleLinkSocial = async (provider: Provider) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setBusy(provider);
    try {
      const credential = await signInWithPopup(
        auth,
        provider === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider(),
      );
      if (await linkOrMerge(await credential.user.getIdToken(), linkSocial)) {
        message.success(`Đã liên kết ${provider === 'google' ? 'Google' : 'Facebook'}`);
      }
    } catch (error) {
      if (!isPopupCancelled(error)) message.error(firebaseErrorMessage(error, 'Liên kết thất bại'));
    } finally {
      setBusy(undefined);
    }
  };

  const handleUnlinkPhone = async () => {
    setBusy('unlink-phone');
    try {
      setUser(await unlinkPhone());
      message.success('Đã bỏ số điện thoại');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setBusy(undefined);
    }
  };

  const handleUnlink = async () => {
    setBusy('unlink');
    try {
      setUser(await unlinkSocial());
      message.success('Đã huỷ liên kết');
    } catch (error) {
      message.error((error as Error).message);
    } finally {
      setBusy(undefined);
    }
  };

  const row = (icon: React.ReactNode, title: string, content: React.ReactNode) => (
    <div className="flex flex-wrap items-center gap-3 border-t border-line py-3 first:border-t-0">
      <span className="flex size-9 items-center justify-center rounded-full bg-soft">{icon}</span>
      <span className="min-w-28 font-semibold text-ink">{title}</span>
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2">{content}</div>
    </div>
  );

  return (
    <Card variant="borderless">
      <h2 className="text-primary mb-1">Liên kết đăng nhập</h2>
      <p className="mb-2 text-sm text-body">
        Đăng nhập vào cùng tài khoản này bằng số điện thoại, Google hoặc Facebook.
      </p>

      {row(
        <Phone size={18} className="text-brand" />,
        'Số điện thoại',
        user.phone ? (
          <>
            <span className="text-ink">{formatPhone(user.phone)}</span>
            <Tag color="success">Đã liên kết</Tag>
            <Tooltip title={isFirebaseEnabled ? undefined : NEEDS_FIREBASE}>
              <Button disabled={!isFirebaseEnabled} onClick={() => setPhoneMode('change')}>
                Đổi số
              </Button>
            </Tooltip>
            <Tooltip
              title={
                user.socialProvider
                  ? undefined
                  : 'Liên kết Google / Facebook trước để vẫn đăng nhập được'
              }
            >
              <Button
                danger
                disabled={!user.socialProvider}
                loading={busy === 'unlink-phone'}
                onClick={handleUnlinkPhone}
              >
                Bỏ số
              </Button>
            </Tooltip>
          </>
        ) : (
          <Tooltip title={isFirebaseEnabled ? undefined : NEEDS_FIREBASE}>
            <Button disabled={!isFirebaseEnabled} onClick={() => setPhoneMode('add')}>
              Thêm số điện thoại
            </Button>
          </Tooltip>
        ),
      )}

      {user.socialProvider
        ? row(
            user.socialProvider === 'facebook.com' ? (
              <FaFacebookF size={16} className="text-[#1877f2]" />
            ) : (
              <FcGoogle size={18} />
            ),
            PROVIDER_LABELS[user.socialProvider],
            <>
              <Tag color="success">Đã liên kết</Tag>
              <Tooltip
                title={user.phone ? undefined : 'Thêm số điện thoại trước để vẫn đăng nhập được'}
              >
                <Button
                  danger
                  disabled={!user.phone}
                  loading={busy === 'unlink'}
                  onClick={handleUnlink}
                >
                  Huỷ liên kết
                </Button>
              </Tooltip>
            </>,
          )
        : row(
            <FcGoogle size={18} />,
            'Google / Facebook',
            <>
              <Button
                icon={<FcGoogle size={16} />}
                disabled={!isFirebaseEnabled || Boolean(busy)}
                loading={busy === 'google'}
                title={isFirebaseEnabled ? undefined : NEEDS_FIREBASE}
                onClick={() => handleLinkSocial('google')}
              >
                Liên kết Google
              </Button>
              <Button
                icon={<FaFacebookF size={14} className="text-[#1877f2]" />}
                disabled={!isFirebaseEnabled || Boolean(busy)}
                loading={busy === 'facebook'}
                title={isFirebaseEnabled ? undefined : NEEDS_FIREBASE}
                onClick={() => handleLinkSocial('facebook')}
              >
                Liên kết Facebook
              </Button>
            </>,
          )}

      {phoneMode && (
        <LinkPhoneModal
          title={phoneMode === 'add' ? 'Thêm số điện thoại' : 'Đổi số điện thoại'}
          onClose={() => setPhoneMode(undefined)}
          onVerified={async (token) => {
            const isLinked = await linkOrMerge(token, linkPhone);
            // Mã OTP đã dùng → đóng dù huỷ gộp; muốn thử lại thì mở lại để nhận mã mới
            setPhoneMode(undefined);
            if (isLinked) {
              message.success(
                phoneMode === 'add' ? 'Đã thêm số điện thoại' : 'Đã đổi số điện thoại',
              );
            }
          }}
        />
      )}
    </Card>
  );
}

/** Nhập SĐT → OTP (Firebase, reCAPTCHA ẩn) → token đã xác minh cho `onVerified`. */
function LinkPhoneModal({
  title,
  onClose,
  onVerified,
}: {
  title: string;
  onClose: () => void;
  onVerified: (firebaseToken: string) => Promise<void>;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ phone: string; otp?: string }>();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const close = () => {
    verifierRef.current?.clear();
    onClose();
  };

  const handleSubmit = async ({ phone, otp }: { phone: string; otp?: string }) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setIsLoading(true);
    try {
      if (step === 'phone') {
        verifierRef.current ??= new RecaptchaVerifier(auth, 'link-phone-recaptcha', {
          size: 'invisible',
        });
        confirmationRef.current = await signInWithPhoneNumber(
          auth,
          toE164(phone),
          verifierRef.current,
        );
        setStep('otp');
      } else if (confirmationRef.current && otp) {
        const credential = await confirmationRef.current.confirm(otp);
        verifierRef.current?.clear();
        verifierRef.current = null;
        await onVerified(await credential.user.getIdToken());
      }
    } catch (error) {
      message.error(firebaseErrorMessage(error, 'Không thêm được số điện thoại'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open
      title={title}
      onCancel={close}
      onOk={() => form.submit()}
      okText={step === 'phone' ? 'Gửi mã OTP' : 'Xác nhận'}
      cancelText="Huỷ"
      confirmLoading={isLoading}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item
          name="phone"
          label="Số điện thoại"
          rules={[
            { required: true, message: 'Nhập số điện thoại' },
            { pattern: PHONE_PATTERN, message: 'Số điện thoại không hợp lệ' },
          ]}
        >
          <Input inputMode="tel" placeholder="0901234567" disabled={step === 'otp'} />
        </Form.Item>
        {step === 'otp' && (
          <Form.Item
            name="otp"
            label="Mã OTP đã gửi tới số trên"
            rules={[{ required: true, len: 6, message: 'Mã OTP gồm 6 số' }]}
          >
            <Input inputMode="numeric" maxLength={6} autoFocus />
          </Form.Item>
        )}
      </Form>
      <div id="link-phone-recaptcha" />
    </Modal>
  );
}
