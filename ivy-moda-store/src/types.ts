import { Product, Showroom, DiscountCode } from './data';

export interface CartItem {
  product: Product;
  selectedColor: string;
  selectedSize: string;
  quantity: number;
}

export interface UserSession {
  uid?: string;
  name: string;
  email: string;
  username?: string;
  phone: string;
  role?: 'user' | 'admin';
  gender?: 'Nam' | 'Nữ' | 'Khác' | '';
  birthday?: string;
  address?: string;
  emailVerified?: boolean;
}

export interface OrderHistory {
  id: string;
  date: string;
  items: {
    productName: string;
    sku: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  shippingAddress: string;
  paymentMethod: string;
  status: 'Đang xử lý' | 'Đang đóng gói' | 'Đang vận chuyển' | 'Hoàn thành';
  customerEmail?: string;
}

export type { Product, Showroom, DiscountCode };
