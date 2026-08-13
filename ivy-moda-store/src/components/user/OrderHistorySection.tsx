import React from 'react';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { OrderHistory } from '../../types';

interface OrderHistorySectionProps {
  orders: OrderHistory[];
  setShowOrdersHistory: (show: boolean) => void;
  formatPrice: (num: number) => string;
}

export default function OrderHistorySection({
  orders,
  setShowOrdersHistory,
  formatPrice,
}: OrderHistorySectionProps) {
  return (
    <section className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in text-left" id="orders-history-section">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => setShowOrdersHistory(false)} 
          className="flex items-center gap-1 text-xs font-bold uppercase border border-black py-2 px-4 hover:bg-black hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Tiếp tục mua sắm
        </button>
        <h2 className="text-2xl font-black uppercase tracking-wider text-black">Lịch sử đơn hàng của bạn</h2>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 border border-zinc-200 bg-zinc-50">
          <ShoppingBag className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <p className="text-sm text-zinc-500 font-bold">Bạn chưa có đơn hàng nào được thực hiện.</p>
          <p className="text-xs text-zinc-400 mt-1">Hãy khám phá các bộ sưu tập thời trang của IVY moda.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="border-2 border-black p-5 bg-white relative hover:border-zinc-800 transition">
              <div className="flex flex-col md:flex-row justify-between md:items-center border-b border-zinc-200 pb-3 mb-4 gap-2">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase">Mã đơn hàng</p>
                  <p className="text-sm font-black text-black">{order.id}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase">Ngày đặt hàng</p>
                  <p className="text-sm font-bold text-black">{order.date}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase">Trạng thái vận chuyển</p>
                  <span className="inline-block mt-1 text-[11px] font-bold uppercase bg-[#b41b1b] text-white px-2 py-1 rounded">
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold uppercase text-black">{item.productName}</p>
                      <p className="text-zinc-500 text-[10px]">
                        SKU: {item.sku} | Màu: {item.color} | Size: {item.size}
                      </p>
                    </div>
                    <p className="font-bold text-black">{item.quantity} x {formatPrice(item.price)}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-zinc-200 pt-3 flex flex-col md:flex-row justify-between text-xs gap-3">
                <div>
                  <p className="font-bold uppercase text-zinc-500">Địa chỉ giao nhận:</p>
                  <p className="text-zinc-700 mt-1">{order.shippingAddress}</p>
                  <p className="font-bold uppercase text-zinc-500 mt-2">Hình thức thanh toán:</p>
                  <p className="text-zinc-700 mt-1">{order.paymentMethod}</p>
                </div>
                <div className="text-right border-t md:border-t-0 border-zinc-200 pt-3 md:pt-0">
                  <p className="text-zinc-500">Tạm tính: {formatPrice(order.subtotal)}</p>
                  {order.discount > 0 && (
                    <p className="text-[#b41b1b]">Khuyến mãi: -{formatPrice(order.discount)}</p>
                  )}
                  <p className="text-zinc-500">Phí giao hàng: {formatPrice(order.shippingFee)}</p>
                  <p className="text-sm font-black text-black mt-2 uppercase tracking-wide">
                    Tổng thanh toán: {formatPrice(order.total)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
