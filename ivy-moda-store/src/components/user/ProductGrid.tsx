import React, { useState, useEffect } from 'react';
import { Search, X, Check, Grid, Sparkles, Percent, Calendar } from 'lucide-react';
import { Product } from '../../types';

interface ProductGridProps {
  productsList: Product[];
  currentCategory: string;
  setCurrentCategory: (cat: string) => void;
  categories: string[];
  activeSubCategory: string;
  setActiveSubCategory: (subCat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSelectedProduct: (product: Product | null) => void;
  formatPrice: (num: number) => string;
}

export default function ProductGrid({
  productsList,
  currentCategory,
  setCurrentCategory,
  categories,
  activeSubCategory,
  setActiveSubCategory,
  searchQuery,
  setSearchQuery,
  setSelectedProduct,
  formatPrice,
}: ProductGridProps) {
  // Localized sidebar filters for supreme encapsulation
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('all'); // all, under-500, 500-1000, over-1000
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);

  // Sync localSearch when the external searchQuery gets updated from outside
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localSearch);
  };

  // Derive filter parameters from active productsList
  const availableSubcategories = Array.from(
    new Set(
      productsList
        .filter(p => currentCategory === 'Tất cả' || p.category === currentCategory)
        .map(p => p.subCategory)
    )
  );

  const colorsList = Array.from(
    new Set(productsList.flatMap(p => p.colors.map(c => c.name)))
  ).map(name => {
    const found = productsList.flatMap(p => p.colors).find(c => c.name === name);
    return { name, hex: found?.hex || '#ccc' };
  });

  const sizesList = ['S', 'M', 'L', 'XL', 'XXL'];

  // Main filter engine
  const filteredProducts = productsList.filter(product => {
    // 1. Category Filter
    if (currentCategory !== 'Tất cả' && product.category !== currentCategory) {
      return false;
    }
    // 2. Subcategory Filter
    if (activeSubCategory !== 'Tất cả' && product.subCategory !== activeSubCategory) {
      return false;
    }
    // 3. Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      const nameMatch = product.name.toLowerCase().includes(query);
      const skuMatch = product.sku.toLowerCase().includes(query);
      const catMatch = product.subCategory.toLowerCase().includes(query);
      if (!nameMatch && !skuMatch && !catMatch) return false;
    }
    // 4. Color Filters
    if (selectedColors.length > 0) {
      const hasSelectedColor = product.colors.some(c => selectedColors.includes(c.name));
      if (!hasSelectedColor) return false;
    }
    // 5. Size Filters
    if (selectedSizes.length > 0) {
      const hasSelectedSize = product.sizes.some(s => selectedSizes.includes(s));
      if (!hasSelectedSize) return false;
    }
    // 6. Price Range Filters
    if (priceRange !== 'all') {
      const price = product.price;
      if (priceRange === 'under-500' && price >= 500000) return false;
      if (priceRange === '500-1000' && (price < 500000 || price > 1000000)) return false;
      if (priceRange === 'over-1000' && price <= 1000000) return false;
    }
    // 7. Stock status check
    if (onlyInStock) {
      const hasStock = product.colors.some(c => 
        Object.values(c.stock).some(inStock => inStock)
      );
      if (!hasStock) return false;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col text-left">
      
      {/* Lookbook Campaign Banner */}
      <section className="bg-black text-white relative py-12 md:py-20 px-6 md:px-16 flex flex-col md:flex-row items-center justify-between overflow-hidden gap-8 border-b-2 border-black" id="campaign-banner">
        <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-900 rounded-full blur-3xl opacity-50 -z-10"></div>
        
        <div className="max-w-xl space-y-4">
          <span className="bg-white text-black text-[10px] font-bold px-3 py-1 uppercase tracking-widest">
            Thời Trang Xu Hướng 2026
          </span>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider leading-none">
            FALL / WINTER <br />
            COLLECTION
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
            Khám phá những thiết kế mới nhất với phong cách tối giản thanh lịch từ chất liệu lụa satin, dạ cao cấp và tweed thủ công thượng hạng.
          </p>
          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => {
                setCurrentCategory('Nữ');
                setActiveSubCategory('Tất cả');
              }}
              className="bg-white text-black hover:bg-zinc-200 transition px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Bộ sưu tập Nữ
            </button>
            <button 
              onClick={() => {
                setCurrentCategory('Nam');
                setActiveSubCategory('Tất cả');
              }}
              className="border-2 border-white text-white hover:bg-white hover:text-black transition px-5 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              BST Men Wear
            </button>
          </div>
        </div>

        {/* Dynamic Marketing stats bento box */}
        <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
          <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2 flex flex-col justify-between min-w-[150px]">
            <Percent className="w-5 h-5 text-[#b41b1b]" />
            <div>
              <p className="text-xl font-black">GIẢM 50%</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">Danh mục Clearance</p>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2 flex flex-col justify-between min-w-[150px]">
            <Calendar className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-xl font-black">NEW ARRIVALS</p>
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wide">Cập nhật mỗi ngày</p>
            </div>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-5 space-y-2 flex flex-col justify-between min-w-[150px] col-span-2">
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-bold uppercase text-emerald-500">Độc quyền Online</p>
            </div>
            <div>
              <p className="text-lg font-black">FREESHIP ĐƠN 1M</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5">Nhập mã FREESHIP nhận ngay ưu đãi vận chuyển toàn quốc.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Subcategory Pills Navigation */}
      <section className="bg-white border-b-2 border-black px-4 md:px-12 py-3.5 flex items-center gap-2 overflow-x-auto whitespace-nowrap" id="subcategory-navbar">
        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider mr-2">Bộ lọc nhanh:</span>
        <button
          onClick={() => setActiveSubCategory('Tất cả')}
          className={`px-4 py-1.5 text-xs font-bold uppercase border tracking-wider transition cursor-pointer ${
            activeSubCategory === 'Tất cả' 
              ? 'border-black bg-black text-white' 
              : 'border-zinc-200 hover:border-black text-zinc-700 bg-white'
          }`}
        >
          Tất cả {currentCategory !== 'Tất cả' ? currentCategory : 'Sản phẩm'}
        </button>
        {availableSubcategories.map(sub => (
          <button
            key={sub}
            onClick={() => setActiveSubCategory(sub)}
            className={`px-4 py-1.5 text-xs font-bold uppercase border tracking-wider transition cursor-pointer ${
              activeSubCategory === sub 
                ? 'border-black bg-black text-white' 
                : 'border-zinc-200 hover:border-black text-zinc-700 bg-white'
            }`}
          >
            {sub}
          </button>
        ))}
      </section>

      {/* Primary Catalog Interface Layout */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Filters Sidebar */}
        <aside className="w-full md:w-64 border-r-0 md:border-r-2 border-black p-6 space-y-6 bg-white select-none shrink-0" id="filter-sidebar">
          
          {/* Keyword Search box */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Tìm kiếm</h3>
            <form onSubmit={handleSearchSubmit} className="relative flex gap-1.5">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Nhập tên sản phẩm, SKU..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value.slice(0, 200))}
                  maxLength={200}
                  className="w-full border border-black p-2.5 pr-8 text-xs outline-none bg-white font-medium"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('');
                      setSearchQuery('');
                    }}
                    className="absolute top-3 right-2 text-zinc-400 hover:text-black cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="border-2 border-black bg-black text-white px-3.5 hover:bg-zinc-800 transition cursor-pointer flex items-center justify-center shrink-0"
                title="Tìm kiếm"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
            {searchQuery && (
              <button 
                onClick={() => {
                  setLocalSearch('');
                  setSearchQuery('');
                }}
                className="text-[10px] text-zinc-400 hover:text-black flex items-center gap-1 font-bold uppercase cursor-pointer"
              >
                <X className="w-3 h-3" /> Xóa tìm kiếm
              </button>
            )}
          </div>

          {/* Dòng sản phẩm */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Dòng sản phẩm</h3>
            <div className="flex flex-col gap-2 text-xs font-bold uppercase text-zinc-700">
              {['Tất cả', ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCurrentCategory(cat);
                    setActiveSubCategory('Tất cả');
                  }}
                  className={`text-left hover:text-[#b41b1b] transition cursor-pointer ${
                    currentCategory === cat 
                      ? 'text-[#b41b1b] pl-2 border-l-2 border-[#b41b1b]' 
                      : ''
                  }`}
                >
                  {cat === 'Tất cả' ? 'Tất cả sản phẩm' : `Thời trang ${cat}`}
                </button>
              ))}
            </div>
          </div>

          {/* Price Filters */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Khoảng giá</h3>
            <div className="space-y-2 text-xs font-medium">
              {[
                { label: 'Tất cả khoảng giá', value: 'all' },
                { label: 'Dưới 500.000đ', value: 'under-500' },
                { label: '500.000đ - 1.000.000đ', value: '500-1000' },
                { label: 'Trên 1.000.000đ', value: 'over-1000' },
              ].map((p) => (
                <label key={p.value} className="flex items-center gap-2.5 cursor-pointer text-zinc-700 hover:text-black">
                  <input 
                    type="radio" 
                    name="price-filter" 
                    checked={priceRange === p.value}
                    onChange={() => setPriceRange(p.value)}
                    className="accent-black w-4 h-4 border-black cursor-pointer"
                  />
                  <span>{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Colors circle selectors */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Màu sắc</h3>
            <div className="flex flex-wrap gap-2.5">
              {colorsList.map((col) => {
                const isSelected = selectedColors.includes(col.name);
                return (
                  <button
                    key={col.name}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedColors(selectedColors.filter(item => item !== col.name));
                      } else {
                        setSelectedColors([...selectedColors, col.name]);
                      }
                    }}
                    className="w-7 h-7 rounded-full border relative flex items-center justify-center group cursor-pointer"
                    style={{ backgroundColor: col.hex, borderColor: col.hex === '#ffffff' ? '#ddd' : col.hex }}
                    title={col.name}
                  >
                    {isSelected && (
                      <Check className={`w-4 h-4 ${col.name === 'Trắng' || col.name === 'Beige' ? 'text-black' : 'text-white'}`} />
                    )}
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] py-0.5 px-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition duration-150 z-20">
                      {col.name}
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedColors.length > 0 && (
              <button 
                onClick={() => setSelectedColors([])}
                className="text-[10px] text-zinc-400 hover:text-black flex items-center gap-1 font-bold uppercase mt-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Xóa lọc màu
              </button>
            )}
          </div>

          {/* Sizes grids selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Kích cỡ</h3>
            <div className="grid grid-cols-5 gap-2">
              {sizesList.map((size) => {
                const isSelected = selectedSizes.includes(size);
                return (
                  <button
                    key={size}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedSizes(selectedSizes.filter(item => item !== size));
                      } else {
                        setSelectedSizes([...selectedSizes, size]);
                      }
                    }}
                    className={`border-2 text-[11px] font-black h-8 flex items-center justify-center transition duration-150 cursor-pointer ${
                      isSelected 
                        ? 'border-black bg-black text-white' 
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-black'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
            {selectedSizes.length > 0 && (
              <button 
                onClick={() => setSelectedSizes([])}
                className="text-[10px] text-zinc-400 hover:text-black flex items-center gap-1 font-bold uppercase mt-1 cursor-pointer"
              >
                <X className="w-3 h-3" /> Xóa lọc size
              </button>
            )}
          </div>

          {/* In stock check */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400">Trạng thái kho hàng</h3>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-700 hover:text-black select-none">
              <input 
                type="checkbox" 
                checked={onlyInStock}
                onChange={() => setOnlyInStock(!onlyInStock)}
                className="accent-black w-4 h-4 cursor-pointer"
              />
              <span>Chỉ hiện sản phẩm "Còn hàng"</span>
            </label>
          </div>

          {/* Wipe out filters */}
          {(selectedColors.length > 0 || selectedSizes.length > 0 || priceRange !== 'all' || searchQuery || onlyInStock || currentCategory !== 'Tất cả' || activeSubCategory !== 'Tất cả') && (
            <button
              onClick={() => {
                setCurrentCategory('Tất cả');
                setActiveSubCategory('Tất cả');
                setSelectedColors([]);
                setSelectedSizes([]);
                setPriceRange('all');
                setSearchQuery('');
                setOnlyInStock(false);
              }}
              className="w-full border border-[#b41b1b] text-[#b41b1b] py-2 px-3 text-[10px] font-bold uppercase tracking-wider hover:bg-red-50 transition cursor-pointer"
            >
              Xóa tất cả bộ lọc x
            </button>
          )}

        </aside>

        {/* Catalog Grid Panel */}
        <section className="flex-1 bg-zinc-50 p-6 md:p-10">
          <div className="mb-6 flex flex-wrap gap-2 items-center text-xs">
            <span className="text-zinc-400 font-bold uppercase">Lọc theo:</span>
            <span className="bg-white border border-black px-2 py-1 font-bold uppercase text-[10px]">
              Dòng: {currentCategory}
            </span>
            {activeSubCategory !== 'Tất cả' && (
              <span className="bg-white border border-black px-2 py-1 font-bold uppercase text-[10px]">
                Phân loại: {activeSubCategory}
              </span>
            )}
            {priceRange !== 'all' && (
              <span className="bg-white border border-black px-2 py-1 font-bold uppercase text-[10px]">
                Giá: {priceRange === 'under-500' ? 'Dưới 500k' : priceRange === '500-1000' ? '500k-1000k' : 'Trên 1000k'}
              </span>
            )}
            {selectedColors.length > 0 && (
              <span className="bg-white border border-black px-2 py-1 font-bold uppercase text-[10px]">
                Màu: {selectedColors.join(', ')}
              </span>
            )}
            {selectedSizes.length > 0 && (
              <span className="bg-white border border-black px-2 py-1 font-bold uppercase text-[10px]">
                Kích cỡ: {selectedSizes.join(', ')}
              </span>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white border border-zinc-200">
              <Grid className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <p className="text-sm font-bold text-zinc-600">Rất tiếc, không tìm thấy sản phẩm nào phù hợp.</p>
              <p className="text-xs text-zinc-400 mt-1">Vui lòng điều chỉnh lại bộ lọc hoặc nhập từ khóa tìm kiếm khác.</p>
              <button
                onClick={() => {
                  setSelectedColors([]);
                  setSelectedSizes([]);
                  setPriceRange('all');
                  setSearchQuery('');
                  setOnlyInStock(false);
                  setCurrentCategory('Tất cả');
                  setActiveSubCategory('Tất cả');
                }}
                className="mt-4 inline-block bg-black text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider hover:opacity-85 cursor-pointer"
              >
                Reset bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredProducts.map((product) => {
                const hasDiscount = product.originalPrice && product.originalPrice > product.price;
                const isFullyOutOfStock = product.colors.every(c => 
                  c.stock && typeof c.stock === 'object' && Object.values(c.stock).every(val => !val)
                );
                return (
                  <div 
                    key={product.id} 
                    className="bg-white border border-transparent hover:border-black transition duration-300 group flex flex-col justify-between"
                    id={`product-card-${product.id}`}
                  >
                    {/* Image box with quick preview */}
                    <div 
                      className="relative aspect-[3/4] bg-zinc-100 overflow-hidden cursor-pointer" 
                      onClick={() => setSelectedProduct(product)}
                    >
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                        className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out ${isFullyOutOfStock ? 'grayscale opacity-60' : ''}`}
                      />
                      
                      {product.badge && (
                        <div className={`absolute top-3 left-3 text-[10px] font-black uppercase px-3 py-1 text-white tracking-widest z-10 ${
                          product.badge.includes('%') || product.badge.startsWith('-')
                            ? 'bg-[#b41b1b]' 
                            : product.badge === 'New' 
                              ? 'bg-black' 
                              : 'bg-zinc-800'
                        }`}>
                          {product.badge}
                        </div>
                      )}

                      {isFullyOutOfStock && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                          <span className="bg-[#b41b1b] text-white font-black uppercase text-xs px-4 py-2 tracking-widest border border-white shadow-md animate-pulse">
                            Hết hàng
                          </span>
                        </div>
                      )}

                      {!isFullyOutOfStock && (
                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
                          <span className="bg-white text-black font-bold uppercase text-[11px] px-4 py-2.5 tracking-wider border-2 border-black hover:bg-black hover:text-white transition duration-150">
                            Xem nhanh sản phẩm
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Info text */}
                    <div className="p-4 space-y-1 bg-white border-t border-zinc-100 text-left">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        {product.subCategory}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        SKU: {product.sku}
                      </p>
                      <h4 
                        onClick={() => setSelectedProduct(product)}
                        className="text-xs font-bold uppercase hover:text-[#b41b1b] cursor-pointer tracking-wide line-clamp-2 transition duration-150 h-8"
                      >
                        {product.name}
                      </h4>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-sm font-black text-[#000000]">{formatPrice(product.price)}</span>
                        {hasDiscount && (
                          <span className="text-xs text-zinc-400 line-through font-medium">{formatPrice(product.originalPrice!)}</span>
                        )}
                      </div>

                      {/* Attributes preview bar */}
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 text-[10px] text-zinc-500">
                        <div className="flex gap-1.5">
                          {product.colors.map(col => (
                            <span 
                              key={col.name} 
                              className="w-3.5 h-3.5 rounded-full border border-zinc-300 inline-block" 
                              style={{ backgroundColor: col.hex }}
                              title={col.name}
                            />
                          ))}
                        </div>
                        <span className="font-bold">Size: {product.sizes.filter(s => product.colors.some(c => c.stock[s])).join(', ')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
