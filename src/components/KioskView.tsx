import React, { useState } from 'react';
import { Product, Coupon, CouponRedemption } from '../types.ts';
import { Beer, Search, Coffee, Utensils, Sparkles, AlertTriangle, Copy, Check } from 'lucide-react';
import { KioskCouponCarousel } from './KioskCouponCarousel.tsx';

interface KioskViewProps {
  products: Product[];
  coupons?: Coupon[];
  redemptions?: CouponRedemption[];
  mobilePayNumber?: string;
}

export const KioskView: React.FC<KioskViewProps> = ({
  products,
  coupons,
  redemptions,
  mobilePayNumber,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Alle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Extract categories dynamically
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category))) as string[];
  const categories: string[] = ['Alle', ...uniqueCategories];

  const handleCopyMobilePay = () => {
    if (!mobilePayNumber) return;
    navigator.clipboard.writeText(mobilePayNumber.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter products
  const filteredProducts = products.filter((item) => {
    const matchesCategory = selectedCategory === 'Alle' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pb-16 pt-2">
      {/* Header banner */}
      <div className="bg-[#081326] text-white rounded-2xl p-5 mb-3 shadow-sm border border-white/10">
        <div className="flex items-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">
          <Beer className="w-3.5 h-3.5 text-amber-400" />
          <span>Ceres Arena Kiosk & Bar</span>
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">
          Kiosk & Priser
        </h2>
        <p className="text-xs text-gray-300 mt-0.5">
          Se det fulde sortiment og priser i hallens kiosker.
        </p>
      </div>

      {/* MobilePay Banner (Only shown if configured) */}
      {mobilePayNumber && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-700 text-white shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">
              Hurtig betaling
            </span>
            <div className="text-sm sm:text-base font-black tracking-tight flex items-center gap-1.5 flex-wrap">
              <span>Betal med MobilePay til:</span>
              <span className="font-mono bg-white/20 px-2 py-0.5 rounded-lg text-white">
                {mobilePayNumber}
              </span>
            </div>
          </div>

          <button
            id="copy-mobilepay-btn"
            onClick={handleCopyMobilePay}
            className="shrink-0 px-3 py-2 rounded-xl bg-white text-blue-900 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs hover:bg-blue-50 active:scale-95 transition-all"
            aria-label="Kopier MobilePay nummer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kopieret</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-blue-700" />
                <span>Kopier</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Dagens Kuponer - Horizontal Swipeable Carousel (Shown only when active coupons exist) */}
      <KioskCouponCarousel coupons={coupons} redemptions={redemptions} />

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          id="kiosk-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Søg efter øl, sodavand, toast, slik..."
          className="w-full pl-10 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#081326] shadow-xs"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-xs font-bold text-gray-400 hover:text-gray-600 uppercase"
          >
            Ryd
          </button>
        )}
      </div>

      {/* Category Pills (Horizontal scrollable) */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`cat-filter-${cat.toLowerCase()}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all select-none ${
              selectedCategory === cat
                ? 'bg-[#081326] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products list */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center text-gray-500 border border-gray-200">
          Ingen varer fundet for søgningen.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredProducts.map((product) => {
            const isSoldOut = !product.available;

            return (
              <div
                key={product.id}
                id={`kiosk-item-${product.id}`}
                className={`bg-white rounded-2xl p-4 border transition-all flex items-center justify-between gap-3 ${
                  isSoldOut
                    ? 'border-gray-200/60 bg-gray-50/70 opacity-75'
                    : 'border-gray-200 hover:border-gray-300 shadow-xs'
                }`}
              >
                <div className="flex-1 pr-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-[#081326] text-sm leading-snug">
                      {product.name}
                    </span>

                    {product.promotionalLabel && !isSoldOut && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-900 border border-amber-500/30">
                        {product.promotionalLabel}
                      </span>
                    )}

                    {isSoldOut && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#C8102E] text-white">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        UDSOLGT
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {product.description}
                    </p>
                  )}

                  <div className="text-[11px] text-gray-400 mt-1 font-medium">
                    Kategori: {product.category}
                  </div>
                </div>

                {/* Price tag */}
                <div className="flex flex-col items-end flex-shrink-0">
                  <div className={`px-3 py-1.5 rounded-xl font-black text-sm sm:text-base tracking-tight ${
                    isSoldOut ? 'bg-gray-200 text-gray-500' : 'bg-[#F6F6F4] text-[#081326] border border-gray-200'
                  }`}>
                    {product.price} kr.
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info card at bottom */}
      <div className="mt-5 p-3.5 rounded-2xl bg-white border border-gray-200 text-center text-xs text-gray-500">
        <span>Kioskerne findes i fanzonen samt ved indgang A og B i Ceres Arena.</span>
      </div>
    </div>
  );
};
