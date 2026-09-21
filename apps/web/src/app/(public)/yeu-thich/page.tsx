import Image from 'next/image';
import Link from 'next/link';
import { Card, Space, Button, Flex } from 'antd';
import { Heart, MapPin, CircleUserRound, MessageCircle } from 'lucide-react';

export default function FavouritePage() {
  return (
    <div>
      <Card
        variant="borderless"
        className="rounded-t-lg! rounded-b-none!"
        classNames={{
          body: 'px-4! pt-4! pb-0!',
        }}
      >
        <p className="text-primary">Tin đã lưu</p>
        <Space className="py-4">
          <Button size="small" type="primary" className=" rounded-2xl!">
            Tin đăng 6/100
          </Button>
          <Button size="small" className="btn-gray rounded-2xl!">
            Video 6/100
          </Button>
          <Button size="small" className="btn-gray rounded-2xl!">
            Bài viết 6/100
          </Button>
        </Space>
      </Card>

      <Flex vertical>
        {Array.from({ length: 5 }).map((_, index) => (
          <Card
            key={index}
            className="group relative rounded-none! border-t-[#e8e8e8]! hover:shadow-[0_4px_20px_rgba(0,0,0,0.16)]! hover:z-10"
            classNames={{ body: 'p-4!' }}
          >
            <Link
              href="/bat-dong-san/1"
              className="absolute inset-0 z-0"
              aria-label="Xem chi tiết bất động sản"
            />

            <Flex gap={16}>
              <div className="relative h-42 w-42 min-w-42 overflow-hidden rounded-lg">
                <Image
                  fill
                  sizes="168px"
                  alt="Ảnh yêu thích"
                  className="object-cover"
                  src="/images/test.jpg"
                />
              </div>

              <Flex vertical justify="space-between" className="w-full!">
                <Flex vertical>
                  <p className="text-primary">bán nhà riêng ở lệnh cư , khâm thiên</p>
                  <p className="text-primary text-[#f0325e]">17,9 tỷ</p>
                  <Space size={4}>
                    <MapPin size={16} color="#bfbfbf" />
                    <p className="text-secondary">Quận Hà Nội</p>
                  </Space>
                </Flex>

                <Flex align="center" justify="space-between">
                  <Flex align="center" gap={8}>
                    <div className="flex size-5 items-center justify-center rounded-full bg-yellow-400">
                      <CircleUserRound size={15} className="text-white" />
                    </div>

                    <span className="text-secondary text-[#222]">Minh Huyên</span>
                    <span className="text-secondary text-sm">19 phút trước</span>
                  </Flex>
                  <Space size={18}>
                    <Button icon={<MessageCircle size={18} />} size="small">
                      Chat
                    </Button>
                    <Heart size={18} />
                  </Space>
                </Flex>
              </Flex>
            </Flex>
          </Card>
        ))}
      </Flex>
    </div>
  );
}
