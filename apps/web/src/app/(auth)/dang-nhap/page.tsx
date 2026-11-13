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
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/useAuthStore';
import { useSiteSettings } from '@/app/providers';

type LoginStep = 'phone' | 'otp';
type SocialProvider = 'google' | 'facebook';

const PHONE_PATTERN = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-verification-code': 'Mã OTP không đúng',
  'auth/code-expired': 'Mã OTP đã hết hạn, vui lòng gửi lại',
  'auth/too-many-requests': 'Bạn thử quá nhiều lần, vui lòng đợi ít phút',
  'auth/invalid-phone-number': 'Số điện thoại không hợp lệ',
  'auth/popup-blocked':
    'Trình duyệt đã chặn cửa sổ đăng nhập — hãy cho phép cửa sổ bật lên rồi thử lại',
  'auth/account-exists-with-different-credential':
    'Email này đã đăng nhập bằng cách khác (Google hoặc Facebook) — hãy dùng lại cách đó',
  'auth/operation-not-allowed': 'Cách đăng nhập này chưa được bật, vui lòng dùng số điện thoại',
  'auth/unauthorized-domain': 'Tên miền này chưa được cho phép đăng nhập, liên hệ quản trị viên',
};
/** Người dùng tự đóng cửa sổ đăng nhập — không báo lỗi. */
const CANCELLED_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request']);

const toE164 = (phone: string) => phone.replace(/^0/, '+84');

/** Chỉ cho phép redirect nội bộ (chặn open redirect kiểu //evil.com). */
const safeRedirect = (value: string | null) =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : '/';

const errorMessage = (error: unknown) => {
  const code = (error as { code?: string }).code;
  return (code && FIREBASE_ERRORS[code]) || (error as Error).message || 'Đăng nhập thất bại';
};

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
  const [form] = Form.useForm<{ phone: string; otp?: string }>();
  const [step, setStep] = useState<LoginStep>('phone');
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
        setStep('otp');
      } catch (error) {
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
      if (!CANCELLED_CODES.has((error as { code?: string }).code ?? '')) {
        message.error(errorMessage(error));
      }
    } finally {
      setSocialLoading(undefined);
    }
  };

  const handleVerifyOtp = useCallback(
    async ({ otp }: { otp?: string }) => {
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

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat flex justify-center items-center"
      style={{ backgroundImage: "url('/images/bg-tro-oi-login.svg')" }}
    >
      <Card className="w-120" styles={{ body: { padding: '20px 40px 40px' } }}>
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
            disabled={!isFirebaseEnabled || Boolean(socialLoading && socialLoading !== 'google')}
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
            disabled={!isFirebaseEnabled || Boolean(socialLoading && socialLoading !== 'facebook')}
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

        <Form
          form={form}
          layout="vertical"
          onFinish={step === 'phone' ? handleSendPhone : handleVerifyOtp}
          requiredMark={false}
        >
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

            {step === 'otp' && (
              <Form.Item
                name="otp"
                className="mb-0!"
                rules={[{ required: true, len: 6, message: 'Nhập mã OTP 6 số' }]}
              >
                <Input.OTP length={6} size="large" autoFocus />
              </Form.Item>
            )}

            <Button
              htmlType="submit"
              type="primary"
              loading={isLoading}
              className="w-full text-[16px]! h-12!"
            >
              {step === 'phone' ? 'Tiếp tục' : 'Xác nhận OTP'}
            </Button>

            {step === 'otp' && (
              <Button type="link" onClick={() => setStep('phone')}>
                Đổi số điện thoại / gửi lại mã
              </Button>
            )}
            {!isFirebaseEnabled && (
              <p className="text-xs text-subtle text-center">
                Chế độ dev: đăng nhập không cần OTP (Firebase chưa cấu hình).
              </p>
            )}
          </Flex>
        </Form>
        <div id="recaptcha-container" />

        {policyPages.length > 0 && (
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
        )}

        <Flex justify="space-between" align="center" className="mt-10!">
          <a href={`mailto:${contactEmail}`}>Liên hệ hỗ trợ</a>
        </Flex>
      </Card>
    </main>
  );
}

export default SignInPage;
