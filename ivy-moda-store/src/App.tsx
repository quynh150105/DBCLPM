import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { PRODUCTS, Product } from './data';
import { OrderHistory, UserSession } from './types';
import AdminPanel from './components/admin/AdminPanel';
import UserStore from './components/user/UserStore';

export default function App() {
  // Global Shared States
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  
  // View Router State
  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  
  // Global Floating Alert States
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const triggerAlert = (type: 'success' | 'error' | 'info', text: string) => {
    setAlertMsg({ type, text });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4000);
  };

  const formatPrice = (num: number) => {
    return num.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // 1. Initial Caching & API synchronization
  useEffect(() => {
    const savedUser = sessionStorage.getItem('ivy_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
        if (parsed && parsed.role === 'admin') {
          setShowAdminPanel(true);
        }
      } catch (e) {
        console.error('Failed to parse cached user:', e);
      }
    }

    const savedOrders = sessionStorage.getItem('ivy_orders');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error('Failed to parse cached orders:', e);
      }
    }

    // Dynamic Database synchronization (Products)
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => setProductsList(data))
      .catch(() => console.log('Products loaded from offline dataset fallback'));
  }, []);

  // 2. Sync Personal Order History when authenticated user changes
  useEffect(() => {
    if (currentUser && currentUser.email) {
      sessionStorage.setItem('ivy_user', JSON.stringify(currentUser));
      
      // Automatically route user to admin panel if they are admin
      if (currentUser.role === 'admin') {
        setShowAdminPanel(true);
      } else {
        setShowAdminPanel(false);
      }
      
      fetch(`/api/orders?email=${encodeURIComponent(currentUser.email.toLowerCase().trim())}`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          const formatted = data.map((o: any) => ({
            id: o.id || o.orderId,
            date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : ""),
            items: Array.isArray(o.items) ? o.items : [],
            subtotal: o.subtotal || 0,
            shippingFee: o.shippingFee !== undefined ? o.shippingFee : 22000,
            discount: o.discount !== undefined ? o.discount : 0,
            total: o.totalAmount || o.total || 0,
            shippingAddress: o.shippingAddress || "",
            paymentMethod: o.paymentMethod || "",
            status: o.status || "Đang xử lý",
            customerEmail: o.customerEmail || ""
          }));
          
          // Deduplicate order list
          const uniqueOrders = formatted.filter(
            (v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i
          );
          setOrders(uniqueOrders);
          sessionStorage.setItem('ivy_orders', JSON.stringify(uniqueOrders));
        })
        .catch(err => {
          console.error("Failed to sync personal order history:", err);
          const cached = sessionStorage.getItem('ivy_orders');
          if (cached) {
            setOrders(JSON.parse(cached));
          }
        });
    } else {
      sessionStorage.removeItem('ivy_user');
      setOrders([]);
      setShowAdminPanel(false);
    }
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-white text-[#000000] font-sans antialiased selection:bg-black selection:text-white relative">
      
      {/* Dynamic View Navigation */}
      {showAdminPanel ? (
        <AdminPanel
          productsList={productsList}
          setProductsList={setProductsList}
          setOrders={setOrders}
          triggerAlert={triggerAlert}
          formatPrice={formatPrice}
          setShowAdminPanel={setShowAdminPanel}
          setCurrentUser={setCurrentUser}
        />
      ) : (
        <UserStore
          productsList={productsList}
          orders={orders}
          setOrders={setOrders}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          setShowAdminPanel={setShowAdminPanel}
          triggerAlert={triggerAlert}
          formatPrice={formatPrice}
        />
      )}

      {/* Floating alert notifications */}
      {alertMsg && (
        <div 
          className="fixed bottom-6 right-6 z-50 animate-bounce shadow-2xl border-2 border-black bg-white p-4 max-w-sm flex items-start gap-3"
          id="global-floating-alert"
        >
          <AlertCircle className={`w-5 h-5 shrink-0 ${
            alertMsg.type === 'success' 
              ? 'text-emerald-600' 
              : alertMsg.type === 'error' 
                ? 'text-rose-600' 
                : 'text-amber-500'
          }`} />
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-wide">
              {alertMsg.type === 'success' ? 'Thành công' : alertMsg.type === 'error' ? 'Lỗi hệ thống' : 'Thông báo'}
            </p>
            <p className="text-[11px] text-zinc-500 font-bold mt-0.5 leading-relaxed">{alertMsg.text}</p>
          </div>
        </div>
      )}

    </div>
  );
}
