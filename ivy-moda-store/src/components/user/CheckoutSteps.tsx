interface CheckoutStepsProps {
  checkoutStep: 'info' | 'payment' | 'completed';
}

export default function CheckoutSteps({ checkoutStep }: CheckoutStepsProps) {
  return (
    <div className="flex border-b border-black text-xs font-bold">
      <div className={`flex-1 text-center py-3 border-b-2 uppercase ${checkoutStep === 'info' ? 'border-black text-black' : 'border-transparent text-zinc-400'}`}>
        1. Thông tin giao hàng
      </div>
      <div className={`flex-1 text-center py-3 border-b-2 uppercase ${checkoutStep === 'payment' ? 'border-black text-black' : 'border-transparent text-zinc-400'}`}>
        2. Thanh toán &amp; Hoàn tất
      </div>
    </div>
  );
}
