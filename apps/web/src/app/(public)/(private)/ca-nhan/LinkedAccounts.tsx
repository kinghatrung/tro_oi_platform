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

import { linkPhone, linkSocial, unlinkSocial } from '@/api/auth';
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
 * Gắn thêm qua Firebase (OTP / popup) → ID token → POST /auth/link/*.
 */
export function LinkedAccounts({ user }: { user: User }) {
  const { message } = App.useApp();
  const setUser = useAuthStore((state) => state.setUser);
  const isFirebaseEnabled = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const [busy, setBusy] = useState<Provider | 'unlink'>();
  const [isPhoneOpen, setIsPhoneOpen] = useState(false);

  const handleLinkSocial = async (provider: Provider) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setBusy(provider);
    try {
      const credential = await signInWithPopup(
        auth,
        provider === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider(),
      );
      setUser(await linkSocial(await credential.user.getIdToken()));
      message.success(`Đã liên kết ${provider === 'google' ? 'Google' : 'Facebook'}`);
    } catch (error) {
      if (!isPopupCancelled(error)) message.error(firebaseErrorMessage(error, 'Liên kết thất bại'));
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
          </>
        ) : (
          <Tooltip title={isFirebaseEnabled ? undefined : NEEDS_FIREBASE}>
            <Button disabled={!isFirebaseEnabled} onClick={() => setIsPhoneOpen(true)}>
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

      {isPhoneOpen && (
        <LinkPhoneModal
          onClose={() => setIsPhoneOpen(false)}
          onLinked={(next) => {
            setUser(next);
            setIsPhoneOpen(false);
            message.success('Đã thêm số điện thoại');
          }}
        />
      )}
    </Card>
  );
}

/** Nhập SĐT → OTP (Firebase, reCAPTCHA ẩn) → POST /auth/link/phone. */
function LinkPhoneModal({
  onClose,
  onLinked,
}: {
  onClose: () => void;
  onLinked: (user: User) => void;
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
        onLinked(await linkPhone(await credential.user.getIdToken()));
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
      title="Thêm số điện thoại"
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
