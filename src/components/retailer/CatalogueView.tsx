"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { MOCK_BRANDS, MOCK_PRODUCTS, Product } from "@/data/mockData";
import {
  RETAILER_PROFILE,
  SHARED_PRODUCT_CATEGORIES,
  formatINR,
} from "@/lib/mock/retailer";

export default function CatalogueView() {
  const {
    openMatrixModal,
    setIsReviewOrderOpen,
    cartTotalBoxes,
    cartGrandTotal,
    cartItems,
    updateCartItemQty,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Requirement 3: Use one shared category list everywhere
  const categories = SHARED_PRODUCT_CATEGORIES;
  // All 9 brands dynamically from canonical brand list
  const brands = ["All", ...MOCK_BRANDS.map(b => b.name)];

  // Helper to get unit short name (box, pack, set)
  const getUnitShort = (unitLabel: string) => {
    const lower = unitLabel.toLowerCase();
    if (lower.includes("box")) return "box";
    if (lower.includes("pack")) return "pack";
    if (lower.includes("set")) return "set";
    return "unit";
  };

  // Helper to adjust quantity directly from the card stepper
  const handleStepQuantity = (productId: string, delta: number) => {
    const items = cartItems.filter(i => i.productId === productId);
    if (items.length === 0) return;
    const target = items[items.length - 1];
    updateCartItemQty(target.productId, target.color, target.size, delta);
  };

  // Filter products
  const filteredProducts = MOCK_PRODUCTS.filter(product => {
    if (selectedCategory !== "All" && product.category !== selectedCategory) return false;
    if (selectedBrand !== "All" && product.brand !== selectedBrand) return false;
    if (inStockOnly && product.stockUnits <= 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        product.title.toLowerCase().includes(q) ||
        product.brand.toLowerCase().includes(q) ||
        product.artNumber.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col w-full pb-36 sm:pb-32">
      {/* Top Header & Search Area (Scrolls naturally) */}
      <div className="bg-white border-b border-slate-100 py-4 sm:py-5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Catalogue • Sourced from Tiruppur mills
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>Dispatched from {RETAILER_PROFILE.dispatchHub}</span>
              <span>•</span>
              <span>Standard wholesale box packs</span>
              <span>•</span>
              <span>Wholesale net pricing</span>
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search SKU, Art #, fabric, style..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label="Clear search query"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Filter Row dynamically following real header height (including demo banner and mobile) */}
      <div
        style={{ top: "var(--retailer-header-height, 60px)" }}
        className="sticky top-[var(--retailer-header-height,60px)] z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs py-2.5 px-3 sm:px-6"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Requirement 3: Category Chips from shared canonical list (min 44px tap targets) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] px-3.5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-[#0047d3] text-white shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Brand Dropdown & Hub Toggle (min 44px tap targets) */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {/* Brand Dropdown */}
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 outline-none cursor-pointer focus:ring-2 focus:ring-[#0047d3]"
            >
              {brands.map(b => (
                <option key={b} value={b}>
                  {b === "All" ? `All Brands (${MOCK_BRANDS.length})` : b}
                </option>
              ))}
            </select>

            {/* Requirement 6: Match dispatch label */}
            <label className="min-h-[44px] flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-200 select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-[#0047d3] focus:ring-0 cursor-pointer"
              />
              <span>Ready in Hub</span>
            </label>
          </div>
        </div>
      </div>

      {/* Product Grid Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
        {/* Sub-header with count and Requirement 6 Dispatch Label */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredProducts.length} wholesale articles
          </span>
          {/* Requirement 6: Dispatch label matches every other page */}
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Secunderabad Hub Dispatch</span>
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <span className="material-symbols-outlined text-[48px] text-slate-300">
              filter_alt_off
            </span>
            <h3 className="text-base font-bold text-slate-800 mt-2">
              No articles match your filters
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Try resetting category or search criteria.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setSelectedBrand("All");
                setSearchQuery("");
                setInStockOnly(false);
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map(product => {
              // Calculate price per piece
              const pieces = product.piecesPerUnit || 10;
              const pricePerPiece = product.pricePerUnit / pieces;
              const unitShort = getUnitShort(product.unitLabel);

              // Check if item is already in Draft PO (Requirement 5)
              const productCartItems = cartItems.filter(item => item.productId === product.id);
              const totalBoxesInCart = productCartItems.reduce((sum, item) => sum + item.units, 0);
              const isInDraftPO = totalBoxesInCart > 0;

              return (
                <div
                  key={product.id}
                  className="flex flex-col bg-white rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all relative group border border-slate-200"
                >
                  {/* Image Container with Badges */}
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-4 border border-slate-100">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                      <span className="bg-[#0047d3] text-white text-[11px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider shadow-sm">
                        {product.brand}
                      </span>
                      <span className="bg-white/90 backdrop-blur-md text-slate-800 text-[11px] px-2 py-1 rounded-md font-mono font-semibold shadow-2xs">
                        Art #{product.artNumber}
                      </span>
                    </div>

                    {/* Requirement 6: Dispatch badge on card */}
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm border border-slate-200/60">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] text-emerald-800 font-bold">
                        {product.stockUnits.toLocaleString("en-IN")} pcs in Secunderabad Hub
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">
                          {product.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Requirement 4: Show price per piece beside pack price, and minimum order as a clear badge */}
                      <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Wholesale Net Price
                            </span>
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mt-0.5">
                              <span className="text-xl font-bold text-[#0047d3] font-mono">
                                {formatINR(product.pricePerUnit)}
                              </span>
                              <span className="text-xs text-slate-600 font-medium">
                                / {unitShort}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">·</span>
                              <span className="text-xs font-semibold text-slate-700 font-mono">
                                {formatINR(pricePerPiece)} per pc
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Minimum Order as a Clear Badge */}
                        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold tracking-tight">
                            <span className="material-symbols-outlined text-[15px] text-amber-700">
                              inventory_2
                            </span>
                            <span>{product.minOrderLabel || `Min: ${product.minOrderUnits || 5} ${unitShort}s`}</span>
                          </span>

                          <span className="text-[11px] text-slate-500 font-medium">
                            {pieces} pcs / {unitShort}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons (Requirement 5: Edit (X boxes) stepper when in draft PO) */}
                    <div className="mt-4 pt-1 flex items-center gap-2">
                      {isInDraftPO ? (
                        <div className="flex-1 h-11 flex items-center bg-emerald-50 border border-emerald-300 rounded-xl overflow-hidden shadow-2xs">
                          {/* Decrement Stepper */}
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(product.id, -1)}
                            className="w-10 h-full flex items-center justify-center text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 transition-colors cursor-pointer"
                            aria-label={`Decrease ${product.title} by 1 box`}
                            title="Decrease 1 box"
                          >
                            <span className="material-symbols-outlined text-[18px]">remove</span>
                          </button>

                          {/* Edit Matrix Trigger */}
                          <button
                            type="button"
                            onClick={() => openMatrixModal(product)}
                            className="flex-1 h-full px-2 flex items-center justify-center gap-1.5 text-emerald-900 hover:bg-emerald-100/70 transition-colors font-bold text-xs sm:text-sm cursor-pointer"
                            title="Open size matrix to edit breakdown"
                          >
                            <span className="material-symbols-outlined text-[16px] text-emerald-700">
                              edit_note
                            </span>
                            <span>
                              Edit ({totalBoxesInCart} {totalBoxesInCart === 1 ? "box" : "boxes"})
                            </span>
                          </button>

                          {/* Increment Stepper */}
                          <button
                            type="button"
                            onClick={() => handleStepQuantity(product.id, 1)}
                            className="w-10 h-full flex items-center justify-center text-emerald-800 hover:bg-emerald-100 active:bg-emerald-200 transition-colors cursor-pointer"
                            aria-label={`Increase ${product.title} by 1 box`}
                            title="Increase 1 box"
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openMatrixModal(product)}
                          className="flex-1 h-11 bg-[#0047d3] hover:bg-[#1e5eff] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">grid_on</span>
                          <span>Select Sizes & Add</span>
                        </button>
                      )}

                      <button
                        type="button"
                        className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors border border-slate-200 cursor-pointer"
                        title="Bookmark Article"
                        aria-label="Bookmark article"
                      >
                        <span className="material-symbols-outlined text-[20px]">bookmark_border</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Requirement 1: Persistent Docked Floating Cart Strip
          - Desktop: bottom-5, centered with max-w-xl, never hiding card action buttons
          - Mobile: full-width bottom sheet docked right above mobile bottom nav */}
      {cartItems.length > 0 && (
        <aside
          role="region"
          aria-label="Active Draft Purchase Order Summary"
          className="fixed bottom-14 left-0 right-0 sm:bottom-5 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl sm:px-4 z-40 pointer-events-auto"
        >
          <div className="bg-slate-900/98 backdrop-blur-xl text-white rounded-none sm:rounded-2xl p-3 sm:p-3 sm:px-5 shadow-2xl flex items-center justify-between gap-3 sm:gap-4 border-t sm:border border-slate-800">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#0047d3] flex items-center justify-center text-white shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-[10px] sm:text-[11px] text-emerald-400 uppercase font-bold tracking-wide">
                    Ready for PO
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-300 font-mono truncate">
                    {cartItems.length} Lines ({cartTotalBoxes} Boxes)
                  </span>
                </div>
                <span className="text-base sm:text-lg font-bold text-white font-mono">
                  {formatINR(cartGrandTotal)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewOrderOpen(true)}
              className="h-10 px-4 sm:px-5 bg-[#0047d3] hover:bg-[#1e5eff] text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shadow-md transition-all active:scale-98 shrink-0 cursor-pointer"
            >
              <span>Review Order</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </aside>
      )}
    </div>
  );
}
