import React, { useState, useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';
import ProductGrid from './ProductGrid';
import ProductDetailModal from './ProductDetailModal';
import CartDrawer from './CartDrawer';
import CheckoutSection from './CheckoutSection';
import OrderHistorySection from './OrderHistorySection';
import AuthModal from './AuthModal';
import UserProfileSection from './UserProfileSection';
import { Product, CartItem, UserSession, OrderHistory } from '../../types';

interface UserStoreProps {
  productsList: Product[];
  orders: OrderHistory[];
  setOrders: (orders: OrderHistory[]) => void;
  currentUser: UserSession | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
  setShowAdminPanel: (show: boolean) => void;
  triggerAlert: (type: 'success' | 'error' | 'info', text: string) => void;
  formatPrice: (num: number) => string;
}

export default function UserStore({
  productsList,
  orders,
  setOrders,
  currentUser,
  setCurrentUser,
  setShowAdminPanel,
  triggerAlert,
  formatPrice,
}: UserStoreProps) {
  // Navigation & Screen View State
  const [currentCategory, setCurrentCategory] = useState<string>('Tất cả');
  const [categories, setCategories] = useState<string[]>(['Nữ', 'Nam', 'Trẻ em']);
  const [activeSubCategory, setActiveSubCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories list on mount
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const names = data.map((c: any) => c.name);
          if (names.length > 0) {
            setCategories(names);
          }
        }
      })
      .catch(err => console.error("Lỗi đồng bộ danh mục:", err));
  }, []);

  // Modals & Slideovers Visibility States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [showCartDrawer, setShowCartDrawer] = useState<boolean>(false);
  
  // Checkout & Order Tracking Wizards
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);
  const [showOrdersHistory, setShowOrdersHistory] = useState<boolean>(false);
  const [showUserProfile, setShowUserProfile] = useState<boolean>(false);

  // Cart Local State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Load cart from session storage on mount
  useEffect(() => {
    const savedCart = sessionStorage.getItem('ivy_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse saved cart:', e);
      }
    }
  }, []);

  // Save cart changes
  useEffect(() => {
    sessionStorage.setItem('ivy_cart', JSON.stringify(cart));
  }, [cart]);

  // Force email verification if logged in but unverified
  useEffect(() => {
    if (currentUser && !currentUser.emailVerified) {
      setShowAuthModal(true);
    }
  }, [currentUser]);

  // Cart operations
  const handleAddToCart = (product: Product, color: string, size: string, quantity: number) => {
    if (!color || !size) {
      triggerAlert('error', 'Vui lòng chọn Màu sắc và Kích cỡ sản phẩm.');
      return;
    }

    const updated = [...cart];
    const existingIdx = updated.findIndex(
      item => 
        item.product.id === product.id && 
        item.selectedColor === color && 
        item.selectedSize === size
    );

    if (existingIdx > -1) {
      updated[existingIdx].quantity += quantity;
    } else {
      updated.push({
        product,
        selectedColor: color,
        selectedSize: size,
        quantity,
      });
    }

    setCart(updated);
    setSelectedProduct(null); // Close detail modal
    setShowCartDrawer(true);  // Open slideover cart
    triggerAlert('success', `Đã thêm ${quantity} sản phẩm "${product.name}" vào giỏ hàng.`);
  };

  const handleUpdateCartQty = (idx: number, delta: number) => {
    const updated = [...cart];
    const newQty = updated[idx].quantity + delta;
    if (newQty <= 0) {
      updated.splice(idx, 1);
      setCart(updated);
      triggerAlert('info', 'Đã xóa sản phẩm khỏi giỏ hàng.');
    } else {
      updated[idx].quantity = newQty;
      setCart(updated);
    }
  };

  const handleRemoveCartItem = (idx: number) => {
    const updated = [...cart];
    updated.splice(idx, 1);
    setCart(updated);
    triggerAlert('info', 'Đã xóa sản phẩm khỏi giỏ hàng.');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    triggerAlert('info', 'Đã đăng xuất tài khoản thành công.');
  };

  // Compute numbers
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const userOrdersCount = orders.filter(o => !currentUser?.email || o.customerEmail === currentUser.email).length;

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      
      {/* 1. Universal Header Navigation */}
      <Header
        currentCategory={currentCategory}
        setCurrentCategory={setCurrentCategory}
        categories={categories}
        setActiveSubCategory={setActiveSubCategory}
        setSearchQuery={setSearchQuery}
        setIsCheckingOut={setIsCheckingOut}
        setShowOrdersHistory={setShowOrdersHistory}
        setShowUserProfile={setShowUserProfile}
        currentUser={currentUser}
        handleLogout={handleLogout}
        ordersCount={userOrdersCount}
        cartItemCount={cartItemCount}
        setShowCartDrawer={setShowCartDrawer}
        setAuthTab={setAuthTab}
        setShowAuthModal={setShowAuthModal}
      />

      {/* 2. Main Content Routing Router */}
      <main className="flex-1 flex flex-col">
        {showUserProfile ? (
          <UserProfileSection
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            setShowUserProfile={setShowUserProfile}
            triggerAlert={triggerAlert}
          />
        ) : showOrdersHistory ? (
          <OrderHistorySection
            orders={orders}
            setShowOrdersHistory={setShowOrdersHistory}
            formatPrice={formatPrice}
          />
        ) : isCheckingOut ? (
          <CheckoutSection
            cart={cart}
            setCart={setCart}
            currentUser={currentUser}
            setIsCheckingOut={setIsCheckingOut}
            triggerAlert={triggerAlert}
            formatPrice={formatPrice}
            orders={orders}
            setOrders={setOrders}
            setShowOrdersHistory={setShowOrdersHistory}
          />
        ) : (
          <ProductGrid
            productsList={productsList}
            currentCategory={currentCategory}
            setCurrentCategory={setCurrentCategory}
            categories={categories}
            activeSubCategory={activeSubCategory}
            setActiveSubCategory={setActiveSubCategory}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setSelectedProduct={setSelectedProduct}
            formatPrice={formatPrice}
          />
        )}
      </main>

      {/* 3. Universal Footer */}
      <Footer />

      {/* 4. Overlay & Dialogs Modals */}
      {selectedProduct && (
        <ProductDetailModal
          selectedProduct={selectedProduct}
          setSelectedProduct={setSelectedProduct}
          productsList={productsList}
          handleAddToCart={handleAddToCart}
          formatPrice={formatPrice}
        />
      )}

      {showCartDrawer && (
        <CartDrawer
          cart={cart}
          setShowCartDrawer={setShowCartDrawer}
          cartItemCount={cartItemCount}
          cartSubtotal={cartSubtotal}
          handleRemoveCartItem={handleRemoveCartItem}
          handleUpdateCartQty={handleUpdateCartQty}
          setIsCheckingOut={setIsCheckingOut}
          setCheckoutStep={() => {}}
          formatPrice={formatPrice}
        />
      )}

      {showAuthModal && (
        <AuthModal
          setShowAuthModal={setShowAuthModal}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          setShippingName={() => {}}
          setShippingPhone={() => {}}
          triggerAlert={triggerAlert}
          initialTab={currentUser && !currentUser.emailVerified ? 'verify_email' : undefined}
          forcedEmail={currentUser && !currentUser.emailVerified ? currentUser.email : undefined}
        />
      )}

    </div>
  );
}
