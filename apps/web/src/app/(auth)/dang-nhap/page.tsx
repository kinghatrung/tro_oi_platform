'use client';

import Link from 'next/link';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { App, Button, Card, Flex, Typography, Divider, Form, Input } from 'antd';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF } from 'react-icons/fa6';
import { ChevronLeft } from 'lucide-react';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
} from 'firebase/auth';
import type { AuthResponse, PageSummary } from '@tro-oi/shared';

import { devLogin, socialLogin, verifyPhone } from '@/api/auth';
import { getPublishedPages } from '@/api/pages';
import { FloatingInput } from '@/components/common';
import {
  firebaseErrorMessage as errorMessage,
  getFirebaseAuth,
  isPopupCancelled,
  PHONE_PATTERN,
  toE164,
} from '@/lib/firebase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSiteSettings } from '@/app/providers';

type LoginStep = 'phone' | 'otp';
const RESEND_SECONDS = 60;
type SocialProvider = 'google' | 'facebook';

/** Chỉ cho phép redirect nội bộ (chặn open redirect kiểu //evil.com). */
/** 0912345678 → 0912 345 678 */
const formatPhone = (phone: string) => phone.replace(/^(\d{4})(\d{3})(\d+)$/, '$1 $2 $3');

const safeRedirect = (value: string | null) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/';

/**
 * Đăng nhập/Đăng ký bằng SĐT: Firebase OTP → POST /auth/verify-phone.
 * Chưa cấu hình Firebase (dev) → POST /auth/dev-login, không cần OTP.
 */
function SignInPage() {
  const router = useRouter();
  const redirectTo = safeRedirect(useSearchParams().get('redirect'));
  const { message } = App.useApp();
  const login = useAuthStore((state) => state.login);
  const { contactEmail, siteName } = useSiteSettings();
  // Chỉ nhắc tới trang chính sách đã đăng (chưa đăng → 404), như chân trang
  const [policyPages, setPolicyPages] = useState<PageSummary[]>([]);
  useEffect(() => {
    getPublishedPages()
      .then(setPolicyPages)
      .catch(() => undefined);
  }, []);
  const [form] = Form.useForm<{ phone: string }>();
  const [otpForm] = Form.useForm<{ otp: string }>();
  const [step, setStep] = useState<LoginStep>('phone');
  /** SĐT vừa gửi mã — hiện ở màn OTP, dùng khi "Gửi lại mã". */
  const [sentTo, setSentTo] = useState('');
  /** Đã từng sang màn OTP → quay lại màn SĐT thì trượt từ trái. */
  const [hasVisitedOtp, setHasVisitedOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const isFirebaseEnabled = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
  const [socialLoading, setSocialLoading] = useState<SocialProvider>();

  const finishLogin = useCallback(
    async (auth: AuthResponse) => {
      await login(auth);
      message.success(auth.isNewUser ? 'Tạo tài khoản thành công' : 'Đăng nhập thành công');
      router.replace(redirectTo);
      router.refresh();
    },
    [login, message, redirectTo, router],
  );

  // Đếm ngược trước khi cho gửi lại OTP (Firebase cũng giới hạn số SMS / số điện thoại)
  const [resendIn, setResendIn] = useState(0);
  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const handleSendPhone = useCallback(
    async ({ phone }: { phone: string }) => {
      setIsLoading(true);
      try {
        const auth = getFirebaseAuth();
        if (!auth) {
          await finishLogin(await devLogin(phone));
          return;
        }
        verifierRef.current ??= new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
        confirmationRef.current = await signInWithPhoneNumber(
          auth,
          toE164(phone),
          verifierRef.current,
        );
        setSentTo(phone);
        setStep('otp');
        setHasVisitedOtp(true);
        setResendIn(RESEND_SECONDS);
      } catch (error) {
        // reCAPTCHA đã dùng không gửi lại được → tạo mới ở lần thử sau
        verifierRef.current?.clear();
        verifierRef.current = null;
        message.error(errorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [finishLogin, message],
  );

  /** Google / Facebook: popup Firebase → ID token → POST /auth/social (tài khoản theo Firebase UID). */
  const handleSocial = async (provider: SocialProvider) => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setSocialLoading(provider);
    try {
      const credential = await signInWithPopup(
        auth,
        provider === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider(),
      );
      await finishLogin(await socialLogin(await credential.user.getIdToken()));
    } catch (error) {
      if (!isPopupCancelled(error)) {
        message.error(errorMessage(error));
      }
    } finally {
      setSocialLoading(undefined);
    }
  };

  const backToPhone = () => {
    setStep('phone');
    otpForm.resetFields();
  };

  const handleVerifyOtp = useCallback(
    async ({ otp }: { otp: string }) => {
      if (!confirmationRef.current || !otp) return;
      setIsLoading(true);
      try {
        const credential = await confirmationRef.current.confirm(otp);
        await finishLogin(await verifyPhone(await credential.user.getIdToken()));
      } catch (error) {
        message.error(errorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [finishLogin, message],
  );

  const policyNote = policyPages.length > 0 && (
    <p className="mt-4 text-center text-xs text-subtle">
      Bằng việc tiếp tục, bạn đồng ý với{' '}
      {policyPages.map((page, index) => (
        <Fragment key={page.slug}>
          {index > 0 && ' và '}
          <Link href={`/${page.slug}`} target="_blank" className="font-semibold">
            {page.title}
          </Link>
        </Fragment>
      ))}{' '}
      của {siteName}.
    </p>
  );

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat flex justify-center items-center"
      style={{ backgroundImage: "url('/images/bg-tro-oi-login.svg')" }}
    >
      <Card className="w-120 overflow-hidden" styles={{ body: { padding: '20px 40px 40px' } }}>
        {step === 'phone' ? (
          <div key="phone" className={hasVisitedOtp ? 'slide-in-left' : undefined}>
            <Flex align="center" gap={16}>
              <Link href="/" aria-label="Về trang chủ">
                <Button type="text" icon={<ChevronLeft />} />
              </Link>
              <Typography.Title level={4} className="text-center mb-5! pt-5 font-bold!">
                Đăng nhập/Đăng ký
              </Typography.Title>
            </Flex>
            {/* Cần Firebase (đã bật Google / Facebook trong Firebase Console); dev-login thì tắt */}
            <Flex vertical className="gap-3">
              <Button
                disabled={
                  !isFirebaseEnabled || Boolean(socialLoading && socialLoading !== 'google')
                }
                loading={socialLoading === 'google'}
                title={isFirebaseEnabled ? undefined : 'Cần cấu hình Firebase'}
                onClick={() => handleSocial('google')}
                className="relative! font-bold! text-[16px]! h-12!"
              >
                <span className="absolute left-4 flex items-center">
                  <FcGoogle size={20} />
                </span>
                Tiếp tục với Google
              </Button>

              <Button
                disabled={
                  !isFirebaseEnabled || Boolean(socialLoading && socialLoading !== 'facebook')
                }
                loading={socialLoading === 'facebook'}
                title={isFirebaseEnabled ? undefined : 'Cần cấu hình Firebase'}
                onClick={() => handleSocial('facebook')}
                className="relative! font-bold! text-[16px]! h-12!"
              >
                <span className="absolute left-4 flex items-center">
                  <span className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center">
                    <FaFacebookF size={13} color="white" />
                  </span>
                </span>
                Tiếp tục với Facebook
              </Button>
            </Flex>
            <Divider>
              <span className="text-subtle text-sm font-medium">Hoặc</span>
            </Divider>

            <Form form={form} layout="vertical" onFinish={handleSendPhone} requiredMark={false}>
              <Flex vertical className="gap-3">
                <Form.Item
                  name="phone"
                  className="mb-0!"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    { pattern: PHONE_PATTERN, message: 'Số điện thoại không hợp lệ' },
                  ]}
                >
                  <FloatingInput title="Số điện thoại" className="h-12! px-4! border-2!" />
                </Form.Item>

                <Button
                  htmlType="submit"
                  type="primary"
                  loading={isLoading}
                  className="w-full text-[16px]! h-12!"
                >
                  Tiếp tục
                </Button>
                {!isFirebaseEnabled && (
                  <p className="text-xs text-subtle text-center">
                    Chế độ dev: đăng nhập không cần OTP (Firebase chưa cấu hình).
                  </p>
                )}
              </Flex>
            </Form>
            {policyNote}
          </div>
        ) : (
          <div key="otp" className="slide-in-right">
            <Flex align="center" gap={16}>
              <Button
                type="text"
                aria-label="Quay lại nhập số điện thoại"
                icon={<ChevronLeft />}
                onClick={backToPhone}
              />
              <Typography.Title level={4} className="text-center mb-5! pt-5 font-bold!">
                Nhập mã xác minh
              </Typography.Title>
            </Flex>

            <p className="mb-6 text-center text-body">
              Mã gồm 6 số đã được gửi qua SMS tới
              <br />
              <b className="text-[16px] text-ink">{formatPhone(sentTo)}</b>
            </p>

            <Form form={otpForm} layout="vertical" onFinish={handleVerifyOtp} requiredMark={false}>
              <Flex vertical className="gap-4">
                <Form.Item
                  name="otp"
                  className="mb-0! flex justify-center"
                  rules={[{ required: true, len: 6, message: 'Nhập đủ mã OTP 6 số' }]}
                >
                  <Input.OTP length={6} size="large" autoFocus />
                </Form.Item>

                <Button
                  htmlType="submit"
                  type="primary"
                  loading={isLoading}
                  className="w-full text-[16px]! h-12!"
                >
                  Xác nhận
                </Button>

                <p className="text-center text-sm text-body">
                  Chưa nhận được mã?{' '}
                  <Button
                    type="link"
                    className="px-0! font-semibold!"
                    disabled={resendIn > 0 || isLoading}
                    onClick={() => handleSendPhone({ phone: sentTo })}
                  >
                    {resendIn > 0 ? `Gửi lại sau ${resendIn}s` : 'Gửi lại mã'}
                  </Button>
                </p>
              </Flex>
            </Form>
          </div>
        )}
        {/* reCAPTCHA ẩn: giữ nguyên qua 2 màn để "Gửi lại mã" dùng lại được */}
        <div id="recaptcha-container" />

        <Flex justify="space-between" align="center" className="mt-10!">
          <a href={`mailto:${contactEmail}`}>Liên hệ hỗ trợ</a>
        </Flex>
      </Card>
    </main>
  );
}

export default SignInPage;
