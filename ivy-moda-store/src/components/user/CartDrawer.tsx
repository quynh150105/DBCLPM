import React from 'react';
import { X, ShoppingBag, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { CartItem } from '../../types';

interface CartDrawerProps {
  cart: CartItem[];
  setShowCartDrawer: (show: boolean) => void;
  cartItemCount: number;
  cartSubtotal: number;
  handleRemoveCartItem: (idx: number) => void;
  handleUpdateCartQty: (idx: number, delta: number) => void;
  setIsCheckingOut: (checkout: boolean) => void;
  setCheckoutStep: (step: 'info' | 'payment' | 'completed') => void;
  formatPrice: (num: number) => string;
}

export default function CartDrawer({
  cart,
  setShowCartDrawer,
  cartItemCount,
  cartSubtotal,
  handleRemoveCartItem,
  handleUpdateCartQty,
  setIsCheckingOut,
  setCheckoutStep,
  formatPrice,
}: CartDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end text-left" id="cart-drawer-overlay">
      <div className="bg-white max-w-md w-full h-full flex flex-col justify-between border-l-2 border-black animate-slide-left relative">
        
        {/* Drawer Header */}
        <div className="p-5 border-b-2 border-black flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h3 className="text-sm font-black uppercase tracking-wider">Giỏ Hàng Của Bạn ({cartItemCount})</h3>
          </div>
          <button 
            onClick={() => setShowCartDrawer(false)}
            className="p-1 border border-black hover:bg-black hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body list */}
        <div className="flex-1 overflow-y-auto p-5 divide-y divide-zinc-200">
          {cart.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <ShoppingBag className="w-12 h-12 text-zinc-300 mx-auto" />
              <p className="text-xs font-bold text-zinc-400 uppercase">Giỏ hàng rỗng</p>
              <p className="text-[11px] text-zinc-400">Quý khách vui lòng chọn thêm sản phẩm thời trang vào giỏ.</p>
              <button 
                onClick={() => setShowCartDrawer(false)}
                className="mt-4 bg-black text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 hover:opacity-85 cursor-pointer"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            cart.map((item, idx) => {
              const itemTotal = item.product.price * item.quantity;
              return (
                <div key={idx} className="py-4 flex gap-4 text-xs">
                  <img 
                    src={item.product.images[0]} 
                    alt={item.product.name} 
                    className="w-16 h-20 object-cover bg-zinc-100 border border-zinc-200"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold uppercase line-clamp-2 text-black">{item.product.name}</h4>
                        <button 
                          onClick={() => handleRemoveCartItem(idx)}
                          className="text-zinc-400 hover:text-[#b41b1b] shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">
                        Màu: {item.selectedColor} | Size: {item.selectedSize}
                      </p>
                    </div>

                    {/* Qty edit and sum */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center border border-black">
                        <button 
                          onClick={() => handleUpdateCartQty(idx, -1)}
                          className="px-2 py-1 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-0.5 text-xs font-bold text-black">{item.quantity}</span>
                        <button 
                          onClick={() => handleUpdateCartQty(idx, 1)}
                          className="px-2 py-1 text-zinc-600 hover:bg-zinc-100 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-black text-black">{formatPrice(itemTotal)}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t-2 border-black bg-zinc-50 space-y-4">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 font-bold uppercase">Tổng tiền hàng:</span>
              <span className="text-sm font-black text-black">{formatPrice(cartSubtotal)}</span>
            </div>
            
            <p className="text-[10px] text-zinc-400 text-center leading-relaxed">
              Phí giao hàng và mã giảm giá sẽ được tính toán trực tiếp khi thực hiện quy trình Đặt hàng.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowCartDrawer(false);
                  setIsCheckingOut(true);
                  setCheckoutStep('info');
                }}
                className="w-full bg-[#b41b1b] text-white py-4 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                Tiến hành đặt hàng (Checkout) <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="w-full bg-white text-black border border-black py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-zinc-100 transition cursor-pointer"
              >
                Mua thêm sản phẩm khác
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
