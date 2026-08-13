import React, { useState, useEffect } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { Product } from '../../types';
import { SIZE_CONVERSION_CHART } from '../../data';

interface ProductDetailModalProps {
  selectedProduct: Product;
  setSelectedProduct: (product: Product | null) => void;
  productsList: Product[];
  handleAddToCart: (product: Product, color: string, size: string, quantity: number) => void;
  formatPrice: (num: number) => string;
}

export default function ProductDetailModal({
  selectedProduct,
  setSelectedProduct,
  productsList,
  handleAddToCart,
  formatPrice,
}: ProductDetailModalProps) {
  const [productActiveImageIdx, setProductActiveImageIdx] = useState<number>(0);
  const [modalSelectedColor, setModalSelectedColor] = useState<string>('');
  const [modalSelectedSize, setModalSelectedSize] = useState<string>('');
  const [productTabs, setProductTabs] = useState<'description' | 'sizechart' | 'returns'>('description');
  const [overrideImageSrc, setOverrideImageSrc] = useState<string | null>(null);

  // Auto-initialize selected color and size when product changes
  useEffect(() => {
    if (selectedProduct) {
      setProductActiveImageIdx(0);
      const firstColorObj = selectedProduct.colors[0];
      const firstColor = firstColorObj?.name || '';
      setModalSelectedColor(firstColor);
      setOverrideImageSrc(firstColorObj?.image || null);
      
      const sizesAvailable = selectedProduct.sizes.filter(s => {
        const cObj = selectedProduct.colors.find(c => c.name === firstColor);
        return cObj ? cObj.stock[s] : false;
      });
      setModalSelectedSize(sizesAvailable[0] || selectedProduct.sizes[0] || '');
    }
  }, [selectedProduct]);

  const activeImageSrc = overrideImageSrc || selectedProduct.images[productActiveImageIdx] || selectedProduct.images[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 text-left" id="product-detail-modal">
      <div className="bg-white border-2 border-black max-w-5xl w-full max-h-[90vh] overflow-y-auto relative animate-fade-in flex flex-col md:flex-row">
        
        {/* Close trigger top-right */}
        <button 
          onClick={() => setSelectedProduct(null)} 
          className="absolute top-4 right-4 bg-white border border-black p-1.5 hover:bg-black hover:text-white transition z-20 cursor-pointer"
          id="close-product-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column - Gallery */}
        <div className="w-full md:w-1/2 p-6 md:p-8 space-y-4 border-r-0 md:border-r-2 border-black">
          <div className="aspect-[3/4] bg-zinc-100 overflow-hidden relative border border-zinc-200">
            <img 
              src={activeImageSrc} 
              alt={selectedProduct.name} 
              className="w-full h-full object-cover animate-fade-in"
              key={activeImageSrc} // Key forces visual transition refresh
            />
            {selectedProduct.badge && (
              <span className="absolute top-4 left-4 bg-[#b41b1b] text-white text-[10px] font-black uppercase tracking-widest py-1 px-3">
                {selectedProduct.badge}
              </span>
            )}
          </div>

          {/* Thumbnails indicator */}
          {selectedProduct.images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {selectedProduct.images.map((img, idx) => {
                const isActive = activeImageSrc === img;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setProductActiveImageIdx(idx);
                      setOverrideImageSrc(null);
                    }}
                    className={`w-16 h-20 border-2 bg-zinc-50 cursor-pointer shrink-0 transition ${isActive ? 'border-black' : 'border-transparent'}`}
                  >
                    <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column - Attributes & Selections */}
        <div className="w-full md:w-1/2 p-6 md:p-8 space-y-6 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
              DÒNG: {selectedProduct.category}
            </p>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
              MÃ SP (SKU): <span className="text-black font-black">{selectedProduct.sku}</span>
            </p>
            <h3 className="text-xl font-black uppercase tracking-wide text-black mt-1">{selectedProduct.name}</h3>
            
            {/* Product code price */}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xl font-black text-[#b41b1b]">{formatPrice(selectedProduct.price)}</span>
              {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                <span className="text-sm text-zinc-400 line-through font-bold">
                  {formatPrice(selectedProduct.originalPrice)}
                </span>
              )}
            </div>

            <hr className="border-zinc-200 my-4" />

            {/* Color option attribute selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-zinc-400">Chọn Màu Sắc:</span>
              <div className="flex items-center gap-3">
                {selectedProduct.colors.map(col => (
                  <button
                    key={col.name}
                    onClick={() => {
                      setModalSelectedColor(col.name);
                      if (col.image) {
                        setOverrideImageSrc(col.image);
                      } else {
                        setOverrideImageSrc(null);
                      }
                      // Auto validate size stock
                      const sizesInStock = selectedProduct.sizes.filter(s => col.stock[s]);
                      if (!sizesInStock.includes(modalSelectedSize)) {
                        setModalSelectedSize(sizesInStock[0] || '');
                      }
                    }}
                    className={`px-3 py-1.5 border flex items-center gap-2 transition cursor-pointer ${
                      modalSelectedColor === col.name 
                        ? 'border-black bg-zinc-50 font-bold' 
                        : 'border-zinc-200 hover:border-black bg-white'
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full border border-zinc-400 inline-block" style={{ backgroundColor: col.hex }} />
                    <span className="text-xs">{col.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Size options list with out-of-stock disabling */}
            <div className="space-y-2 mt-4">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-black uppercase text-zinc-400">Chọn Kích Cỡ (Size):</span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {selectedProduct.sizes.map(size => {
                  // Check if size is in stock for the active color
                  const colorObj = selectedProduct.colors.find(c => c.name === modalSelectedColor);
                  const isAvailable = colorObj ? colorObj.stock[size] : false;

                  return (
                    <button
                      key={size}
                      disabled={!isAvailable}
                      onClick={() => setModalSelectedSize(size)}
                      className={`relative border text-xs h-9 font-black transition cursor-pointer ${
                        !isAvailable 
                          ? 'border-zinc-100 text-zinc-300 cursor-not-allowed bg-zinc-50' 
                          : modalSelectedSize === size
                            ? 'border-black bg-black text-white'
                            : 'border-zinc-200 hover:border-black text-zinc-700 bg-white'
                      }`}
                    >
                      {size}
                      {/* Cross diag line for out-of-stock */}
                      {!isAvailable && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-full h-[1px] bg-zinc-300 transform rotate-12 absolute"></span>
                          <span className="absolute bottom-0 text-[8px] scale-75 uppercase font-bold text-red-500 bg-white px-0.5">Hết hàng</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accordions description, size details */}
            <div className="mt-6 border-t border-zinc-200 pt-4 space-y-3">
              <div className="flex border-b border-zinc-100 text-xs font-bold mb-2">
                <button 
                  onClick={() => setProductTabs('description')} 
                  className={`pb-2 pr-4 border-b-2 cursor-pointer ${productTabs === 'description' ? 'border-black text-black' : 'border-transparent text-zinc-400'}`}
                >
                  Chi tiết sản phẩm
                </button>
                <button 
                  onClick={() => setProductTabs('sizechart')} 
                  className={`pb-2 px-4 border-b-2 cursor-pointer ${productTabs === 'sizechart' ? 'border-black text-black' : 'border-transparent text-zinc-400'}`}
                >
                  Bảng size quy đổi
                </button>
                <button 
                  onClick={() => setProductTabs('returns')} 
                  className={`pb-2 px-4 border-b-2 cursor-pointer ${productTabs === 'returns' ? 'border-black text-black' : 'border-transparent text-zinc-400'}`}
                >
                  Quy định đổi trả
                </button>
              </div>

              {productTabs === 'description' && (
                <p className="text-xs text-zinc-600 leading-relaxed max-h-[120px] overflow-y-auto">
                  {selectedProduct.description}
                </p>
              )}

              {productTabs === 'sizechart' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] text-left border-collapse border border-zinc-200 bg-zinc-50">
                    <thead>
                      <tr className="bg-zinc-100 font-bold border-b border-zinc-200">
                        <th className="p-1 border border-zinc-200">Size</th>
                        <th className="p-1 border border-zinc-200">Chiều cao</th>
                        <th className="p-1 border border-zinc-200">Cân nặng</th>
                        <th className="p-1 border border-zinc-200">Vòng ngực</th>
                        <th className="p-1 border border-zinc-200">Vòng eo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIZE_CONVERSION_CHART.map((c, i) => (
                        <tr key={i} className={c.size === modalSelectedSize ? 'bg-amber-100 font-bold' : ''}>
                          <td className="p-1 border border-zinc-200 font-bold">{c.size}</td>
                          <td className="p-1 border border-zinc-200">{c.height}</td>
                          <td className="p-1 border border-zinc-200">{c.weight}</td>
                          <td className="p-1 border border-zinc-200">{c.chest}</td>
                          <td className="p-1 border border-zinc-200">{c.waist}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {productTabs === 'returns' && (
                <div className="text-[10px] text-zinc-500 space-y-1">
                  <p>• Đổi trả miễn phí trong vòng 15 ngày kể từ ngày nhận hàng.</p>
                  <p>• Sản phẩm phải còn nguyên mác treo, nhãn mác, chưa qua sử dụng hay giặt là.</p>
                  <p>• Hỗ trợ đổi size tại tất cả hệ thống cửa hàng IVY moda toàn quốc.</p>
                </div>
              )}
            </div>

          </div>

          {/* Related/Suggested Products */}
          <div className="border-t border-zinc-200 pt-4 mt-6">
            <span className="text-[10px] font-black uppercase text-zinc-400 block mb-2.5">Sản Phẩm Gợi Ý Cho Bạn:</span>
            <div className="grid grid-cols-2 gap-3">
              {productsList
                .filter(p => p.id !== selectedProduct.id && p.category === selectedProduct.category)
                .slice(0, 2)
                .map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      setSelectedProduct(item);
                    }}
                    className="flex gap-2.5 items-center cursor-pointer border p-1.5 hover:border-black transition bg-zinc-50"
                  >
                    <img src={item.images[0]} alt={item.name} className="w-8 h-10 object-cover bg-white" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase truncate">{item.name}</p>
                      <p className="text-[10px] font-black text-black">{formatPrice(item.price)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Add to Cart Actions footer */}
          <div className="pt-4 border-t border-zinc-200 flex gap-3">
            <button
              onClick={() => {
                if (!modalSelectedSize) {
                  alert('Vui lòng chọn kích thước sản phẩm trước khi thêm vào giỏ.');
                  return;
                }
                handleAddToCart(selectedProduct, modalSelectedColor, modalSelectedSize, 1);
              }}
              className="flex-1 bg-black text-white py-3.5 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" /> Thêm vào giỏ hàng
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
