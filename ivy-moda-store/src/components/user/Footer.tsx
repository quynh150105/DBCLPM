import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-10 pb-6 border-t-2 border-black animate-fade-in" id="applet-main-footer">
      <div className="container mx-auto px-4 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-zinc-400">
        
        <div className="space-y-4">
          <h4 className="text-base font-black text-white tracking-[0.15em] uppercase">IVY moda</h4>
          <p className="leading-relaxed">
            Thương hiệu thời trang xu hướng hàng đầu Việt Nam. Mang phong cách thanh lịch, sang trọng và hiện đại tới phái đẹp, phái mạnh và trẻ em Việt.
          </p>
          <div className="flex gap-3">
            <span className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition cursor-pointer font-bold">F</span>
            <span className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition cursor-pointer font-bold">Y</span>
            <span className="w-8 h-8 rounded-full border border-zinc-800 flex items-center justify-center hover:bg-white hover:text-black transition cursor-pointer font-bold">I</span>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="font-bold text-white uppercase tracking-wider">Hỗ Trợ Khách Hàng</h5>
          <ul className="space-y-1.5 text-left">
            <li><button className="hover:text-white transition">Chính sách giao nhận vận chuyển</button></li>
            <li><button className="hover:text-white transition">Chính sách đổi trả hoàn tiền</button></li>
            <li><button className="hover:text-white transition">Bảo mật thông tin cá nhân</button></li>
            <li><button className="hover:text-white transition">Hướng dẫn chọn size chuẩn</button></li>
            <li><button className="hover:text-white transition">Tra cứu hóa đơn điện tử VAT</button></li>
          </ul>
        </div>

        <div className="space-y-3">
          <h5 className="font-bold text-white uppercase tracking-wider">Về IVY Moda</h5>
          <ul className="space-y-1.5 text-left">
            <li><button className="hover:text-white transition">Giới thiệu thương hiệu</button></li>
            <li><button className="hover:text-white transition">Tin tức thời trang xu hướng</button></li>
            <li><button className="hover:text-white transition">Liên hệ hợp tác &amp; Nhượng quyền</button></li>
            <li><button className="hover:text-white transition">Tuyển dụng vị trí mới nhất</button></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h5 className="font-bold text-white uppercase tracking-wider">Thông Tin Liên Hệ</h5>
          <p className="leading-relaxed">
            Mọi thắc mắc và góp ý vui lòng liên hệ dịch vụ chăm sóc khách hàng của chúng tôi qua hotline hoặc email dưới đây.
          </p>
          <div className="pt-1.5 space-y-1 text-left font-bold text-zinc-300">
            <p>Hotline: 0246 662 3434</p>
            <p>Email: cskh@ivymoda.com.vn</p>
          </div>
        </div>

      </div>

      {/* Bottom footer credit bar */}
      <div className="container mx-auto px-4 md:px-12 mt-8 pt-6 border-t border-zinc-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-zinc-600">
        <p>© 2026 IVY moda. All Rights Reserved. Bản quyền thuộc về IVY moda. Đã đăng ký bộ Công Thương.</p>
        <div className="flex gap-4">
          <span>Hotline: 0246 662 3434</span>
          <span>Email: cskh@ivymoda.com.vn</span>
        </div>
      </div>
    </footer>
  );
}
