import { Card, Space, Button, Flex } from 'antd';

export function SearchFilters() {
  return (
    <Card variant="borderless">
      <Flex gap={8} vertical>
        <Space size={20}>
          <p>Bất Động Sản Cho Thuê Hà Nội Giá Rẻ</p>
          <Button size="small" className="rounded-2xl!">
            Lưu tìm kiếm
          </Button>
        </Space>

        <Flex align="center" justify="space-between">
          <Space>
            <Button>Lọc</Button>
            <Button>Cho thuê</Button>
            <Button>Loại hình</Button>
            <Button>Giá bán</Button>
            <Button>Đăng bởi</Button>
          </Space>
          <p>Xóa lọc</p>
        </Flex>
      </Flex>
    </Card>
  );
}
