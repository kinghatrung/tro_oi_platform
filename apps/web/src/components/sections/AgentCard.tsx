import { Row, Col, Space, Avatar, Button, Flex, Badge } from 'antd';
import { List, MessageCircle, PhoneCall } from 'lucide-react';

export function AgentCard() {
  return (
    <section className="sticky top-4 rounded-lg bg-white p-5">
      <Flex vertical gap={12}>
        <Space>
          <Avatar className="w-12! h-12!" />
          <Space vertical size={0}>
            <p className="text-primary text-[16px]">Minh Huyên</p>
            <p className="text-secondary">Môi giới</p>
          </Space>
        </Space>
        <Space>
          <Badge
            color="#52c41a"
            text={<span className="text-secondary">Hoạt động 37 phút trước</span>}
          />

          <p className="text-secondary">
            Phản hồi: <strong>83%</strong>
          </p>
        </Space>
        <Flex align="center" gap={16}>
          <Flex align="center" gap={4} className="text-[#595959]! text-[16px]">
            <List size={16} /> <span>16 tin đăng</span>
          </Flex>
          <span className="text-[#595959]! text-[16px]">6 tháng trên Trọ ơi!</span>
        </Flex>
        <Flex align="center" gap={8}>
          <Button className="w-full text-[16px]! text-[#222]! font-bold!">Zalo</Button>
          <Button
            icon={<MessageCircle size={20} />}
            className="w-full text-[16px]! text-[#222]! font-bold!"
          >
            Chat
          </Button>
          <Button
            icon={<PhoneCall size={20} />}
            type="primary"
            className="w-full font-bold! text-[16px]!"
          >
            Hiện số 0963311***
          </Button>
        </Flex>
      </Flex>
    </section>
  );
}
