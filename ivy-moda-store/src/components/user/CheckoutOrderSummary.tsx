import { X } from 'lucide-react';
import { CartItem, DiscountCode } from '../../types';

interface CheckoutOrderSummaryProps {
  cart: CartItem[];
  cartItemCount: number;
  cartSubtotal: number;
  appliedDiscount: DiscountCode | null;
  discountCodeInput: string;
  discountError: string;
  discountAmount: number;
  shippingFee: number;
  finalTotal: number;
  setDiscountCodeInput: (value: string) => void;
  applyDiscountCode: () => void;
  removeDiscountCode: () => void;
  formatPrice: (num: number) => string;
}

export default function CheckoutOrderSummary({
  cart,
  cartItemCount,
  cartSubtotal,
  appliedDiscount,
  discountCodeInput,
  discountError,
  discountAmount,
  shippingFee,
  finalTotal,
  setDiscountCodeInput,
  applyDiscountCode,
  removeDiscountCode,
  formatPrice,
}: CheckoutOrderSummaryProps) {
  return (
    <div className="lg:col-span-5 border-l-2 border-black pl-0 lg:pl-8 space-y-6">
      <h3 className="text-sm font-black uppercase tracking-wider text-black border-b border-black pb-2">Tóm tắt đơn hàng ({cartItemCount} sản phẩm)</h3>

      <div className="divide-y divide-zinc-200 max-h-[300px] overflow-y-auto pr-2">
        {cart.map((item, idx) => (
          <div key={idx} className="py-3 flex gap-3 text-xs">
            <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-16 object-cover bg-zinc-100" />
            <div className="flex-1">
              <p className="font-bold uppercase line-clamp-1">{item.product.name}</p>
              <p className="text-zinc-500 text-[10px] mt-0.5">
                SKU: {item.product.sku} | Màu: {item.selectedColor} | Size: {item.selectedSize}
              </p>
              <p className="font-bold mt-1">{item.quantity} x {formatPrice(item.product.price)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-zinc-200">
        <p className="text-[11px] font-bold uppercase mb-2">Mã giảm giá / Voucher</p>
        {appliedDiscount ? (
          <div className="bg-zinc-50 p-3 border border-black flex justify-between items-center text-xs">
            <div>
              <p className="font-bold text-[#b41b1b] uppercase">Mã: {appliedDiscount.code}</p>
              <p className="text-[10px] text-zinc-500 mt-0.5">{appliedDiscount.description}</p>
            </div>
            <button onClick={removeDiscountCode} className="text-zinc-400 hover:text-black cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã (Ví dụ: IVYNEW10, FREESHIP)"
              value={discountCodeInput}
              onChange={(e) => setDiscountCodeInput(e.target.value)}
              className="flex-1 border border-black p-2 text-xs uppercase outline-none"
            />
            <button onClick={applyDiscountCode} className="bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition cursor-pointer">
              Áp dụng
            </button>
          </div>
        )}
        {discountError && <p className="text-[11px] text-red-500 mt-1 font-bold">{discountError}</p>}

        <div className="mt-2 bg-zinc-50 p-2 text-[10px] text-zinc-500 space-y-1 border border-zinc-100">
          <p className="font-bold text-zinc-600">Gợi ý mã khuyến mãi:</p>
          <p>• <strong>IVYNEW10</strong>: Giảm 10% tổng đơn cho khách hàng mới</p>
          <p>• <strong>FREESHIP</strong>: Giảm trực tiếp 40.000đ phí vận chuyển</p>
          <p>• <strong>IVYVIP100K</strong>: Giảm ngay 100.000đ</p>
        </div>
      </div>

      <div className="border-t-2 border-black pt-4 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-zinc-500">Tạm tính:</span>
          <span className="font-bold">{formatPrice(cartSubtotal)}</span>
        </div>
        {appliedDiscount && (
          <div className="flex justify-between text-[#b41b1b]">
            <span>Khuyến mãi ({appliedDiscount.code}):</span>
            <span className="font-bold">-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-zinc-500">Phí giao hàng:</span>
          <span className="font-bold font-mono">
            {shippingFee === 0 ? (
              <span className="text-emerald-600 uppercase text-[10px] font-bold font-sans">Miễn phí</span>
            ) : (
              formatPrice(shippingFee)
            )}
          </span>
        </div>
        {cartSubtotal < 1000000 && (
          <p className="text-[9px] text-zinc-400 text-right">Mua thêm {formatPrice(1000000 - cartSubtotal)} để được miễn phí vận chuyển!</p>
        )}
        <div className="border-t border-black pt-3 flex justify-between text-sm font-black uppercase tracking-wider">
          <span>Tổng thanh toán:</span>
          <span className="text-lg text-black">{formatPrice(finalTotal)}</span>
        </div>
      </div>
    </div>
  );
}
