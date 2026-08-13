import React from 'react';
import { MapPin, User, ShoppingBag } from 'lucide-react';
import { UserSession } from '../../types';

interface HeaderProps {
  currentCategory: string;
  setCurrentCategory: (cat: string) => void;
  categories: string[];
  setActiveSubCategory: (subCat: string) => void;
  setSearchQuery: (query: string) => void;
  setIsCheckingOut: (check: boolean) => void;
  setShowOrdersHistory: (show: boolean) => void;
  setShowUserProfile: (show: boolean) => void;
  currentUser: UserSession | null;
  handleLogout: () => void;
  ordersCount: number;
  cartItemCount: number;
  setShowCartDrawer: (show: boolean) => void;
  setAuthTab: (tab: 'login' | 'register') => void;
  setShowAuthModal: (show: boolean) => void;
}

export default function Header({
  currentCategory,
  setCurrentCategory,
  categories,
  setActiveSubCategory,
  setSearchQuery,
  setIsCheckingOut,
  setShowOrdersHistory,
  setShowUserProfile,
  currentUser,
  handleLogout,
  ordersCount,
  cartItemCount,
  setShowCartDrawer,
  setAuthTab,
  setShowAuthModal,
}: HeaderProps) {
  const resetAllViews = () => {
    setCurrentCategory('Tất cả');
    setActiveSubCategory('Tất cả');
    setSearchQuery('');
    setIsCheckingOut(false);
    setShowOrdersHistory(false);
    setShowUserProfile(false);
  };

  return (
    <>
      {/* Top running promotion ticker */}
      <div className="bg-[#000000] text-white py-2 px-4 text-center text-[11px] font-bold tracking-[0.2em] uppercase overflow-hidden whitespace-nowrap border-b border-zinc-800">
        <div className="inline-block animate-marquee">
          🖤 MIỄN PHÍ GIAO HÀNG TOÀN QUỐC CHO ĐƠN HÀNG TRÊN 1.000.000Đ — IVY MODA NEW COLLECTION 2026 🖤
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white border-b-2 border-[#000000] px-4 md:px-12 py-5 flex items-center justify-between">
        {/* Brand Logo in Bold Typography style */}
        <div 
          onClick={resetAllViews}
          className="text-2xl md:text-3xl font-black tracking-[0.15em] text-[#000000] cursor-pointer hover:opacity-80 transition duration-200 uppercase select-none"
          id="header-brand-logo"
        >
          IVY moda
        </div>

        {/* Categories navigation */}
        <nav className="hidden lg:flex items-center gap-8 text-[13px] font-bold uppercase tracking-[0.1em]" id="header-nav-categories">
          {['Tất cả', ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCurrentCategory(cat);
                setActiveSubCategory('Tất cả');
                setIsCheckingOut(false);
                setShowOrdersHistory(false);
                setShowUserProfile(false);
              }}
              className={`pb-1 border-b-2 transition duration-200 ${
                currentCategory === cat 
                  ? 'border-[#000000] text-[#000000]' 
                  : 'border-transparent text-zinc-500 hover:text-[#000000]'
              }`}
            >
              {cat}
            </button>
          ))}
        </nav>

        {/* Action icons right-aligned */}
        <div className="flex items-center gap-3 md:gap-5" id="header-action-container">
          
          {/* User account auth controls */}
          {currentUser ? (
            <div className="relative group">
              <button 
                onClick={() => { setShowUserProfile(true); setShowOrdersHistory(false); setIsCheckingOut(false); }}
                className="flex items-center gap-1 p-2 hover:bg-zinc-100 rounded text-xs font-bold uppercase border border-black transition"
                id="logged-in-user-menu"
              >
                <User className="w-4 h-4" />
                <span className="hidden md:inline max-w-[100px] truncate">{currentUser.name}</span>
              </button>
              
              <div className="absolute right-0 mt-1 w-48 bg-white border border-black shadow-lg py-2 hidden group-hover:block z-50">
                <button 
                  onClick={() => { setShowUserProfile(true); setShowOrdersHistory(false); setIsCheckingOut(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-100 text-zinc-800"
                >
                  Thông tin cá nhân
                </button>
                <button 
                  onClick={() => { setShowOrdersHistory(true); setIsCheckingOut(false); setShowUserProfile(false); }}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase hover:bg-zinc-100 border-t border-zinc-100"
                >
                  Lịch sử mua hàng ({ordersCount})
                </button>
                <hr className="border-zinc-200" />
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-xs font-bold uppercase text-[#b41b1b] hover:bg-red-50"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => { setAuthTab('login'); setShowAuthModal(true); }}
              className="p-2 hover:bg-zinc-100 rounded-full text-zinc-800 transition duration-150"
              title="Đăng nhập / Đăng ký"
              id="login-modal-trigger"
            >
              <User className="w-5 h-5" />
            </button>
          )}

          {/* Cart triggers */}
          <button 
            onClick={() => setShowCartDrawer(true)}
            className="p-2 hover:bg-zinc-100 rounded-full text-zinc-800 relative transition duration-150"
            id="cart-drawer-trigger"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#b41b1b] text-white text-[10px] w-5 h-5 font-bold flex items-center justify-center rounded-full border-2 border-white animate-pulse">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Header Secondary Alert (Customer support banner prompt) */}
      <div className="bg-zinc-100 text-center py-2 text-[11px] font-semibold text-zinc-700 flex justify-center items-center gap-2">
        <span>📍 Hệ thống bán hàng online chính hãng IVY moda phục vụ toàn quốc. Hotline hỗ trợ 24/7: <strong>0246 662 3434</strong></span>
      </div>
    </>
  );
}
