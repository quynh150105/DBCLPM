import { ArrowRight, Info } from 'lucide-react';

type AdminTab = 'dashboard' | 'orders' | 'products' | 'users';

interface AdminSidebarProps {
  activeTab: AdminTab;
  setActiveTab: (tab: AdminTab) => void;
  ordersCount: number;
  productsCount: number;
  usersCount: number;
}

export default function AdminSidebar({
  activeTab,
  setActiveTab,
  ordersCount,
  productsCount,
  usersCount,
}: AdminSidebarProps) {
  const tabClass = (tab: AdminTab) =>
    `w-full text-left p-4 border-2 text-xs font-black uppercase tracking-wider transition duration-150 flex items-center justify-between ${
      activeTab === tab
        ? 'bg-black text-white border-black'
        : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300'
    }`;

  return (
    <div className="lg:col-span-3 space-y-2">
      <button onClick={() => setActiveTab('dashboard')} className={tabClass('dashboard')}>
        <span>📊 Tổng quan thống kê</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <button onClick={() => setActiveTab('orders')} className={tabClass('orders')}>
        <span className="flex items-center gap-2">
          <span>📦 Đơn hàng</span>
          {ordersCount > 0 && (
            <span className="bg-[#b41b1b] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
              {ordersCount}
            </span>
          )}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <button onClick={() => setActiveTab('products')} className={tabClass('products')}>
        <span>🏷️ Danh mục sản phẩm ({productsCount})</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <button onClick={() => setActiveTab('users')} className={tabClass('users')}>
        <span>👥 Quản lý thành viên ({usersCount})</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="bg-amber-50 border border-amber-300 p-4 text-[11px] text-amber-800 space-y-2 mt-6 rounded">
        <p className="font-bold uppercase flex items-center gap-1">
          <Info className="w-4 h-4 shrink-0" /> Hướng dẫn đồng bộ
        </p>
        <p className="leading-relaxed">
          Hệ thống đang được liên kết trực tiếp với cơ sở dữ liệu PostgreSQL trên Railway. Các thay đổi về trạng thái đơn hàng sẽ được cập nhật thời gian thực đến khách hàng.
        </p>
      </div>
    </div>
  );
}
