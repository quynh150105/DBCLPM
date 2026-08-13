import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

// Bảng users liên kết với Firebase Auth UID hoặc Đăng ký offline
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID hoặc offline ID
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  gender: text('gender'), // 'Nam' | 'Nữ' | 'Khác'
  birthday: text('birthday'), // Định dạng YYYY-MM-DD
  address: text('address'), // Địa chỉ mặc định
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  password: text('password'), // Mật khẩu tài khoản (lưu thô hoặc băm đơn giản cho mô phỏng)
  username: text('username'), // Tên đăng nhập của người dùng
  emailVerified: integer('email_verified').default(0), // 0: No, 1: Yes
  createdAt: timestamp('created_at').defaultNow(),
});

// Bảng products để lưu trữ thông tin sản phẩm có độ bền vững cao
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  prodId: text('prod_id').notNull().unique(), // prod-1, prod-2...
  sku: text('sku').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(), // 'Nữ' | 'Nam' | 'Trẻ em'
  subCategory: text('sub_category').notNull(),
  price: integer('price').notNull(),
  originalPrice: integer('original_price'),
  badge: text('badge'),
  images: jsonb('images').notNull(), // Mảng các URL hình ảnh string[]
  description: text('description').notNull(),
  colors: jsonb('colors').notNull(), // [{ name, hex, stock: { S: boolean, ... } }]
  sizes: jsonb('sizes').notNull(), // string[]
  createdAt: timestamp('created_at').defaultNow(),
});

// Bảng orders lưu thông tin đơn hàng
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderId: text('order_id').notNull().unique(), // Mã đơn hàng dạng IVY-XXXXXXXXX
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  customerEmail: text('customer_email'),
  shippingAddress: text('shipping_address').notNull(),
  paymentMethod: text('payment_method').notNull(),
  totalAmount: integer('total_amount').notNull(),
  items: jsonb('items').notNull(), // Chứa thông tin chi tiết các sản phẩm dưới dạng JSON
  status: text('status').notNull().default('Đang xử lý'), // 'Đang xử lý' | 'Đang đóng gói' | 'Đang vận chuyển' | 'Hoàn thành'
  createdAt: timestamp('created_at').defaultNow(),
});

// Bảng showrooms lưu danh sách chi nhánh cửa hàng
export const showrooms = pgTable('showrooms', {
  id: serial('id').primaryKey(),
  showroomId: text('showroom_id').notNull().unique(),
  name: text('name').notNull(),
  province: text('province').notNull(),
  district: text('district').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  hours: text('hours').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Bảng coupons lưu danh sách mã giảm giá
export const coupons = pgTable('coupons', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull().default('percentage'), // 'percentage' | 'fixed'
  value: integer('value').notNull(),
  description: text('description').notNull(),
  active: integer('active').notNull().default(1), // 1: Active, 0: Inactive
  createdAt: timestamp('created_at').defaultNow(),
});

// Bảng reviews lưu đánh giá sản phẩm của người dùng
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  productId: text('product_id').notNull(), // prodId tương ứng
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  rating: integer('rating').notNull(), // 1 - 5
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Bảng wishlist lưu danh sách yêu thích của người dùng
export const wishlist = pgTable('wishlist', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  productId: text('product_id').notNull(), // prodId tương ứng
  createdAt: timestamp('created_at').defaultNow(),
});

// Bảng categories lưu danh mục sản phẩm
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g. 'Nữ', 'Nam', 'Trẻ em'
  createdAt: timestamp('created_at').defaultNow(),
});

// Định nghĩa quan hệ
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.customerEmail],
    references: [users.email], // Liên kết đơn hàng với người dùng qua email hoặc có thể để trống
  }),
}));

