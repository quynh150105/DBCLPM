import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Info, ArrowRight, X, CheckCircle2, ShoppingBag } from 'lucide-react';
import { CartItem, UserSession, OrderHistory, DiscountCode } from '../../types';
import { SHIPPING_RATES, DISCOUNT_CODES } from '../../data';
import CheckoutOrderSummary from './CheckoutOrderSummary';
import CheckoutSteps from './CheckoutSteps';

interface CheckoutSectionProps {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  currentUser: UserSession | null;
  setIsCheckingOut: (checking: boolean) => void;
  triggerAlert: (type: 'success' | 'error' | 'info', text: string) => void;
  formatPrice: (num: number) => string;
  orders: OrderHistory[];
  setOrders: (orders: OrderHistory[]) => void;
  setShowOrdersHistory: (show: boolean) => void;
}

export default function CheckoutSection({
  cart,
  setCart,
  currentUser,
  setIsCheckingOut,
  triggerAlert,
  formatPrice,
  orders,
  setOrders,
  setShowOrdersHistory,
}: CheckoutSectionProps) {
  const [checkoutStep, setCheckoutStep] = useState<'info' | 'payment' | 'completed'>('info');
  
  // Shipping form fields
  const [shippingName, setShippingName] = useState(currentUser?.name || '');
  const [shippingPhone, setShippingPhone] = useState(currentUser?.phone || '');
  const [shippingProvince, setShippingProvince] = useState('Hà Nội');
  const [customProvince, setCustomProvince] = useState('');
  const [shippingDistrict, setShippingDistrict] = useState('');
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCarrier, setShippingCarrier] = useState<'Giao Hàng Nhanh' | 'Giao Hàng Tiết Kiệm' | 'Viettel Post'>('Giao Hàng Nhanh');
  
  // Coupon input
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<DiscountCode | null>(null);
  const [discountError, setDiscountError] = useState('');
  
  // Payment methods
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'QR' | 'CreditCard'>('COD');

  // QR Modal Simulation
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrTimer, setQrTimer] = useState(120);
  const [isQRPaid, setIsQRPaid] = useState(false);

  // Auto populate names when user session is available
  useEffect(() => {
    if (currentUser) {
      if (!shippingName) setShippingName(currentUser.name);
      if (!shippingPhone) setShippingPhone(currentUser.phone);
    }
  }, [currentUser]);

  // QR Countdown Effect
  useEffect(() => {
    let timerId: NodeJS.Timeout;
    if (showQRModal && qrTimer > 0 && !isQRPaid) {
      timerId = setTimeout(() => setQrTimer(prev => prev - 1), 1000);
    } else if (qrTimer === 0 && !isQRPaid) {
      setShowQRModal(false);
      triggerAlert('error', 'Giao dịch QR đã hết hạn, vui lòng thử lại.');
    }
    return () => clearTimeout(timerId);
  }, [showQRModal, qrTimer, isQRPaid]);

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const selectedShippingRate = SHIPPING_RATES[shippingProvince] || SHIPPING_RATES['Khác'];
  let baseFee = selectedShippingRate.fee;
  if (shippingCarrier === 'Giao Hàng Tiết Kiệm') {
    baseFee = Math.round(baseFee * 0.95);
  }
  const shippingFee = cartSubtotal >= 1000000 ? 0 : baseFee;

  let discountAmount = 0;
  if (appliedDiscount) {
    if (appliedDiscount.discountType === 'percentage') {
      discountAmount = Math.round((cartSubtotal * appliedDiscount.value) / 100);
    } else if (appliedDiscount.discountType === 'fixed') {
      discountAmount = appliedDiscount.value;
    }
  }

  // Cap coupon discount at total goods value
  if (discountAmount > cartSubtotal) {
    discountAmount = cartSubtotal;
  }

  const finalTotal = Math.max(0, cartSubtotal + shippingFee - discountAmount);

  // Apply Coupon
  const applyDiscountCode = async () => {
    setDiscountError('');
    const code = discountCodeInput.trim();
    if (!code) return;

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (response.ok) {
        const discountFound = await response.json();
        setAppliedDiscount(discountFound);
        triggerAlert('success', `Áp dụng thành công mã: ${discountFound.code}!`);
      } else {
        const err = await response.json();
        setDiscountError(err.error || 'Mã giảm giá không hợp lệ hoặc đã hết hạn.');
        setAppliedDiscount(null);
      }
    } catch (e) {
      // Fallback
      const discountFound = DISCOUNT_CODES.find(d => d.code === code.toUpperCase());
      if (discountFound) {
        setAppliedDiscount(discountFound);
        triggerAlert('success', `Áp dụng thành công mã: ${discountFound.code}! (Offline Mode)`);
      } else {
        setDiscountError('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
        setAppliedDiscount(null);
      }
    }
  };

  const removeDiscountCode = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput('');
    setDiscountError('');
  };

  // Form submit for checkout
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName || !shippingPhone || !shippingStreet || !shippingProvince) {
      triggerAlert('error', 'Vui lòng nhập đầy đủ thông tin giao hàng.');
      return;
    }

    const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06789]|8[1-9]|9[0-9])[0-9]{7}$/;
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠƯưăâêôơưẠ-ỹ\s]{2,50}$/;

    if (!nameRegex.test(shippingName.trim())) {
      triggerAlert('error', 'Họ tên người nhận không hợp lệ. Vui lòng chỉ dùng chữ cái và khoảng trắng (từ 2 đến 50 ký tự).');
      return;
    }

    if (!phoneRegex.test(shippingPhone.trim())) {
      triggerAlert('error', 'Số điện thoại người nhận không hợp lệ. Vui lòng nhập đúng 10 chữ số tại Việt Nam.');
      return;
    }

    if (shippingProvince === 'Khác' && !customProvince.trim()) {
      triggerAlert('error', 'Vui lòng nhập tên Tỉnh / Thành phố khác của bạn.');
      return;
    }

    setCheckoutStep('payment');
  };

  // VietQR instant payment simulation
  const simulateCheckoutQR = () => {
    setShowQRModal(true);
    setQrTimer(120);
    setIsQRPaid(false);
    
    // Auto pay simulator (4 seconds)
    setTimeout(() => {
      setIsQRPaid(true);
      triggerAlert('success', 'Thanh toán quét mã VietQR thành công! Đơn hàng đang được khởi tạo.');
    }, 4000);
  };

  const handlePlaceOrder = async () => {
    if (paymentMethod === 'QR' && !isQRPaid) {
      simulateCheckoutQR();
      return;
    }

    const provinceDisplay = shippingProvince === 'Khác' ? customProvince.trim() : shippingProvince;

    const newOrder: OrderHistory = {
      id: `IVY-${Math.floor(1000000 + Math.random() * 9000000)}`,
      date: new Date().toLocaleDateString('vi-VN'),
      items: cart.map(item => ({
        productName: item.product.name,
        sku: item.product.sku,
        color: item.selectedColor,
        size: item.selectedSize,
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal: cartSubtotal,
      shippingFee,
      discount: discountAmount,
      total: finalTotal,
      shippingAddress: `${shippingStreet}, ${shippingDistrict ? shippingDistrict + ', ' : ''}${provinceDisplay}`,
      paymentMethod: paymentMethod === 'COD' 
        ? 'COD - Thanh toán khi nhận hàng' 
        : paymentMethod === 'QR' 
          ? 'Quét mã VietQR chuyển khoản (Đã thanh toán)' 
          : 'Thẻ tín dụng Visa/Mastercard (Đã thanh toán)',
      status: 'Đang xử lý',
      customerEmail: currentUser?.email || ''
    };

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          order: {
            ...newOrder,
            customerName: shippingName,
            customerPhone: shippingPhone,
            totalAmount: finalTotal
          } 
        })
      });
    } catch (e) {
      console.log('Failed to post order to server, saved locally:', e);
    }

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    sessionStorage.setItem('ivy_orders', JSON.stringify(updatedOrders));

    // Reset customer cart state
    setCart([]);
    setCheckoutStep('completed');
    setShowQRModal(false);
    removeDiscountCode();
    triggerAlert('success', 'Đơn hàng của bạn đã được tiếp nhận thành công!');
  };

  return (
    <section className="container mx-auto px-4 py-8 max-w-6xl text-left animate-fade-in" id="checkout-container-screen">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => {
            if (checkoutStep === 'payment') {
              setCheckoutStep('info');
            } else {
              setIsCheckingOut(false);
            }
          }}
          className="flex items-center gap-1 text-xs font-bold uppercase border border-black py-2 px-4 hover:bg-black hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại {checkoutStep === 'payment' ? 'thông tin nhận hàng' : 'cửa hàng'}
        </button>
        <h2 className="text-2xl font-black uppercase tracking-wider text-black">Thực hiện thanh toán đơn hàng</h2>
      </div>

      {checkoutStep === 'completed' ? (
        <div className="text-center py-16 border-2 border-black bg-zinc-50 max-w-2xl mx-auto px-6">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-wider text-black">Đặt hàng thành công!</h3>
          <p className="text-xs text-zinc-500 mt-2">
            Đơn hàng của bạn đã được khởi tạo thành công trên hệ thống IVY moda.
          </p>

          <div className="bg-white border border-black p-4 text-left my-6 space-y-2 text-xs">
            <p className="font-bold border-b pb-2 mb-2 uppercase text-center text-zinc-500">Biên lai điện tử / Phiếu xuất kho</p>
            <p><strong>Người nhận:</strong> {shippingName}</p>
            <p><strong>Số điện thoại:</strong> {shippingPhone}</p>
            <p><strong>Địa chỉ:</strong> {shippingStreet}, {shippingDistrict}, {shippingProvince === 'Khác' ? customProvince : shippingProvince}</p>
            <p><strong>Đối tác vận chuyển:</strong> {shippingCarrier}</p>
            <p className="border-t pt-2 mt-2">
              <strong>Ưu đãi đã áp dụng:</strong> {appliedDiscount ? `${appliedDiscount.code} (${appliedDiscount.description})` : 'Không có'}
            </p>
            <p className="text-sm font-black text-black">
              <strong>Đã thanh toán (Ước tính):</strong> {formatPrice(finalTotal)}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-300 p-3 text-left mb-6 text-[11px] text-amber-800 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Chúng tôi đã gửi một email xác thực cùng hóa đơn PDF chi tiết đến hòm thư đã đăng ký của bạn. Bạn có thể theo dõi hành trình đơn hàng tại mục Lịch sử mua hàng.</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={() => {
                setIsCheckingOut(false);
                setShowOrdersHistory(true);
              }}
              className="bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition cursor-pointer"
            >
              Xem lịch sử đơn hàng
            </button>
            <button 
              onClick={() => {
                setIsCheckingOut(false);
              }}
              className="border border-black bg-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-zinc-100 transition cursor-pointer"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Columns - Form Inputs */}
          <div className="lg:col-span-7 space-y-6">
            <CheckoutSteps checkoutStep={checkoutStep} />

            {checkoutStep === 'info' ? (
              <form onSubmit={handleProceedToPayment} className="space-y-4">
                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-2">Địa chỉ giao hàng</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1">Họ tên người nhận *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nhập họ tên người nhận hàng"
                      value={shippingName}
                      onChange={(e) => setShippingName(e.target.value)}
                      className="w-full border border-black p-3 text-xs focus:ring-1 focus:ring-black outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1">Số điện thoại liên hệ *</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="Nhập số điện thoại"
                      value={shippingPhone}
                      onChange={(e) => setShippingPhone(e.target.value)}
                      className="w-full border border-black p-3 text-xs focus:ring-1 focus:ring-black outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1">Tỉnh / Thành phố *</label>
                    <select 
                      value={shippingProvince}
                      onChange={(e) => setShippingProvince(e.target.value)}
                      className="w-full border border-black p-3 text-xs focus:ring-1 focus:ring-black outline-none bg-white"
                    >
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="Đà Nẵng">Đà Nẵng</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                      <option value="Cần Thơ">Cần Thơ</option>
                      <option value="Khác">Khu vực Khác (Tỉnh khác)</option>
                    </select>
                    {shippingProvince === 'Khác' && (
                      <div className="mt-2">
                        <input 
                          type="text"
                          required
                          placeholder="Nhập tên tỉnh/thành phố"
                          value={customProvince}
                          onChange={(e) => setCustomProvince(e.target.value)}
                          className="w-full border border-black p-3 text-xs focus:ring-1 focus:ring-black outline-none bg-white font-semibold"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1">Quận / Huyện *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Quận / Huyện"
                      value={shippingDistrict}
                      onChange={(e) => setShippingDistrict(e.target.value)}
                      className="w-full border border-black p-3 text-xs focus:ring-1 focus:ring-black outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1">Địa chỉ cụ thể *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Số nhà, tên đường, xã phường"
                      value={shippingStreet}
                      onChange={(e) => setShippingStreet(e.target.value)}
                      className="w-full border border-black p-3 text-xs focus:ring-1 focus:ring-black outline-none bg-white"
                    />
                  </div>
                </div>

                <hr className="border-zinc-200 my-6" />

                <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-2">Đơn vị vận chuyển liên kết</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className={`border p-4 flex flex-col justify-between cursor-pointer transition relative ${shippingCarrier === 'Giao Hàng Nhanh' ? 'border-black bg-zinc-50' : 'border-zinc-200'}`}>
                    <input 
                      type="radio" 
                      name="carrier" 
                      checked={shippingCarrier === 'Giao Hàng Nhanh'}
                      onChange={() => setShippingCarrier('Giao Hàng Nhanh')}
                      className="absolute top-4 right-4 accent-black"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase">Giao Hàng Nhanh (GHN)</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Giao hỏa tốc liên tỉnh</p>
                    </div>
                    <p className="text-xs font-bold mt-4 text-[#b41b1b]">+{formatPrice(selectedShippingRate.fee)}</p>
                  </label>

                  <label className={`border p-4 flex flex-col justify-between cursor-pointer transition relative ${shippingCarrier === 'Giao Hàng Tiết Kiệm' ? 'border-black bg-zinc-50' : 'border-zinc-200'}`}>
                    <input 
                      type="radio" 
                      name="carrier" 
                      checked={shippingCarrier === 'Giao Hàng Tiết Kiệm'}
                      onChange={() => setShippingCarrier('Giao Hàng Tiết Kiệm')}
                      className="absolute top-4 right-4 accent-black"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase">Giao Hàng Tiết Kiệm</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Cước phí tối ưu</p>
                    </div>
                    <p className="text-xs font-bold mt-4 text-[#b41b1b]">+{formatPrice(Math.round(selectedShippingRate.fee * 0.95))}</p>
                  </label>

                  <label className={`border p-4 flex flex-col justify-between cursor-pointer transition relative ${shippingCarrier === 'Viettel Post' ? 'border-black bg-zinc-50' : 'border-zinc-200'}`}>
                    <input 
                      type="radio" 
                      name="carrier" 
                      checked={shippingCarrier === 'Viettel Post'}
                      onChange={() => setShippingCarrier('Viettel Post')}
                      className="absolute top-4 right-4 accent-black"
                    />
                    <div>
                      <p className="text-xs font-bold uppercase">Viettel Post</p>
                      <p className="text-[10px] text-zinc-400 mt-1">Mạng lưới bưu cục lớn</p>
                    </div>
                    <p className="text-xs font-bold mt-4 text-[#b41b1b]">+{formatPrice(selectedShippingRate.fee)}</p>
                  </label>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-[#000000] text-white p-4 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Tiếp tục đến phương thức thanh toán <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-3">Thông tin nhận hàng</h3>
                  <div className="bg-zinc-50 p-4 text-xs space-y-1.5 border border-zinc-200">
                    <p><strong>Họ tên:</strong> {shippingName}</p>
                    <p><strong>Số điện thoại:</strong> {shippingPhone}</p>
                    <p><strong>Địa chỉ nhận:</strong> {shippingStreet}, {shippingDistrict}, {shippingProvince === 'Khác' ? customProvince : shippingProvince}</p>
                    <p><strong>Đơn vị vận chuyển:</strong> {shippingCarrier} (Dự kiến nhận sau {selectedShippingRate.days})</p>
                    <button 
                      onClick={() => setCheckoutStep('info')} 
                      className="text-xs font-bold text-[#b41b1b] underline mt-2 uppercase tracking-wide block cursor-pointer"
                    >
                      Thay đổi địa chỉ nhận hàng
                    </button>
                  </div>
                </div>

                <hr className="border-zinc-200" />

                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-3">Chọn phương thức thanh toán</h3>
                  
                  <div className="space-y-3">
                    <label className={`border p-4 flex items-start gap-3 cursor-pointer transition ${paymentMethod === 'COD' ? 'border-black bg-zinc-50' : 'border-zinc-200'}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="accent-black mt-1"
                      />
                      <div>
                        <p className="text-xs font-bold uppercase">Thanh toán khi nhận hàng (COD)</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Thanh toán bằng tiền mặt khi shipper giao hàng tận nơi cho bạn.</p>
                      </div>
                    </label>

                    <label className={`border p-4 flex items-start gap-3 cursor-pointer transition ${paymentMethod === 'QR' ? 'border-black bg-zinc-50' : 'border-zinc-200'}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'QR'}
                        onChange={() => setPaymentMethod('QR')}
                        className="accent-black mt-1"
                      />
                      <div>
                        <p className="text-xs font-bold uppercase flex items-center gap-2">
                          Quét mã chuyển khoản VietQR instant 
                          <span className="bg-red-100 text-[#b41b1b] text-[9px] font-bold px-1.5 py-0.5 uppercase tracking-wide">Tự động xác thực</span>
                        </p>
                        <p className="text-[10px] text-zinc-500 mt-1">Xác nhận thanh toán ngay lập tức nhờ hệ thống API kiểm tra giao dịch tự động.</p>
                      </div>
                    </label>

                    <label className={`border p-4 flex items-start gap-3 cursor-pointer transition ${paymentMethod === 'CreditCard' ? 'border-black bg-zinc-50' : 'border-zinc-200'}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        checked={paymentMethod === 'CreditCard'}
                        onChange={() => setPaymentMethod('CreditCard')}
                        className="accent-black mt-1"
                      />
                      <div>
                        <p className="text-xs font-bold uppercase">Thẻ quốc tế Visa, Mastercard, JCB</p>
                        <p className="text-[10px] text-zinc-500 mt-1">Cổng thanh toán quốc tế mã hóa bảo mật tuyệt đối 256-bit.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {paymentMethod === 'QR' && (
                  <div className="bg-zinc-50 border border-zinc-200 p-4 text-xs space-y-3">
                    <p className="font-bold uppercase text-[#b41b1b]">Hướng dẫn thanh toán QR:</p>
                    <p className="text-zinc-600">Khi bạn nhấn nút <strong>"Đặt hàng và thanh toán"</strong> bên dưới, hệ thống sẽ tự động sinh mã VietQR với chính xác tổng tiền đơn hàng để bạn mở ứng dụng ngân hàng quét mã chuyển khoản.</p>
                    {isQRPaid && (
                      <div className="bg-emerald-100 text-emerald-800 p-3 font-bold uppercase flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Giao dịch đã được thanh toán trực tuyến thành công!</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-4">
                  <button 
                    onClick={handlePlaceOrder}
                    className="w-full bg-[#b41b1b] text-white p-4 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {paymentMethod === 'QR' && !isQRPaid ? 'Mở mã QR thanh toán trực tuyến' : 'Xác nhận đặt hàng và hoàn tất'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <CheckoutOrderSummary
            cart={cart}
            cartItemCount={cartItemCount}
            cartSubtotal={cartSubtotal}
            appliedDiscount={appliedDiscount}
            discountCodeInput={discountCodeInput}
            discountError={discountError}
            discountAmount={discountAmount}
            shippingFee={shippingFee}
            finalTotal={finalTotal}
            setDiscountCodeInput={setDiscountCodeInput}
            applyDiscountCode={applyDiscountCode}
            removeDiscountCode={removeDiscountCode}
            formatPrice={formatPrice}
          />

        </div>
      )}

      {/* QR Code Simulation Overlay Modal */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black max-w-sm w-full p-6 text-center space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold uppercase text-zinc-400">VietQR Instant Transfer</span>
              <button onClick={() => setShowQRModal(false)} className="text-zinc-400 hover:text-black cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-50 p-4 border rounded">
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Ngân hàng thụ hưởng</p>
              <p className="text-xs font-black">Ngân hàng Quân Đội (MB Bank)</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase mt-2">Số tài khoản</p>
              <p className="text-sm font-black font-mono">0329188889999</p>
              <p className="text-[10px] text-zinc-400 font-bold uppercase mt-2">Số tiền chuyển khoản</p>
              <p className="text-lg font-black text-[#b41b1b]">{formatPrice(finalTotal)}</p>
            </div>

            {/* Fake dynamic QR code generated using standard API or mock frame */}
            <div className="relative aspect-square w-48 mx-auto bg-white border p-2 flex items-center justify-center">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=210285_MBBank_0329188889999_${finalTotal}_IVYMODA`} 
                alt="VietQR Transfer" 
                className="w-full h-full object-contain"
              />
              {isQRPaid && (
                <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center space-y-2 animate-fade-in">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 animate-bounce" />
                  <span className="text-xs font-bold uppercase text-emerald-800">Đã nhận chuyển khoản</span>
                </div>
              )}
            </div>

            <div className="text-xs text-zinc-500 space-y-1">
              <p>Mã chuyển khoản hết hạn sau: <span className="font-bold text-red-500 font-mono">{Math.floor(qrTimer / 60)}:{(qrTimer % 60).toString().padStart(2, '0')}</span></p>
              <p className="text-[10px] text-zinc-400 italic">Mở ứng dụng Mobile Banking của mọi ngân hàng để quét mã này.</p>
            </div>

            <div className="bg-amber-50 text-[10px] text-amber-800 p-2.5 rounded border border-amber-200">
              ⚡ Hệ thống đang lắng nghe tài khoản nhận tiền qua Smart API MBBank...
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
