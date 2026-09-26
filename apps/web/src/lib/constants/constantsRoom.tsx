import type { ReactNode } from 'react';
import { Home, Ruler, Building2, FileText, BedDouble, Sofa } from 'lucide-react';
import type { AgentInfo, SimilarListingItem } from '@/components/common/ImageLightbox';

export interface PropertyFeatureItem {
  icon: ReactNode;
  label: string;
  value: string;
}

export const ROOM_IMAGES: string[] = [
  '/images/banner-0.png',
  '/images/banner-1.png',
  '/images/banner-2.png',
  '/images/banner-3.png',
  '/images/test.jpg',
  '/images/banner-0.png',
  '/images/banner-1.png',
  '/images/banner-2.png',
  '/images/banner-3.png',
  '/images/test.jpg',
];

export const ROOM_DESCRIPTION = `Chủ ngộp giảm mạnh 200tr chỉ còn 1 tỷ hơn căn nhà 1 trệt 1 lầu không nơi nào có giá rẻ hơn.
Diện tích 5x18m.
- Pháp lý sổ hồng sẵn, thổ cư 100%.
- Công năng: 3 phòng ngủ, 1 toilet, bếp, phòng khách, sân xe hơi, sân sau..
- Giá: 1 tỷ hơn (thương lượng).
- Xung quanh dân cư đông đúc, gần chợ, công viên, trường học cấp 1,2,3. Đi trung tâm TP. Biên hòa chỉ 10 phút.
Giá hợp lý để mua ở lâu dài. Mua bán nhanh tặng luôn bộ nội thất xịn ạ.
Liên hệ em đi xem nhà nhé`;

export const PROPERTY_FEATURES: PropertyFeatureItem[] = [
  {
    icon: <Home size={18} />,
    label: 'Loại hình',
    value: 'Nhà ngõ, hẻm',
  },
  {
    icon: <Ruler size={18} />,
    label: 'Diện tích đất',
    value: '60 m²',
  },
  {
    icon: <Building2 size={18} />,
    label: 'Giá/m²',
    value: '97,50 triệu/m²',
  },
  {
    icon: <FileText size={18} />,
    label: 'Giấy tờ pháp lý',
    value: 'Đã có sổ',
  },
  {
    icon: <BedDouble size={18} />,
    label: 'Số phòng ngủ',
    value: '4 phòng',
  },
  {
    icon: <Sofa size={18} />,
    label: 'Tình trạng nội thất',
    value: 'Nội thất đầy đủ',
  },
];

export const ROOM_AGENT: AgentInfo = {
  name: 'Hoàng Nguyễn Thái',
  statusText: 'Hoạt động 4 ngày trước',
  phone: '098200****',
  profileUrl: '/trang-ca-nhan/hoang-nguyen-thai',
};

export const SAMPLE_QUESTIONS: string[] = [
  'Tình trạng giấy tờ như thế nào ạ',
  'Có hỗ trợ trả góp không',
  'Thời hạn thuê tối thiểu bao lâu',
  'Có thể hẹn giờ đến xem nhà không ạ',
];

export const SIMILAR_ROOM_LISTINGS: SimilarListingItem[] = [
  {
    id: 101,
    title: 'Phòng trọ khép kín full đồ ngõ 155 Cầu Giấy, bàn giao ngay',
    price: 3500000,
    area: 28,
    bedrooms: 1,
    address: 'Cầu Giấy, Hà Nội',
    imageUrl: '/images/banner-0.png',
    timeAgo: '1 ngày trước',
    countMedia: 5,
    author: { name: 'Nguyễn Văn A', rank: 'Môi giới', posted: 12 },
  },
  {
    id: 102,
    title: 'Căn hộ dịch vụ 1PN1K Nguyễn Khang, ban công thoáng mát',
    price: 4200000,
    area: 32,
    bedrooms: 1,
    address: 'Cầu Giấy, Hà Nội',
    imageUrl: '/images/banner-1.png',
    timeAgo: '2 ngày trước',
    countMedia: 6,
    author: { name: 'Trần Thị B', rank: 'Chủ nhà', posted: 3 },
  },
  {
    id: 103,
    title: 'Chung cư mini mới xây Trần Thái Tông, thang máy, an ninh 24/7',
    price: 3800000,
    area: 30,
    bedrooms: 1,
    address: 'Cầu Giấy, Hà Nội',
    imageUrl: '/images/banner-2.png',
    timeAgo: '3 giờ trước',
    countMedia: 8,
    author: { name: 'Lê Văn C', rank: 'Môi giới', posted: 25 },
  },
  {
    id: 104,
    title: 'Chung cư mini mới xây Trần Thái Tông, thang máy, an ninh 24/7',
    price: 3800000,
    area: 30,
    bedrooms: 1,
    address: 'Cầu Giấy, Hà Nội',
    imageUrl: '/images/banner-2.png',
    timeAgo: '3 giờ trước',
    countMedia: 8,
    author: { name: 'Lê Văn C', rank: 'Môi giới', posted: 25 },
  },
  {
    id: 105,
    title: 'Chung cư mini mới xây Trần Thái Tông, thang máy, an ninh 24/7',
    price: 3800000,
    area: 30,
    bedrooms: 1,
    address: 'Cầu Giấy, Hà Nội',
    imageUrl: '/images/banner-2.png',
    timeAgo: '3 giờ trước',
    countMedia: 8,
    author: { name: 'Lê Văn C', rank: 'Môi giới', posted: 25 },
  },
  {
    id: 106,
    title: 'Chung cư mini mới xây Trần Thái Tông, thang máy, an ninh 24/7',
    price: 3800000,
    area: 30,
    bedrooms: 1,
    address: 'Cầu Giấy, Hà Nội',
    imageUrl: '/images/banner-2.png',
    timeAgo: '3 giờ trước',
    countMedia: 8,
    author: { name: 'Lê Văn C', rank: 'Môi giới', posted: 25 },
  },
  {
    id: 107,
    title: 'Chung cư mini mới xây Trần Thái Tông, thang máy, an ninh 24/7',
    price: 3800000,
    area: 30,
    bedrooms: 1,
    address: 'Cầu Giấy, Hà Nội',
    imageUrl: '/images/banner-2.png',
    timeAgo: '3 giờ trước',
    countMedia: 8,
    author: { name: 'Lê Văn C', rank: 'Môi giới', posted: 25 },
  },
  {
    id: 108,
    title: 'Chung cư mini mới xây Trần Thái Tông, thang máy, an ninh 24/7',
    price: 3800000,
    area: 30,
    bedrooms: 1,
    address: 'Cầu Giấy, Hà Nội',
    imageUrl: '/images/banner-2.png',
    timeAgo: '3 giờ trước',
    countMedia: 8,
    author: { name: 'Lê Văn C', rank: 'Môi giới', posted: 25 },
  },
];

export const ROOM_DATA = {
  id: 1,
  title: 'Studio Full Nội Thất 25m² – Gần Bệnh Viện E – Vào Ở Ngay',
  price: '3,2 triệu/tháng',
  priceNumber: 3200000,
  area: 25,
  updatedAt: 'Cập nhật 1 ngày trước',
  address: 'số 104A ngõ 381 , Đường Nguyễn Khang, Phường Yên Hoà, Quận Cầu Giấy, Hà Nội',
  addressNote: '(Phường Yên Hòa, TP Hà Nội mới)',
  latitude: 21.028511,
  longitude: 105.804817,
  tags: ['3 PN', 'Nhà ngõ, hẻm'],
  images: ROOM_IMAGES,
  description: ROOM_DESCRIPTION,
  agent: ROOM_AGENT,
  similarListings: SIMILAR_ROOM_LISTINGS,
  sampleQuestions: SAMPLE_QUESTIONS,
  features: PROPERTY_FEATURES,
};
