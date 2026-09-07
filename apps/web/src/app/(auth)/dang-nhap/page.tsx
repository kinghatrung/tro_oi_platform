'use client';

import Link from 'next/link';
import { Button, Card, Flex, Typography, Divider, Form } from 'antd';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF } from 'react-icons/fa6';
import { ChevronLeft } from 'lucide-react';

import { FloatingInput } from '@/components/common';

/**
 * Sign in page component that renders a login/registration form with social auth options.
 * Allows users to sign in with Google, Facebook, or phone number.
 */
function SignInPage() {
  const [form] = Form.useForm();

  return (
    <main
      className="min-h-screen bg-cover bg-center bg-no-repeat flex justify-center items-center"
      style={{ backgroundImage: "url('/images/bg-tro-oi-login.svg')" }}
    >
      <Card className="w-120" styles={{ body: { padding: '20px 40px 40px' } }}>
        <Flex align="center" gap={16}>
          <Link href="/">
            <Button type="text" icon={<ChevronLeft />} />
          </Link>
          <Typography.Title level={4} className="text-center mb-5! pt-5 font-bold!">
            Đăng nhập/Đăng ký
          </Typography.Title>
        </Flex>
        <Flex vertical className="gap-3">
          <Button className="relative! font-bold! text-[16px]! h-12!">
            <span className="absolute left-4 flex items-center">
              <FcGoogle size={20} />
            </span>
            Tiếp tục với Google
          </Button>

          <Button className="relative! font-bold! text-[16px]! h-12!">
            <span className="absolute left-4 flex items-center">
              <span className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center">
                <FaFacebookF size={13} color="white" />
              </span>
            </span>
            Tiếp tục với Facebook
          </Button>
        </Flex>
        <Divider>
          <span className="text-[#8c8c8c] text-sm font-medium">Hoặc</span>
        </Divider>

        <Form form={form} layout="vertical" onFinish={() => {}} requiredMark={false}>
          <Flex vertical className="gap-3">
            <Form.Item
              name="phone"
              className="mb-0!"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại' },
                { pattern: /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/, message: 'Số điện thoại không hợp lệ' },
              ]}
            >
              <FloatingInput title="Số điện thoại" className="h-12! px-4! border-2!" />
            </Form.Item>
            <Button htmlType="submit" type="primary" className="w-full text-[16px]! h-12!">
              Tiếp tục
            </Button>
          </Flex>
        </Form>

        <Flex justify="space-between" align="center" className="mt-10!">
          <Link href="/">Chính sách bảo mật</Link>
          <Link href="/">Liên hệ hỗ trợ</Link>
        </Flex>
      </Card>
    </main>
  );
}

export default SignInPage;
