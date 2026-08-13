import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Trash2, 
  Edit 
} from 'lucide-react';
import { Product, UserSession } from '../../types';
import AdminDashboard from './AdminDashboard';
import AdminSidebar from './AdminSidebar';
import ConfirmDialog from './ConfirmDialog';

interface AdminPanelProps {
  setShowAdminPanel: (show: boolean) => void;
  productsList: Product[];
  setProductsList: React.Dispatch<React.SetStateAction<Product[]>>;
  setOrders: React.Dispatch<React.SetStateAction<any[]>>;
  triggerAlert: (type: 'success' | 'error' | 'info', text: string) => void;
  formatPrice: (num: number) => string;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
}

export default function AdminPanel({
  setShowAdminPanel,
  productsList,
  setProductsList,
  setOrders,
  triggerAlert,
  formatPrice,
  setCurrentUser,
}: AdminPanelProps) {
  const [adminActiveTab, setAdminActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'users'>('dashboard');
  const [adminSearch, setAdminSearch] = useState<string>('');
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>('Tất cả');

  const existingSubcategories = Array.from(
    new Set(productsList.map(p => p.subCategory).filter(Boolean))
  );

  // Localized admin orders state
  const [adminOrders, setAdminOrders] = useState<any[]>([]);

  // Localized admin users state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userSearch, setUserSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('Tất cả');
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const fetchAdminOrders = () => {
    fetch('/api/orders')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setAdminOrders(data);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách đơn hàng cho admin:", err);
      });
  };

  const fetchAdminUsers = () => {
    setLoadingUsers(true);
    fetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setAdminUsers(data);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách thành viên:", err);
      })
      .finally(() => setLoadingUsers(false));
  };

  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState<boolean>(false);
  const [editingProductForm, setEditingProductForm] = useState<{
    id: string;
    name: string;
    sku: string;
    category: string;
    subCategory: string;
    price: string;
    description: string;
    image: string;
    colors: string;
    sizes: string;
  } | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setDbCategories(data);
      }
    } catch (err) {
      console.error("Lỗi lấy danh mục:", err);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          triggerAlert('success', `Đã thêm danh mục "${newCategoryName}" thành công!`);
          setNewCategoryName('');
          setShowAddCategoryModal(false);
          fetchCategories(); // Refresh list
        }
      } else {
        const err = await response.json();
        triggerAlert('error', err.error || 'Thêm danh mục thất bại.');
      }
    } catch (err) {
      console.error("Lỗi thêm danh mục:", err);
      triggerAlert('error', 'Lỗi hệ thống khi thêm danh mục.');
    }
  };

  const handleStartEditProduct = (product: Product) => {
    const colorStr = product.colors.map(c => c.name).join(', ');
    const sizeStr = product.sizes.join(', ');
    
    // Extract existing color images
    const initialColorImages: { [colorName: string]: string } = {};
    product.colors.forEach(c => {
      initialColorImages[c.name] = c.image || '';
    });
    setColorImagesEdit(initialColorImages);

    // Extract existing quantities
    const initialQuantities: { [colorSizeKey: string]: number } = {};
    product.colors.forEach(c => {
      if (c.stock && typeof c.stock === 'object') {
        Object.entries(c.stock).forEach(([sizeName, val]) => {
          if (typeof val === 'boolean') {
            initialQuantities[`${c.name}_${sizeName}`] = val ? 10 : 0;
          } else if (typeof val === 'number') {
            initialQuantities[`${c.name}_${sizeName}`] = val;
          }
        });
      }
    });
    setColorSizeQuantitiesEdit(initialQuantities);

    setEditingProductForm({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      subCategory: product.subCategory,
      price: product.price.toString(),
      description: product.description,
      image: product.images[0] || '',
      colors: colorStr,
      sizes: sizeStr,
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductForm) return;
    const { id, name, sku, category, subCategory, price, description, image, colors, sizes } = editingProductForm;
    if (!name || !sku || !price) {
      triggerAlert('error', 'Vui lòng cung cấp đầy đủ thông tin Tên, SKU và Giá sản phẩm.');
      return;
    }
    const parsedPrice = parseInt(price.replace(/\D/g, '')) || 0;
    
    const colorNames = colors.split(',').map(c => c.trim()).filter(Boolean);
    const parsedSizes = sizes.split(',').map(s => s.trim()).filter(Boolean);

    const parsedColors = colorNames.map(cName => {
      const colImg = colorImagesEdit[cName] || image;
      
      const stockObj: { [size: string]: number } = {};
      parsedSizes.forEach(sName => {
        const key = `${cName}_${sName}`;
        const qty = colorSizeQuantitiesEdit[key] !== undefined ? colorSizeQuantitiesEdit[key] : 10;
        stockObj[sName] = qty;
      });

      return {
        name: cName,
        hex: cName === 'Trắng' ? '#ffffff' : cName === 'Đen' ? '#000000' : cName === 'Đỏ' ? '#b41b1b' : cName === 'Vàng' ? '#eab308' : cName === 'Hồng' ? '#ec4899' : '#cccccc',
        image: colImg,
        images: [colImg],
        stock: stockObj
      };
    });

    const allImages = [image];
    colorNames.forEach(cName => {
      const colImg = colorImagesEdit[cName];
      if (colImg && colImg.trim() && !allImages.includes(colImg)) {
        allImages.push(colImg);
      }
    });

    const updatedProduct = {
      id,
      sku,
      name,
      category: category as any,
      subCategory,
      price: parsedPrice,
      originalPrice: parsedPrice,
      images: allImages,
      colors: parsedColors,
      sizes: parsedSizes,
      description: description || 'Mô tả chi tiết sản phẩm chất lượng cao của IVY moda.'
    };

    try {
      const response = await fetch('/api/products/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: updatedProduct })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newProductsList = productsList.map(p => p.id === id ? {
            ...p,
            sku: data.product.sku || updatedProduct.sku,
            name: data.product.name || updatedProduct.name,
            category: data.product.category || updatedProduct.category,
            subCategory: data.product.subCategory || updatedProduct.subCategory,
            price: data.product.price || updatedProduct.price,
            originalPrice: data.product.originalPrice || updatedProduct.price,
            images: data.product.images || updatedProduct.images,
            colors: data.product.colors || updatedProduct.colors,
            sizes: data.product.sizes || updatedProduct.sizes,
            description: data.product.description || updatedProduct.description
          } : p);
          setProductsList(newProductsList);
          triggerAlert('success', `Đã cập nhật sản phẩm "${name}" thành công!`);
          setEditingProductForm(null);
        } else {
          triggerAlert('error', data.error || 'Cập nhật thất bại.');
        }
      } else {
        const err = await response.json();
        triggerAlert('error', err.error || 'Lỗi lưu sản phẩm vào database.');
      }
    } catch (err) {
      console.error("Lỗi cập nhật sản phẩm:", err);
      triggerAlert('error', 'Lỗi hệ thống khi cập nhật sản phẩm.');
    }
  };

  React.useEffect(() => {
    fetchAdminOrders();
    fetchCategories();
    if (adminActiveTab === 'users') {
      fetchAdminUsers();
    }
  }, [adminActiveTab]);
  
  const [adminNewProduct, setAdminNewProduct] = useState({
    name: '',
    sku: '',
    category: 'Nữ',
    subCategory: 'Áo sơ mi',
    price: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
    colors: 'Trắng, Đen, Đỏ',
    sizes: 'S, M, L, XL'
  });

  const [colorImagesNew, setColorImagesNew] = useState<{ [colorName: string]: string }>({});
  const [colorImagesEdit, setColorImagesEdit] = useState<{ [colorName: string]: string }>({});
  const [colorSizeQuantitiesNew, setColorSizeQuantitiesNew] = useState<{ [colorSizeKey: string]: number }>({});
  const [colorSizeQuantitiesEdit, setColorSizeQuantitiesEdit] = useState<{ [colorSizeKey: string]: number }>({});
  const [isAddingNewSubCategoryNew, setIsAddingNewSubCategoryNew] = useState<boolean>(false);
  const [isAddingNewSubCategoryEdit, setIsAddingNewSubCategoryEdit] = useState<boolean>(false);

  // Update order status on PostgreSQL database via API
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus })
      });
      if (response.ok) {
        triggerAlert('success', `Đã cập nhật trạng thái đơn hàng ${orderId} thành "${newStatus}"!`);
        fetchAdminOrders(); // Refresh all admin orders
        // Also update local personal orders state if needed
        setOrders(prev => prev.map(o => (o.id === orderId || o.orderId === orderId) ? { ...o, status: newStatus as any } : o));
      } else {
        const err = await response.json();
        triggerAlert('error', err.error || 'Cập nhật trạng thái thất bại.');
      }
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái đơn hàng:", err);
      // Fallback local update
      setAdminOrders(prev => prev.map(o => (o.id === orderId || o.orderId === orderId) ? { ...o, status: newStatus } : o));
      setOrders(prev => prev.map(o => (o.id === orderId || o.orderId === orderId) ? { ...o, status: newStatus as any } : o));
      triggerAlert('success', `Cập nhật trạng thái thành công (Chế độ Offline).`);
    }
  };

  // Delete order from PostgreSQL database via API
  const handleDeleteOrder = async (orderId: string) => {
    setConfirmDialog({
      title: 'Xác nhận xóa đơn hàng',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng ${orderId}?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/orders/${orderId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            triggerAlert('success', `Đã xóa đơn hàng ${orderId} thành công!`);
            fetchAdminOrders(); // Refresh
            setOrders(prev => prev.filter(o => o.id !== orderId && o.orderId !== orderId));
          } else {
            const err = await response.json();
            triggerAlert('error', err.error || 'Xóa đơn hàng thất bại.');
          }
        } catch (err) {
          console.error("Lỗi xóa đơn hàng:", err);
          // Fallback local deletion
          setAdminOrders(prev => prev.filter(o => o.id !== orderId && o.orderId !== orderId));
          setOrders(prev => prev.filter(o => o.id !== orderId && o.orderId !== orderId));
          triggerAlert('success', `Đã xóa đơn hàng thành công (Chế độ Offline).`);
        }
      }
    });
  };

  // Update user profile and roles
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠƯưăâêôơưẠ-ỹ\s]{2,50}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06789]|8[1-9]|9[0-9])[0-9]{7}$/;

    if (!editingUser.name || !editingUser.name.trim()) {
      triggerAlert('error', 'Họ tên không được để trống.');
      return;
    }
    if (!nameRegex.test(editingUser.name.trim())) {
      triggerAlert('error', 'Họ tên không hợp lệ. Vui lòng chỉ dùng chữ cái và khoảng trắng (từ 2 đến 50 ký tự).');
      return;
    }

    if (!editingUser.email || !editingUser.email.trim()) {
      triggerAlert('error', 'Địa chỉ email không được để trống.');
      return;
    }
    if (!emailRegex.test(editingUser.email.trim())) {
      triggerAlert('error', 'Địa chỉ email không đúng định dạng Gmail (ví dụ: name@gmail.com).');
      return;
    }

    if (!editingUser.phone || !editingUser.phone.trim()) {
      triggerAlert('error', 'Số điện thoại không được để trống.');
      return;
    }
    if (!phoneRegex.test(editingUser.phone.trim())) {
      triggerAlert('error', 'Số điện thoại Việt Nam không hợp lệ. Vui lòng nhập đúng 10 chữ số.');
      return;
    }

    try {
      const response = await fetch('/api/users/admin-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      });
      if (response.ok) {
        triggerAlert('success', `Đã cập nhật thông tin thành viên "${editingUser.name}" thành công!`);
        setEditingUser(null);
        fetchAdminUsers();
      } else {
        const err = await response.json();
        triggerAlert('error', err.error || 'Cập nhật thất bại.');
      }
    } catch (error) {
      console.error(error);
      triggerAlert('error', 'Lỗi hệ thống khi cập nhật thông tin thành viên.');
    }
  };

  // Delete user account
  const handleDeleteUser = async (id: number, name: string) => {
    setConfirmDialog({
      title: 'Xác nhận xóa tài khoản',
      message: `Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản thành viên "${name}" khỏi hệ thống?`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/users/${id}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            triggerAlert('success', `Đã xóa tài khoản thành viên "${name}" thành công!`);
            fetchAdminUsers();
          } else {
            const err = await response.json();
            triggerAlert('error', err.error || 'Xóa tài khoản thành viên thất bại.');
          }
        } catch (error) {
          console.error(error);
          triggerAlert('error', 'Lỗi kết nối hệ thống.');
        }
      }
    });
  };

  // Add new product to store catalog state
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, sku, category, subCategory, price, description, image, colors, sizes } = adminNewProduct;
    if (!name || !sku || !price) {
      triggerAlert('error', 'Vui lòng cung cấp đầy đủ thông tin Tên, SKU và Giá sản phẩm.');
      return;
    }
    const parsedPrice = parseInt(price.replace(/\D/g, '')) || 0;
    
    // Parse colors list
    const colorNames = colors.split(',').map(c => c.trim()).filter(Boolean);
    const parsedSizes = sizes.split(',').map(s => s.trim()).filter(Boolean);

    const parsedColors = colorNames.map(cName => {
      const colImg = colorImagesNew[cName] || image;
      
      const stockObj: { [size: string]: boolean } = {};
      parsedSizes.forEach(sName => {
        const key = `${cName}_${sName}`;
        const qty = colorSizeQuantitiesNew[key] !== undefined ? colorSizeQuantitiesNew[key] : 10;
        stockObj[sName] = qty > 0;
      });

      return {
        name: cName,
        hex: cName === 'Trắng' ? '#ffffff' : cName === 'Đen' ? '#000000' : cName === 'Đỏ' ? '#b41b1b' : cName === 'Vàng' ? '#eab308' : cName === 'Hồng' ? '#ec4899' : '#cccccc',
        image: colImg,
        images: [colImg],
        stock: stockObj
      };
    });

    const allImages = [image];
    colorNames.forEach(cName => {
      const colImg = colorImagesNew[cName];
      if (colImg && colImg.trim() && !allImages.includes(colImg)) {
        allImages.push(colImg);
      }
    });

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      sku,
      name,
      category: category as any,
      subCategory,
      price: parsedPrice,
      originalPrice: parsedPrice,
      images: allImages,
      colors: parsedColors,
      sizes: parsedSizes,
      description: description || 'Mô tả chi tiết sản phẩm chất lượng cao của IVY moda.'
    };

    try {
      const response = await fetch('/api/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: newProduct })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.product) {
          const savedProd = {
            id: data.product.id,
            sku: data.product.sku,
            name: data.product.name,
            category: data.product.category,
            subCategory: data.product.subCategory,
            price: data.product.price,
            originalPrice: data.product.originalPrice || data.product.price,
            images: data.product.images,
            colors: data.product.colors,
            sizes: data.product.sizes,
            description: data.product.description
          };
          setProductsList([savedProd, ...productsList]);
          triggerAlert('success', `Đã thêm sản phẩm "${name}" thành công vào cơ sở dữ liệu!`);
          
          // Reset form
          setColorImagesNew({});
          setAdminNewProduct({
            name: '',
            sku: '',
            category: 'Nữ',
            subCategory: 'Áo sơ mi',
            price: '',
            description: '',
            image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
            colors: 'Trắng, Đen, Đỏ',
            sizes: 'S, M, L, XL'
          });
        } else {
          triggerAlert('error', data.error || 'Không nhận được dữ liệu phản hồi từ server.');
        }
      } else {
        const err = await response.json();
        triggerAlert('error', err.error || 'Lỗi lưu sản phẩm vào database.');
      }
    } catch (err) {
      console.error("Lỗi đồng bộ cơ sở dữ liệu khi thêm sản phẩm:", err);
      // Fallback local addition
      setProductsList([newProduct, ...productsList]);
      triggerAlert('success', `Đã thêm sản phẩm "${name}" thành công (Chế độ Offline).`);
    }
  };

  // Delete product from store catalog
  const handleDeleteProduct = async (productId: string | number) => {
    setConfirmDialog({
      title: 'Xác nhận xóa sản phẩm',
      message: 'Bạn có chắc chắn muốn xóa vĩnh viễn sản phẩm này khỏi website?',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
          });
          if (response.ok) {
            setProductsList(prev => prev.filter(p => p.id !== productId));
            triggerAlert('info', 'Sản phẩm đã được xóa khỏi cơ sở dữ liệu và danh mục bán.');
          } else {
            const err = await response.json();
            triggerAlert('error', err.error || 'Lỗi hệ thống khi xóa sản phẩm.');
          }
        } catch (err) {
          console.error("Lỗi xóa sản phẩm:", err);
          setProductsList(prev => prev.filter(p => p.id !== productId));
          triggerAlert('info', 'Sản phẩm đã được gỡ khỏi danh mục bán (Chế độ Offline).');
        }
      }
    });
  };

  // Quick price change for product
  const handleUpdateProductPrice = async (productId: string | number, newPrice: number) => {
    const targetProduct = productsList.find(p => p.id === productId);
    if (!targetProduct) return;

    const updatedProduct = {
      ...targetProduct,
      price: newPrice,
      originalPrice: newPrice
    };

    try {
      const response = await fetch('/api/products/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: updatedProduct })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProductsList(prev => prev.map(p => p.id === productId ? updatedProduct : p));
          triggerAlert('success', 'Đã cập nhật đơn giá mới lên cơ sở dữ liệu thành công!');
        } else {
          triggerAlert('error', data.error || 'Cập nhật giá thất bại.');
        }
      } else {
        const err = await response.json();
        triggerAlert('error', err.error || 'Cập nhật giá thất bại.');
      }
    } catch (err) {
      console.error("Lỗi cập nhật giá sản phẩm:", err);
      setProductsList(prev => prev.map(p => p.id === productId ? { ...p, price: newPrice, originalPrice: newPrice } : p));
      triggerAlert('success', 'Đã cập nhật đơn giá mới thành công (Chế độ Offline).');
    }
  };

  return (
    <section className="container mx-auto px-4 py-8 max-w-7xl animate-fade-in" id="admin-panel-section">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 uppercase tracking-widest font-black rounded">Hệ thống quản trị</span>
            <span className="text-[10px] bg-black text-white px-2 py-0.5 uppercase tracking-widest font-black rounded">v1.2.4</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-wider text-black mt-1">HỆ THỐNG QUẢN TRỊ IVY MODA</h2>
          <p className="text-xs text-zinc-500 mt-1">Quản lý chuyên sâu Đơn hàng, Doanh thu và Danh mục sản phẩm thời trang cao cấp.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentUser(null);
            triggerAlert('info', 'Đã đăng xuất tài khoản quản trị thành công.');
          }} 
          className="flex items-center gap-1.5 text-xs font-black uppercase border-2 border-red-600 py-2.5 px-6 hover:bg-red-600 hover:text-white text-red-600 transition bg-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Đăng xuất tài khoản Admin
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <AdminSidebar
          activeTab={adminActiveTab}
          setActiveTab={setAdminActiveTab}
          ordersCount={adminOrders.length}
          productsCount={productsList.length}
          usersCount={adminUsers.filter((u: any) => u.role === 'user').length}
        />

        {/* Tab Display Area */}
        <div className="lg:col-span-9 bg-white border-2 border-black p-6">
          
          {adminActiveTab === 'dashboard' && (
            <AdminDashboard
              adminOrders={adminOrders}
              productsList={productsList}
              formatPrice={formatPrice}
            />
          )}

          {/* TAB 2: ORDER MANAGEMENT */}
          {adminActiveTab === 'orders' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                {/* Search bar */}
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="Tìm đơn hàng theo tên, mã đơn hoặc SĐT..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="w-full border border-black p-3 pl-10 text-xs outline-none bg-white focus:ring-1 focus:ring-black"
                  />
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 min-w-[200px]">
                  <span className="text-xs font-bold uppercase text-zinc-400 whitespace-nowrap">Lọc trạng thái:</span>
                  <select
                    value={adminStatusFilter}
                    onChange={(e) => setAdminStatusFilter(e.target.value)}
                    className="w-full border border-black p-3 text-xs outline-none bg-white"
                  >
                    <option value="Tất cả">Tất cả đơn hàng</option>
                    <option value="Đang xử lý">Đang xử lý</option>
                    <option value="Đang đóng gói">Đang đóng gói</option>
                    <option value="Đang vận chuyển">Đang vận chuyển</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {adminOrders
                  .filter(o => {
                    const query = adminSearch.toLowerCase().trim();
                    if (query) {
                      const nameMatch = (o.customerName || '').toLowerCase().includes(query);
                      const idMatch = (o.id || o.orderId || '').toLowerCase().includes(query);
                      const phoneMatch = (o.customerPhone || '').toLowerCase().includes(query);
                      if (!nameMatch && !idMatch && !phoneMatch) return false;
                    }
                    if (adminStatusFilter !== 'Tất cả') {
                      const currentStatus = o.status || 'Đang xử lý';
                      if (currentStatus !== adminStatusFilter) return false;
                    }
                    return true;
                  })
                  .map((order) => (
                    <div key={order.id || order.orderId} className="border-2 border-black p-5 bg-zinc-50 relative space-y-4 hover:border-amber-500 transition duration-150">
                      <div className="flex flex-col md:flex-row justify-between border-b border-zinc-200 pb-3 gap-2">
                        <div>
                          <p className="text-xs font-bold text-zinc-400 uppercase">Mã đơn & Ngày đặt</p>
                          <p className="text-sm font-black text-black">
                            {order.id || order.orderId} <span className="text-xs font-normal text-zinc-500 ml-2">({order.date || new Date().toLocaleDateString('vi-VN')})</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-bold uppercase text-zinc-400">Trạng thái:</label>
                          <select
                            value={order.status || 'Đang xử lý'}
                            onChange={(e) => handleUpdateOrderStatus(order.id || order.orderId, e.target.value)}
                            className="border border-black p-1.5 text-xs font-bold uppercase bg-white outline-none cursor-pointer"
                          >
                            <option value="Đang xử lý">Đang xử lý</option>
                            <option value="Đang đóng gói">Đang đóng gói</option>
                            <option value="Đang vận chuyển">Đang vận chuyển</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                          </select>
                          <button
                            onClick={() => handleDeleteOrder(order.id || order.orderId)}
                            className="p-1.5 border border-red-200 bg-red-50 text-red-600 hover:bg-[#b41b1b] hover:text-white transition"
                            title="Xóa đơn hàng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Client particulars */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-600 border-b border-zinc-200 pb-3">
                        <div>
                          <p className="font-bold text-black uppercase">Khách hàng</p>
                          <p>{order.customerName || 'Chưa cập nhật'}</p>
                        </div>
                        <div>
                          <p className="font-bold text-black uppercase">Liên lạc</p>
                          <p>{order.customerPhone || 'Chưa cập nhật'} | {order.customerEmail || 'Guest'}</p>
                        </div>
                        <div>
                          <p className="font-bold text-black uppercase">Địa chỉ nhận hàng</p>
                          <p className="line-clamp-2">{order.shippingAddress || 'Chưa cập nhật'}</p>
                        </div>
                      </div>

                      {/* Products summary inside order */}
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Danh mục sản phẩm mua</p>
                        {(order.items || []).map((it: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-zinc-700 bg-white p-2 border border-zinc-200">
                            <div>
                              <p className="font-bold uppercase text-black">{it.productName}</p>
                              <p className="text-[10px] text-zinc-500">Mã: {it.sku} | Màu: {it.color} | Size: {it.size}</p>
                            </div>
                            <p className="font-bold text-zinc-800">{it.quantity} x {formatPrice(it.price)}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[11px] text-zinc-400 font-bold uppercase">{order.paymentMethod}</span>
                        <span className="text-sm font-black text-black">
                          Tổng thanh toán: {formatPrice(order.totalAmount || order.total || 0)}
                        </span>
                      </div>
                    </div>
                  ))}

                {adminOrders.length === 0 && (
                  <div className="text-center py-12 bg-zinc-50 border border-zinc-200 text-xs text-zinc-400 font-bold">
                    Không tìm thấy đơn đặt hàng nào phù hợp với bộ lọc tìm kiếm.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCT CATALOG DIRECTORY */}
          {adminActiveTab === 'products' && (
            <div className="space-y-8 animate-fade-in">
              {/* Add new product panel */}
              <details className="border-2 border-black p-5 bg-zinc-50 group" open={false}>
                <summary className="text-sm font-black uppercase tracking-wider text-black cursor-pointer select-none list-none flex justify-between items-center">
                  <span>➕ Thêm sản phẩm thiết kế mới vào kho</span>
                  <span className="text-zinc-500 group-open:hidden">▼ Click để mở</span>
                  <span className="text-zinc-500 hidden group-open:inline">▲ Đóng lại</span>
                </summary>
                
                <form onSubmit={handleAddProduct} className="space-y-4 pt-5 border-t border-zinc-200 mt-4 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase mb-1">Tên sản phẩm *</label>
                      <input 
                        type="text" required placeholder="Ví dụ: Đầm Lụa Maxi Họa Tiết"
                        value={adminNewProduct.name}
                        onChange={(e) => setAdminNewProduct({...adminNewProduct, name: e.target.value})}
                        className="w-full border border-black p-3 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase mb-1">Mã sản phẩm (SKU) *</label>
                      <input 
                        type="text" required placeholder="Ví dụ: MS 48B1202"
                        value={adminNewProduct.sku}
                        onChange={(e) => setAdminNewProduct({...adminNewProduct, sku: e.target.value})}
                        className="w-full border border-black p-3 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase mb-1">Đơn giá bán lẻ (VND) *</label>
                      <input 
                        type="text" required placeholder="Ví dụ: 950000"
                        value={adminNewProduct.price}
                        onChange={(e) => setAdminNewProduct({...adminNewProduct, price: e.target.value})}
                        className="w-full border border-black p-3 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex gap-2 items-end">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold uppercase mb-1">Danh mục lớn</label>
                          <select
                            value={adminNewProduct.category}
                            onChange={(e) => setAdminNewProduct({...adminNewProduct, category: e.target.value})}
                            className="w-full border border-black p-3 bg-white outline-none text-xs"
                          >
                            {dbCategories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                            {dbCategories.length === 0 && (
                              <>
                                <option value="Nữ">Thời trang Nữ</option>
                                <option value="Nam">Thời trang Nam</option>
                                <option value="Trẻ em">Thời trang Trẻ em</option>
                              </>
                            )}
                          </select>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setShowAddCategoryModal(true)}
                          className="bg-black text-white hover:bg-zinc-800 p-3 border border-black text-xs font-black shrink-0 transition"
                          title="Thêm danh mục mới"
                        >
                          + Thêm
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[11px] font-bold uppercase">Nhóm sản phẩm</label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !isAddingNewSubCategoryNew;
                            setIsAddingNewSubCategoryNew(nextState);
                            setAdminNewProduct({
                              ...adminNewProduct,
                              subCategory: nextState ? '' : (existingSubcategories[0] || '')
                            });
                          }}
                          className="text-[10px] text-[#b41b1b] hover:underline font-bold cursor-pointer"
                        >
                          {isAddingNewSubCategoryNew ? "👈 Chọn nhóm có sẵn" : "➕ Thêm nhóm mới"}
                        </button>
                      </div>
                      {isAddingNewSubCategoryNew ? (
                        <input 
                          type="text" placeholder="Nhập nhóm mới (Ví dụ: Đầm Maxi, Áo dạ)"
                          value={adminNewProduct.subCategory}
                          onChange={(e) => setAdminNewProduct({...adminNewProduct, subCategory: e.target.value})}
                          className="w-full border border-black p-3 outline-none bg-white text-xs"
                          required
                        />
                      ) : (
                        <select
                          value={adminNewProduct.subCategory}
                          onChange={(e) => setAdminNewProduct({...adminNewProduct, subCategory: e.target.value})}
                          className="w-full border border-black p-3 bg-white outline-none text-xs"
                        >
                          <option value="">-- Chọn nhóm sản phẩm --</option>
                          {existingSubcategories.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase mb-1">Đường dẫn ảnh nổi bật</label>
                      <input 
                        type="text" placeholder="https://unsplash.com/..."
                        value={adminNewProduct.image}
                        onChange={(e) => setAdminNewProduct({...adminNewProduct, image: e.target.value})}
                        className="w-full border border-black p-3 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase mb-1">Màu sắc (phân tách bằng dấu phẩy)</label>
                      <input 
                        type="text" placeholder="Trắng, Đen, Hồng"
                        value={adminNewProduct.colors}
                        onChange={(e) => setAdminNewProduct({...adminNewProduct, colors: e.target.value})}
                        className="w-full border border-black p-3 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase mb-1">Kích thước (phân tách bằng dấu phẩy)</label>
                      <input 
                        type="text" placeholder="S, M, L, XL"
                        value={adminNewProduct.sizes}
                        onChange={(e) => setAdminNewProduct({...adminNewProduct, sizes: e.target.value})}
                        className="w-full border border-black p-3 outline-none bg-white"
                      />
                    </div>
                  </div>

                  {/* Dynamic Color Image inputs */}
                  {adminNewProduct.colors.split(',').map(c => c.trim()).filter(Boolean).length > 0 && (
                    <div className="p-4 border-2 border-black bg-zinc-100 space-y-3">
                      <p className="font-black text-[11px] uppercase tracking-wider text-black">🖼️ THIẾT LẬP ẢNH SẢN PHẨM CHO TỪNG MÀU SẮC:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {adminNewProduct.colors.split(',').map(c => c.trim()).filter(Boolean).map(cName => (
                          <div key={cName} className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-700 uppercase">Màu: {cName}</label>
                            <input
                              type="text"
                              placeholder="Dán URL hình ảnh áo màu này vào đây..."
                              value={colorImagesNew[cName] || ''}
                              onChange={(e) => setColorImagesNew({ ...colorImagesNew, [cName]: e.target.value })}
                              className="w-full border border-black p-2.5 text-xs outline-none bg-white focus:ring-1 focus:ring-black transition"
                            />
                            {colorImagesNew[cName] && (
                              <div className="mt-1 flex items-center gap-1.5 bg-white p-1 border border-zinc-200">
                                <img src={colorImagesNew[cName]} alt="preview" className="w-10 h-12 object-cover" />
                                <span className="text-[9px] text-zinc-400 truncate">Preview ảnh màu {cName}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Color Size Quantity inputs */}
                  {adminNewProduct.colors.split(',').map(c => c.trim()).filter(Boolean).length > 0 && 
                   adminNewProduct.sizes.split(',').map(s => s.trim()).filter(Boolean).length > 0 && (
                    <div className="p-4 border-2 border-black bg-zinc-100 space-y-3">
                      <p className="font-black text-[11px] uppercase tracking-wider text-black">📊 THIẾT LẬP SỐ LƯỢNG TỒN KHO CHO TỪNG MÀU SẮC & KÍCH CỠ:</p>
                      <div className="space-y-4">
                        {adminNewProduct.colors.split(',').map(c => c.trim()).filter(Boolean).map(cName => (
                          <div key={cName} className="p-3 border border-black bg-white space-y-2">
                            <p className="font-bold text-xs uppercase text-black flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full border border-zinc-400 inline-block" style={{ backgroundColor: cName === 'Trắng' ? '#ffffff' : cName === 'Đen' ? '#000000' : cName === 'Đỏ' ? '#b41b1b' : cName === 'Vàng' ? '#eab308' : cName === 'Hồng' ? '#ec4899' : '#cccccc' }} />
                              Màu sắc: {cName}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {adminNewProduct.sizes.split(',').map(s => s.trim()).filter(Boolean).map(sName => {
                                const key = `${cName}_${sName}`;
                                const qty = colorSizeQuantitiesNew[key] !== undefined ? colorSizeQuantitiesNew[key] : 10;
                                return (
                                  <div key={sName} className="space-y-1">
                                    <label className="block text-[10px] font-bold text-zinc-600">Size {sName} (Số lượng)</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={qty}
                                      onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setColorSizeQuantitiesNew({
                                          ...colorSizeQuantitiesNew,
                                          [key]: isNaN(val) ? 0 : val
                                        });
                                      }}
                                      className="w-full border border-black p-2 text-xs outline-none bg-white font-medium"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase mb-1">Mô tả sản phẩm</label>
                    <textarea 
                      rows={3} placeholder="Chi tiết chất liệu, phom dáng và cách bảo quản..."
                      value={adminNewProduct.description}
                      onChange={(e) => setAdminNewProduct({...adminNewProduct, description: e.target.value})}
                      className="w-full border border-black p-3 outline-none bg-white"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="bg-black text-white py-3 px-6 text-xs font-black uppercase tracking-wider hover:opacity-85 transition"
                  >
                    Lưu & Công bố sản phẩm
                  </button>
                </form>
              </details>

              {/* Products Grid list for basic management */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-black">Danh sách sản phẩm hiện hữu trên web</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productsList.map((product) => {
                    const overallStock = product.colors.reduce((sum, colorObj) => {
                      // Handle array structures or objects dynamically to avoid runtime errors
                      if (colorObj.stock && typeof colorObj.stock === 'object') {
                        return sum + Object.values(colorObj.stock).reduce((s, val) => s + (val ? 10 : 0), 0);
                      }
                      return sum + 10;
                    }, 0);
                    return (
                      <div key={product.id} className="border border-zinc-200 p-4 bg-zinc-50 flex gap-4 hover:border-black transition duration-150 relative">
                        <img 
                          src={product.images[0]} 
                          alt={product.name}
                          className="w-20 h-24 object-cover border border-zinc-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0 space-y-1.5 text-xs">
                          <div>
                            <span className="text-[9px] bg-black text-white px-1.5 py-0.5 uppercase tracking-wider font-bold">
                              {product.category} / {product.subCategory}
                            </span>
                            <p className="font-bold text-black uppercase mt-1 truncate">{product.name}</p>
                            <p className="text-[10px] text-zinc-400 font-bold">SKU: {product.sku}</p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="font-black text-black">{formatPrice(product.price)}</span>
                            <span className="text-zinc-400">|</span>
                            <span className="text-zinc-500 text-[11px]">Tồn kho: <strong className="text-black font-black">{overallStock}</strong> sản phẩm</span>
                          </div>

                          <div className="flex gap-2 pt-1 border-t border-zinc-200">
                            <button
                              onClick={() => handleStartEditProduct(product)}
                              className="text-[10px] font-bold uppercase hover:underline text-blue-600"
                            >
                              ✏️ Sửa chi tiết
                            </button>
                            <span className="text-zinc-300">|</span>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-[10px] font-bold uppercase hover:underline text-red-600"
                            >
                              🗑️ Xóa Sản Phẩm
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: MEMBER MANAGEMENT */}
          {adminActiveTab === 'users' && (
            <div className="space-y-6 animate-fade-in text-left">
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                {/* Search bar */}
                <div className="relative flex-1">
                  <input 
                    type="text"
                    placeholder="Tìm thành viên theo tên, email hoặc SĐT..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full border border-black p-3 pl-10 text-xs outline-none bg-white focus:ring-1 focus:ring-black"
                  />
                  <Search className="absolute left-3 top-3.5 w-4 h-4 text-zinc-400" />
                </div>

                {/* Role Filter Indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-zinc-100 border border-zinc-300 font-bold uppercase px-3.5 py-3 whitespace-nowrap text-zinc-600">
                    Vai trò: Khách hàng (User)
                  </span>
                </div>
              </div>

              {loadingUsers ? (
                <div className="py-12 text-center text-xs font-bold uppercase tracking-wider text-zinc-400 animate-pulse">
                  Đang tải danh sách thành viên từ cơ sở dữ liệu...
                </div>
              ) : (
                <div className="border-2 border-black overflow-x-auto bg-white">
                  <table className="w-full text-left text-xs min-w-[800px]">
                    <thead className="bg-black text-white uppercase tracking-wider font-bold">
                      <tr>
                        <th className="p-4 border-r border-zinc-800">UID / ID</th>
                        <th className="p-4 border-r border-zinc-800">Thành viên</th>
                        <th className="p-4 border-r border-zinc-800">Số điện thoại</th>
                        <th className="p-4 border-r border-zinc-800">Giới tính / Ngày sinh</th>
                        <th className="p-4 border-r border-zinc-800">Địa chỉ giao hàng</th>
                        <th className="p-4 border-r border-zinc-800">Vai trò</th>
                        <th className="p-4">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {adminUsers
                        .filter(u => {
                          if (u.role !== 'user') return false;
                          const query = userSearch.toLowerCase().trim();
                          if (query) {
                            const nameMatch = (u.name || '').toLowerCase().includes(query);
                            const emailMatch = (u.email || '').toLowerCase().includes(query);
                            const phoneMatch = (u.phone || '').toLowerCase().includes(query);
                            if (!nameMatch && !emailMatch && !phoneMatch) return false;
                          }
                          return true;
                        })
                        .map(user => (
                          <tr key={user.id} className="hover:bg-zinc-50 transition">
                            <td className="p-4 font-mono text-[10px] text-zinc-500 border-r border-zinc-200">
                              <div>ID: {user.id}</div>
                              <div className="text-[9px] truncate max-w-[100px]" title={user.uid}>UID: {user.uid}</div>
                            </td>
                            <td className="p-4 border-r border-zinc-200 font-medium">
                              <p className="font-bold text-black uppercase">{user.name || 'Họ và tên'}</p>
                              <p className="text-[10px] text-zinc-400 font-normal">{user.email}</p>
                            </td>
                            <td className="p-4 border-r border-zinc-200 font-medium text-zinc-700">
                              {user.phone || 'Chưa cập nhật'}
                            </td>
                            <td className="p-4 border-r border-zinc-200 text-zinc-600">
                              <div>{user.gender || 'Chưa rõ'}</div>
                              <div className="text-[10px] text-zinc-400">{user.birthday || 'Chưa cập nhật'}</div>
                            </td>
                            <td className="p-4 border-r border-zinc-200 text-zinc-600 max-w-[200px] truncate" title={user.address}>
                              {user.address || 'Chưa cập nhật'}
                            </td>
                            <td className="p-4 border-r border-zinc-200">
                              <span className={`inline-block text-[10px] font-black px-2 py-1 uppercase rounded ${
                                user.role === 'admin' 
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                                  : 'bg-zinc-100 text-zinc-700 border border-zinc-300'
                              }`}>
                                {user.role === 'admin' ? 'ADMIN' : 'USER'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingUser({ ...user, password: '' })}
                                  className="p-2 border border-zinc-300 hover:border-black rounded bg-white text-zinc-700 transition cursor-pointer"
                                  title="Sửa thông tin"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id, user.name || user.email)}
                                  className="p-2 border border-red-200 hover:border-[#b41b1b] rounded bg-red-50 text-red-600 hover:text-white hover:bg-[#b41b1b] transition cursor-pointer"
                                  title="Xóa tài khoản"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      
                      {adminUsers.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-zinc-400 font-bold">
                            Chưa tìm thấy thành viên nào phù hợp với bộ lọc tìm kiếm.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* User Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in text-left overflow-y-auto">
          <div className="bg-white border-2 border-black max-w-lg w-full p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black uppercase tracking-wider text-black border-b border-zinc-200 pb-3 mb-4">
              Cập nhật thông tin thành viên
            </h3>
             <form onSubmit={handleUpdateUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-zinc-400">Họ và Tên</label>
                <input
                  type="text" required
                  value={editingUser.name || ''}
                  onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full border border-black p-3 outline-none bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-zinc-400">Email tài khoản (Không thể thay đổi)</label>
                <input
                  type="email" disabled
                  value={editingUser.email || ''}
                  className="w-full border border-black p-3 outline-none bg-zinc-100 text-zinc-500 cursor-not-allowed text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-zinc-400">Số điện thoại</label>
                <input
                  type="text" required
                  value={editingUser.phone || ''}
                  onChange={e => setEditingUser({ ...editingUser, phone: e.target.value })}
                  className="w-full border border-black p-3 outline-none bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-zinc-400">Mật khẩu tài khoản</label>
                <input
                  type="password"
                  value={editingUser.password || ''}
                  onChange={e => setEditingUser({ ...editingUser, password: e.target.value })}
                  placeholder="Để trống nếu muốn giữ nguyên mật khẩu cũ..."
                  className="w-full border border-black p-3 outline-none bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-zinc-400">Giới tính</label>
                  <select
                    value={editingUser.gender || 'Nam'}
                    onChange={e => setEditingUser({ ...editingUser, gender: e.target.value })}
                    className="w-full border border-black p-3 outline-none bg-white text-xs"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-zinc-400">Ngày sinh</label>
                  <input
                    type="date"
                    value={editingUser.birthday || ''}
                    onChange={e => setEditingUser({ ...editingUser, birthday: e.target.value })}
                    className="w-full border border-black p-3 outline-none bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-zinc-400">Phân quyền vai trò</label>
                <select
                  value="user"
                  disabled
                  className="w-full border-2 border-zinc-200 p-3 outline-none bg-zinc-50 text-xs font-bold text-zinc-500 cursor-not-allowed"
                >
                  <option value="user">Khách hàng (User)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-zinc-400">Địa chỉ giao hàng</label>
                <textarea
                  rows={2}
                  value={editingUser.address || ''}
                  onChange={e => setEditingUser({ ...editingUser, address: e.target.value })}
                  className="w-full border border-black p-3 outline-none bg-white text-xs resize-none"
                  placeholder="Địa chỉ nhận hàng mặc định..."
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="border-2 border-black px-4 py-2.5 font-bold uppercase text-xs hover:bg-zinc-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 font-black uppercase text-xs transition cursor-pointer"
                >
                  Lưu cập nhật
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 animate-fade-in text-left">
          <div className="bg-white border-2 border-black max-w-sm w-full p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black uppercase tracking-wider text-black border-b border-zinc-200 pb-3 mb-4">
              ➕ THÊM DANH MỤC MỚI
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1">Tên danh mục *</label>
                <input
                  type="text" required
                  placeholder="Ví dụ: Đồ Thể Thao, Đồ Lót..."
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  className="w-full border border-black p-3 outline-none bg-white text-xs"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="border-2 border-black px-4 py-2 font-bold uppercase text-[10px] hover:bg-zinc-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white px-5 py-2 font-black uppercase text-[10px] transition cursor-pointer"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Details Modal */}
      {editingProductForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in text-left overflow-y-auto">
          <div className="bg-white border-2 border-black max-w-3xl w-full p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black uppercase tracking-wider text-black border-b border-zinc-200 pb-3 mb-4 flex justify-between items-center">
              <span>✏️ CHỈNH SỬA THÔNG TIN SẢN PHẨM</span>
              <span className="text-xs bg-black text-white px-2 py-0.5 rounded font-mono">SKU: {editingProductForm.sku}</span>
            </h3>
            <form onSubmit={handleUpdateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Tên sản phẩm *</label>
                  <input
                    type="text" required
                    value={editingProductForm.name}
                    onChange={e => setEditingProductForm({ ...editingProductForm, name: e.target.value })}
                    className="w-full border border-black p-3 outline-none bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Mã sản phẩm (SKU) *</label>
                  <input
                    type="text" required
                    value={editingProductForm.sku}
                    onChange={e => setEditingProductForm({ ...editingProductForm, sku: e.target.value })}
                    className="w-full border border-black p-3 outline-none bg-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Đơn giá bán lẻ (VND) *</label>
                  <input
                    type="text" required
                    value={editingProductForm.price}
                    onChange={e => setEditingProductForm({ ...editingProductForm, price: e.target.value })}
                    className="w-full border border-black p-3 outline-none bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Danh mục lớn</label>
                  <select
                    value={editingProductForm.category}
                    onChange={e => setEditingProductForm({ ...editingProductForm, category: e.target.value })}
                    className="w-full border border-black p-3 bg-white outline-none text-xs"
                  >
                    {dbCategories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                    {dbCategories.length === 0 && (
                      <>
                        <option value="Nữ">Thời trang Nữ</option>
                        <option value="Nam">Thời trang Nam</option>
                        <option value="Trẻ em">Thời trang Trẻ em</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-bold uppercase">Nhóm sản phẩm</label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextState = !isAddingNewSubCategoryEdit;
                        setIsAddingNewSubCategoryEdit(nextState);
                        setEditingProductForm({
                          ...editingProductForm,
                          subCategory: nextState ? '' : (existingSubcategories[0] || '')
                        });
                      }}
                      className="text-[10px] text-[#b41b1b] hover:underline font-bold cursor-pointer"
                    >
                      {isAddingNewSubCategoryEdit ? "👈 Chọn nhóm có sẵn" : "➕ Thêm nhóm mới"}
                    </button>
                  </div>
                  {isAddingNewSubCategoryEdit ? (
                    <input
                      type="text" required
                      placeholder="Nhập nhóm mới..."
                      value={editingProductForm.subCategory}
                      onChange={e => setEditingProductForm({ ...editingProductForm, subCategory: e.target.value })}
                      className="w-full border border-black p-3 outline-none bg-white text-xs"
                    />
                  ) : (
                    <select
                      value={editingProductForm.subCategory}
                      onChange={e => setEditingProductForm({ ...editingProductForm, subCategory: e.target.value })}
                      className="w-full border border-black p-3 bg-white outline-none text-xs"
                    >
                      <option value="">-- Chọn nhóm sản phẩm --</option>
                      {existingSubcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1">Đường dẫn ảnh nổi bật</label>
                <input
                  type="text" required
                  value={editingProductForm.image}
                  onChange={e => setEditingProductForm({ ...editingProductForm, image: e.target.value })}
                  className="w-full border border-black p-3 outline-none bg-white text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Màu sắc (phân tách bằng dấu phẩy)</label>
                  <input
                    type="text" required
                    value={editingProductForm.colors}
                    onChange={e => setEditingProductForm({ ...editingProductForm, colors: e.target.value })}
                    className="w-full border border-black p-3 outline-none bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1">Kích thước (phân tách bằng dấu phẩy)</label>
                  <input
                    type="text" required
                    value={editingProductForm.sizes}
                    onChange={e => setEditingProductForm({ ...editingProductForm, sizes: e.target.value })}
                    className="w-full border border-black p-3 outline-none bg-white text-xs"
                  />
                </div>
              </div>

              {/* Dynamic Color Image inputs for Edit */}
              {editingProductForm.colors.split(',').map(c => c.trim()).filter(Boolean).length > 0 && (
                <div className="p-4 border-2 border-black bg-zinc-100 space-y-3">
                  <p className="font-black text-[11px] uppercase tracking-wider text-black">🖼️ THIẾT LẬP ẢNH SẢN PHẨM CHO TỪNG MÀU SẮC (CHỈNH SỬA):</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {editingProductForm.colors.split(',').map(c => c.trim()).filter(Boolean).map(cName => (
                      <div key={cName} className="space-y-1">
                        <label className="block text-[10px] font-bold text-zinc-700 uppercase">Màu: {cName}</label>
                        <input
                          type="text"
                          placeholder="Dán URL hình ảnh áo màu này vào đây..."
                          value={colorImagesEdit[cName] || ''}
                          onChange={(e) => setColorImagesEdit({ ...colorImagesEdit, [cName]: e.target.value })}
                          className="w-full border border-black p-2.5 text-xs outline-none bg-white focus:ring-1 focus:ring-black transition"
                        />
                        {colorImagesEdit[cName] && (
                          <div className="mt-1 flex items-center gap-1.5 bg-white p-1 border border-zinc-200">
                            <img src={colorImagesEdit[cName]} alt="preview" className="w-10 h-12 object-cover" />
                            <span className="text-[9px] text-zinc-400 truncate">Preview ảnh màu {cName}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Color Size Quantity inputs for Edit */}
              {editingProductForm.colors.split(',').map(c => c.trim()).filter(Boolean).length > 0 && 
               editingProductForm.sizes.split(',').map(s => s.trim()).filter(Boolean).length > 0 && (
                <div className="p-4 border-2 border-black bg-zinc-100 space-y-3">
                  <p className="font-black text-[11px] uppercase tracking-wider text-black">📊 THIẾT LẬP SỐ LƯỢNG TỒN KHO CHO TỪNG MÀU SẮC & KÍCH CỠ (CHỈNH SỬA):</p>
                  <div className="space-y-4">
                    {editingProductForm.colors.split(',').map(c => c.trim()).filter(Boolean).map(cName => (
                      <div key={cName} className="p-3 border border-black bg-white space-y-2">
                        <p className="font-bold text-xs uppercase text-black flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full border border-zinc-400 inline-block" style={{ backgroundColor: cName === 'Trắng' ? '#ffffff' : cName === 'Đen' ? '#000000' : cName === 'Đỏ' ? '#b41b1b' : cName === 'Vàng' ? '#eab308' : cName === 'Hồng' ? '#ec4899' : '#cccccc' }} />
                          Màu sắc: {cName}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {editingProductForm.sizes.split(',').map(s => s.trim()).filter(Boolean).map(sName => {
                            const key = `${cName}_${sName}`;
                            const qty = colorSizeQuantitiesEdit[key] !== undefined ? colorSizeQuantitiesEdit[key] : 10;
                            return (
                              <div key={sName} className="space-y-1">
                                <label className="block text-[10px] font-bold text-zinc-600">Size {sName} (Số lượng)</label>
                                <input
                                  type="number"
                                  min="0"
                                  value={qty}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setColorSizeQuantitiesEdit({
                                      ...colorSizeQuantitiesEdit,
                                      [key]: isNaN(val) ? 0 : val
                                    });
                                  }}
                                  className="w-full border border-black p-2 text-xs outline-none bg-white font-medium"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1">Mô tả sản phẩm</label>
                <textarea
                  rows={4}
                  value={editingProductForm.description}
                  onChange={e => setEditingProductForm({ ...editingProductForm, description: e.target.value })}
                  className="w-full border border-black p-3 outline-none bg-white text-xs resize-y"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditingProductForm(null)}
                  className="border-2 border-black px-4 py-2.5 font-bold uppercase text-xs hover:bg-zinc-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="bg-black hover:bg-zinc-800 text-white px-5 py-2.5 font-black uppercase text-xs transition cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />
      )}

    </section>
  );
}
