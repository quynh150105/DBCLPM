export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'Nữ' | 'Nam' | 'Trẻ em';
  subCategory: string;
  price: number;
  originalPrice?: number;
  badge?: 'New' | 'Best Seller' | '-30%' | '-50%' | 'Seller';
  images: string[];
  description: string;
  colors: {
    name: string;
    hex: string;
    image?: string;
    images?: string[];
    // Stock status mapping of Size -> boolean (true: in stock, false: out of stock)
    stock: { [size: string]: boolean };
  }[];
  sizes: string[];
}

export interface Showroom {
  id: string;
  name: string;
  province: string;
  district: string;
  address: string;
  phone: string;
  hours: string;
  lat?: number;
  lng?: number;
}

export interface DiscountCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number;
  description: string;
}

export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'MS 57D2923',
    name: 'Áo Sơ Mi Lụa Cổ Đức Công Sở',
    category: 'Nữ',
    subCategory: 'Áo Sơ Mi',
    price: 850000,
    originalPrice: 1200000,
    badge: 'New',
    images: [
      'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&auto=format&fit=crop&q=80',
    ],
    description: 'Áo sơ mi dáng suông cổ Đức truyền thống, chất liệu lụa cao cấp mềm mịn, chống nhăn tốt mang lại cảm giác thoải mái và thanh lịch tối đa cho quý cô công sở. Thiết kế tay dài thanh lịch, dễ phối cùng chân váy hay quần tây.',
    colors: [
      { name: 'Đen', hex: '#000000', image: 'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600&auto=format&fit=crop&q=80', stock: { S: true, M: true, L: true, XL: false, XXL: false } },
      { name: 'Trắng', hex: '#ffffff', image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600&auto=format&fit=crop&q=80', stock: { S: true, M: true, L: true, XL: true, XXL: false } },
      { name: 'Đỏ Đô', hex: '#b41b1b', stock: { S: false, M: true, L: true, XL: false, XXL: false } },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'prod-2',
    sku: 'MS 57D1924',
    name: 'Đầm Công Sở Chéo Trễ Vai Quý Phái',
    category: 'Nữ',
    subCategory: 'Đầm Công Sở',
    price: 1250000,
    originalPrice: 1790000,
    badge: '-30%',
    images: [
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80',
    ],
    description: 'Đầm xòe trễ vai với nếp xếp chéo tinh tế tại ngực giúp tôn lên bờ vai trần quyến rũ của phái đẹp. Thích hợp cho các buổi tiệc tối sang trọng hay sự kiện đặc biệt. Chất vải trượt cao cấp có độ co giãn nhẹ và giữ phom cực tốt.',
    colors: [
      { name: 'Đỏ Đô', hex: '#b41b1b', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80', stock: { S: true, M: true, L: false, XL: false } },
      { name: 'Đen', hex: '#000000', image: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=600&auto=format&fit=crop&q=80', stock: { S: true, M: true, L: true, XL: true } },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'prod-3',
    sku: 'MS 31M4890',
    name: 'Quần Tây Khaki Slim Fit Nam Tính',
    category: 'Nam',
    subCategory: 'Quần Tây',
    price: 950000,
    badge: 'Seller',
    images: [
      'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?w=600&auto=format&fit=crop&q=80',
    ],
    description: 'Quần Khaki dáng ôm nhẹ (Slim Fit), chất liệu 100% cotton dệt chéo cao cấp thoáng khí, mềm mại và bền màu. Thiết kế tối giản tinh tế phù hợp cho cả đi làm và dạo phố năng động.',
    colors: [
      { name: 'Beige', hex: '#e5e5e5', image: 'https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600&auto=format&fit=crop&q=80', stock: { S: true, M: true, L: true, XL: true, XXL: true } },
      { name: 'Đen', hex: '#000000', image: 'https://images.unsplash.com/photo-1517462964-21fdcec3f25b?w=600&auto=format&fit=crop&q=80', stock: { S: true, M: true, L: true, XL: false, XXL: false } },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'prod-4',
    sku: 'MS 57V2081',
    name: 'Chân Váy Bút Chì Khóa Trước',
    category: 'Nữ',
    subCategory: 'Chân Váy',
    price: 690000,
    badge: 'Best Seller',
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&auto=format&fit=crop&q=80',
    ],
    description: 'Chân váy bút chì dáng ôm tôn dáng hoàn hảo, điểm nhấn khóa kéo dọc thân trước hiện đại và cá tính. Chất liệu tuyết mưa co giãn nhẹ, giữ dáng bền lâu, dễ kết hợp cùng áo sơ mi lụa hoặc áo thun cao cấp.',
    colors: [
      { name: 'Đen', hex: '#000000', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80', stock: { S: true, M: true, L: true, XL: false } },
      { name: 'Beige', hex: '#e5e5e5', image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?w=600&auto=format&fit=crop&q=80', stock: { S: false, M: true, L: true, XL: false } },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'prod-5',
    sku: 'MS 21P1233',
    name: 'Áo Sơ Mi Polo Pima Cotton Premium',
    category: 'Nam',
    subCategory: 'Áo Sơ Mi',
    price: 450000,
    originalPrice: 650000,
    badge: '-30%',
    images: [
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80',
    ],
    description: 'Áo thun Polo dáng ôm sơ mi dệt từ sợi bông Pima quý hiếm siêu mềm mịn, mát tay, co giãn 4 chiều tốt và cực kỳ bền bỉ. Bo cổ và tay áo tinh xảo mang lại diện mạo lịch lãm, khỏe khoắn cho phái mạnh.',
    colors: [
      { name: 'Trắng', hex: '#ffffff', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600&auto=format&fit=crop&q=80', stock: { S: true, M: true, L: true, XL: true, XXL: true } },
      { name: 'Đen', hex: '#000000', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=600&auto=format&fit=crop&q=80', stock: { S: true, M: true, L: true, XL: true, XXL: true } },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'prod-6',
    sku: 'MS 41B1089',
    name: 'Đầm Công Sở Blazer Kẻ Hai Hàng Khuy',
    category: 'Nữ',
    subCategory: 'Đầm Công Sở',
    price: 2150000,
    badge: 'New',
    images: [
      'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80',
    ],
    description: 'Đầm dáng Blazer phom suông vừa vặn họa tiết kẻ ô sang trọng, khuy đúp thanh lịch. Thiết kế có đệm vai nhẹ tạo phom chuẩn, lớp lót lụa mềm mại bên trong giúp giữ ấm và tạo nét sang trọng cho mọi outfit.',
    colors: [
      { name: 'Beige Kẻ', hex: '#ebd5b3', stock: { S: true, M: true, L: true, XL: false } },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'prod-7',
    sku: 'MS 12K9023',
    name: 'Đầm Công Sở Thắt Eo Họa Tiết Bé Gái',
    category: 'Trẻ em',
    subCategory: 'Đầm Công Sở',
    price: 490000,
    originalPrice: 690000,
    badge: '-30%',
    images: [
      'https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=600&auto=format&fit=crop&q=80',
    ],
    description: 'Đầm dáng xòe thắt eo nhẹ nhàng cho bé gái, chất liệu 100% cotton tự nhiên, thoáng mát thấm hút mồ hôi tốt. Họa tiết bông hoa tươi tắn dệt sợi tinh xảo đem lại sự thích thú và nét đáng yêu cho bé.',
    colors: [
      { name: 'Hồng Phấn', hex: '#ffc0cb', stock: { S: true, M: true, L: true, XL: false } },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'prod-8',
    sku: 'MS 12B8934',
    name: 'Chân Váy Jeans Đáng Yêu Bé Gái',
    category: 'Trẻ em',
    subCategory: 'Chân Váy',
    price: 290000,
    badge: 'New',
    images: [
      'https://images.unsplash.com/photo-1516624683217-bf02fc6b6b7c?w=600&auto=format&fit=crop&q=80',
    ],
    description: 'Chân váy jeans cá tính co giãn tốt dành cho bé gái, kiểu dáng thời trang dễ thương năng động. Thiết kế có thun thắt lưng co giãn mang lại cảm giác thoải mái cho bé vui chơi cả ngày.',
    colors: [
      { name: 'Xanh Jeans', hex: '#4b6584', stock: { S: true, M: true, L: true, XL: true } },
      { name: 'Đen', hex: '#000000', stock: { S: true, M: true, L: false, XL: false } },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
  }
];

export const SHOWROOMS: Showroom[] = [
  // Hà Nội
  {
    id: 'sr-1',
    name: 'IVY moda Vincom Bà Triệu',
    province: 'Hà Nội',
    district: 'Hai Bà Trưng',
    address: 'Tầng 2, TTTM Vincom Center, 191 Bà Triệu, Lê Đại Hành, Hai Bà Trưng, Hà Nội',
    phone: '024 6262 0333',
    hours: '09:00 - 22:00',
    lat: 21.0116,
    lng: 105.8491
  },
  {
    id: 'sr-2',
    name: 'IVY moda Thái Hà',
    province: 'Hà Nội',
    district: 'Đống Đa',
    address: '248-250 Thái Hà, Trung Liệt, Đống Đa, Hà Nội',
    phone: '024 3514 8268',
    hours: '08:30 - 21:30',
    lat: 21.0121,
    lng: 105.8197
  },
  {
    id: 'sr-3',
    name: 'IVY moda Cầu Giấy',
    province: 'Hà Nội',
    district: 'Cầu Giấy',
    address: '303 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
    phone: '024 3839 8368',
    hours: '08:30 - 21:30',
    lat: 21.0345,
    lng: 105.7892
  },
  // TP Hồ Chí Minh
  {
    id: 'sr-4',
    name: 'IVY moda Nguyễn Trãi',
    province: 'Hồ Chí Minh',
    district: 'Quận 5',
    address: '142 Nguyễn Trãi, Phường 3, Quận 5, TP. Hồ Chí Minh',
    phone: '028 3838 1668',
    hours: '08:30 - 21:30',
    lat: 10.7578,
    lng: 106.6775
  },
  {
    id: 'sr-5',
    name: 'IVY moda Hai Bà Trưng',
    province: 'Hồ Chí Minh',
    district: 'Quận 1',
    address: '187A Hai Bà Trưng, Phường 6, Quận 3, TP. Hồ Chí Minh',
    phone: '028 3827 9268',
    hours: '08:30 - 21:30',
    lat: 10.7842,
    lng: 106.6922
  },
  {
    id: 'sr-6',
    name: 'IVY moda Lê Văn Sỹ',
    province: 'Hồ Chí Minh',
    district: 'Tân Bình',
    address: '382 Lê Văn Sỹ, Phường 2, Tân Bình, TP. Hồ Chí Minh',
    phone: '028 3991 3268',
    hours: '08:30 - 21:30',
    lat: 10.7979,
    lng: 106.6664
  },
  // Đà Nẵng
  {
    id: 'sr-7',
    name: 'IVY moda Nguyễn Văn Linh',
    province: 'Đà Nẵng',
    district: 'Thanh Khê',
    address: '150 Nguyễn Văn Linh, Vĩnh Trung, Thanh Khê, Đà Nẵng',
    phone: '0236 358 4568',
    hours: '08:30 - 21:30',
    lat: 16.0612,
    lng: 108.2144
  },
  // Hải Phòng
  {
    id: 'sr-8',
    name: 'IVY moda Lê Chân',
    province: 'Hải Phòng',
    district: 'Lê Chân',
    address: 'Tầng 1, TTTM Aeon Mall Hải Phòng Lê Chân, Võ Nguyên Giáp, Hải Phòng',
    phone: '0225 351 9868',
    hours: '09:00 - 22:00',
    lat: 20.8252,
    lng: 106.6853
  }
];

export const DISCOUNT_CODES: DiscountCode[] = [
  { code: 'IVYNEW10', discountType: 'percentage', value: 10, description: 'Giảm 10% tổng giá trị đơn hàng cho khách hàng mới' },
  { code: 'IVYSALE30', discountType: 'percentage', value: 30, description: 'Giảm 30% cho đơn hàng đặc biệt' },
  { code: 'FREESHIP', discountType: 'fixed', value: 40000, description: 'Miễn phí giao hàng toàn quốc (giảm tới 40.000đ)' },
  { code: 'IVYVIP100K', discountType: 'fixed', value: 100000, description: 'Giảm trực tiếp 100.000đ cho đơn hàng từ 1.000.000đ' },
];

export const SHIPPING_RATES: { [province: string]: { fee: number; days: string } } = {
  'Hà Nội': { fee: 22000, days: '1 - 2 ngày' },
  'Hồ Chí Minh': { fee: 35000, days: '2 - 3 ngày' },
  'Đà Nẵng': { fee: 28000, days: '2 ngày' },
  'Hải Phòng': { fee: 25000, days: '1 - 2 ngày' },
  'Cần Thơ': { fee: 38000, days: '3 ngày' },
  'Khác': { fee: 40000, days: '3 - 5 ngày' },
};

export const SIZE_CONVERSION_CHART = [
  { size: 'S', height: '148 - 153 cm', weight: '40 - 47 kg', chest: '80 - 84 cm', waist: '64 - 68 cm' },
  { size: 'M', height: '154 - 159 cm', weight: '48 - 54 kg', chest: '84 - 88 cm', waist: '68 - 72 cm' },
  { size: 'L', height: '160 - 165 cm', weight: '55 - 60 kg', chest: '88 - 92 cm', waist: '72 - 76 cm' },
  { size: 'XL', height: '166 - 170 cm', weight: '61 - 66 kg', chest: '92 - 96 cm', waist: '76 - 80 cm' },
  { size: 'XXL', height: '171 - 175 cm', weight: '67 - 73 kg', chest: '96 - 100 cm', waist: '80 - 84 cm' },
];
