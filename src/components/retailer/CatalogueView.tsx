"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { MOCK_BRANDS, MOCK_PRODUCTS } from "@/data/mockData";
import {
  RETAILER_PROFILE,
  SHARED_PRODUCT_CATEGORIES,
  formatINR,
} from "@/lib/mock/retailer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRetailerString } from "@/lib/i18n/retailer";
import { useEntityImages } from "@/lib/storage/imageStore";

import { ProductTile } from "./ProductTile";

function AnimatedCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced) {
        setDisplay(value);
        return;
      }
    }

    const startVal = prevValueRef.current;
    const endVal = value;
    const duration = 400;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (endVal - startVal) * easeOut);
      setDisplay(current);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        prevValueRef.current = endVal;
      }
    };

    startTimeRef.current = null;
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [value]);

  return <span className="num">{formatINR(display)}</span>;
}

export default function CatalogueView() {
  const {
    openMatrixModal,
    setIsReviewOrderOpen,
    cartTotalBoxes,
    cartGrandTotal,
    cartItems,
    updateCartItemQty,
  } = useApp();

  const { language } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);

  const categories = SHARED_PRODUCT_CATEGORIES;
  const brands = ["All", ...MOCK_BRANDS.map(b => b.name)];

  const getUnitShort = (unitLabel: string) => {
    const lower = unitLabel.toLowerCase();
    if (lower.includes("box")) return "bx";
    if (lower.includes("pack")) return "pk";
    if (lower.includes("set")) return "set";
    return "box";
  };

  const handleStepQuantity = (productId: string, delta: number) => {
    const items = cartItems.filter(i => i.productId === productId);
    if (items.length === 0) return;
    const target = items[items.length - 1];
    updateCartItemQty(target.productId, target.color, target.size, delta);
  };

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

  const activeFiltersCount =
    (selectedCategory !== "All" ? 1 : 0) +
    (selectedBrand !== "All" ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  // Split products: Available to order (priced) vs Price coming soon (pricePending)
  const availableProducts = filteredProducts.filter(p => !p.pricePending);
  const pendingProducts = filteredProducts.filter(p => p.pricePending);
  const [isPendingSectionOpen, setIsPendingSectionOpen] = useState(false);

  return (
    <div className="flex flex-col w-full pb-6 sm:pb-8 text-ink">
      {/* Sticky Category & Filter Chips Bar */}
      <div
        style={{ top: "var(--retailer-header-height, 56px)" }}
        className="sticky top-[var(--retailer-header-height,56px)] z-20 bg-surface/95 backdrop-blur-md border-b border-border shadow-soft-sm py-2 px-3 sm:px-6 transition-colors duration-200"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Filter Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`h-9 px-3 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeFiltersCount > 0
                ? "bg-primary text-white border-primary shadow-soft-xs"
                : "bg-surface border-border text-ink hover:bg-surface-raised"
            }`}
          >
            <Icon name="tune" size={15} />
            <span>{getRetailerString(language, "filterBtn")}</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="h-4 w-px bg-border shrink-0" />

          {/* Horizontal Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-9 px-3.5 rounded-full text-xs whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-white shadow-soft-xs font-semibold"
                    : "bg-surface border border-border text-ink-muted hover:text-ink hover:bg-surface-raised"
                }`}
              >
                {cat === "All" ? getRetailerString(language, "allCategories") : cat}
              </button>
            ))}
          </div>

          {/* Desktop Brand Filter Select */}
          <div className="hidden md:flex items-center gap-2 shrink-0 ml-auto">
            <select
              value={selectedBrand}
              onChange={e => setSelectedBrand(e.target.value)}
              className="h-9 px-3 rounded-lg bg-surface border border-border text-xs font-semibold text-ink outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-soft-xs"
            >
              {brands.map(b => (
                <option key={b} value={b}>
                  {b === "All" ? `All Brands (${MOCK_BRANDS.length})` : b}
                </option>
              ))}
            </select>

            <label className="h-9 flex items-center gap-2 text-xs text-ink font-medium cursor-pointer bg-surface px-3 rounded-lg border border-border hover:bg-surface-raised shadow-soft-xs select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={e => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
              />
              <span>In Hub Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* 2-Column Product Grid Main Content */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 py-3 sm:py-6 w-full">
        {/* Count Strip */}
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider num">
            {availableProducts.length} articles available to order
          </span>
          <Badge variant="success" size="sm" dot pulse>
            In Stock
          </Badge>
        </div>

        {availableProducts.length === 0 && pendingProducts.length === 0 ? (
          <EmptyState
            icon={<Icon name="search_off" size={28} />}
            title="No articles match your filters"
            description="Try resetting the category or search criteria."
            className="bg-surface rounded-lg border border-border shadow-soft-sm"
            actionLabel={getRetailerString(language, "resetFilters")}
            onAction={() => {
              setSelectedCategory("All");
              setSelectedBrand("All");
              setSearchQuery("");
              setInStockOnly(false);
            }}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {availableProducts.map(product => {
              const pieces = product.piecesPerUnit || 10;
              const productCartItems = cartItems.filter(item => item.productId === product.id);
              const totalBoxesInCart = productCartItems.reduce((sum, item) => sum + item.units, 0);
              const isInDraftPO = totalBoxesInCart > 0;

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between bg-surface rounded-xl p-2.5 sm:p-3.5 shadow-soft-xs hover:shadow-soft-sm transition-all duration-200 border border-border group"
                >
                  {/* Top Imagery Container & Details */}
                  <div
                    onClick={() => openMatrixModal(product)}
                    className="cursor-pointer"
                  >
                    <ProductTile
                      productId={product.id}
                      brand={product.brand}
                      category={product.category}
                      title={product.title}
                      pcsPerBox={pieces}
                      aspectRatio="aspect-square"
                    />

                    {/* Article Info: Name, Price per box, Box of N */}
                    <div className="mt-2">
                      <h3 className="font-semibold text-ink text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>

                      <div className="mt-1 flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm sm:text-base font-bold text-ink font-mono num">
                            {formatINR(product.pricePerUnit)}
                          </span>
                          <span className="text-[11px] text-ink-muted">/ box</span>
                        </div>
                        <span className="text-[11px] text-ink-muted">
                          Box of {pieces} pcs
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* One Add button / Qty Stepper */}
                  <div className="mt-2.5">
                    {isInDraftPO ? (
                      <div className="w-full h-9 flex items-center bg-primary/10 border border-primary/30 rounded-lg overflow-hidden shadow-soft-xs">
                        <button
                          type="button"
                          onClick={() => handleStepQuantity(product.id, -1)}
                          className="w-9 h-9 flex items-center justify-center text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors cursor-pointer text-base font-bold"
                          aria-label={`Decrease ${product.title} by 1 box`}
                        >
                          <Icon name="remove" size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openMatrixModal(product)}
                          className="flex-1 h-9 px-1 flex items-center justify-center gap-1 text-primary font-bold text-xs cursor-pointer num"
                        >
                          <span>{totalBoxesInCart} {totalBoxesInCart === 1 ? "bx" : "bx"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStepQuantity(product.id, 1)}
                          className="w-9 h-9 flex items-center justify-center text-primary hover:bg-primary/20 active:bg-primary/30 transition-colors cursor-pointer text-base font-bold"
                          aria-label={`Increase ${product.title} by 1 box`}
                        >
                          <Icon name="add" size={16} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openMatrixModal(product)}
                        className="w-full h-9 px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shadow-soft-xs active:scale-[0.98] transition-transform"
                      >
                        <Icon name="add" size={15} />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Collapsible Section: Price coming soon (for styles with pending wholesale prices) */}
        {pendingProducts.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setIsPendingSectionOpen(!isPendingSectionOpen)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-surface border border-border text-left hover:bg-surface-raised transition-colors cursor-pointer shadow-soft-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-semibold text-ink">
                  Price coming soon ({pendingProducts.length} styles)
                </span>
              </div>
              <Icon
                name={isPendingSectionOpen ? "expand_less" : "expand_more"}
                size={18}
                className="text-ink-muted"
              />
            </button>

            {isPendingSectionOpen && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 mt-3">
                {pendingProducts.map(product => {
                  const pieces = product.piecesPerUnit || 10;
                  return (
                    <div
                      key={product.id}
                      className="flex flex-col justify-between bg-surface/80 rounded-xl p-2.5 sm:p-3 border border-border opacity-85 hover:opacity-100 transition-opacity"
                    >
                      <div onClick={() => openMatrixModal(product)} className="cursor-pointer">
                        <ProductTile
                          productId={product.id}
                          brand={product.brand}
                          category={product.category}
                          title={product.title}
                          pcsPerBox={pieces}
                          aspectRatio="aspect-square"
                        />
                        <h3 className="font-semibold text-ink text-xs line-clamp-2 mt-2">
                          {product.title}
                        </h3>
                        <div className="text-[11px] font-semibold text-amber-500 mt-1">
                          Price pending
                        </div>
                        <div className="text-[11px] text-ink-muted">
                          Box of {pieces} pcs
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openMatrixModal(product)}
                        className="w-full h-8 mt-2 rounded-lg border border-border text-ink-muted text-[11px] font-medium hover:bg-surface-raised flex items-center justify-center cursor-pointer"
                      >
                        Preview sizes
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Desktop Floating PO Bar (on mobile, RetailerBottomNav handles the docked PO bar) */}
      {cartItems.length > 0 && (
        <aside
          role="region"
          aria-label="Active Purchase Order Summary"
          className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-xl z-40 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="bg-surface/95 backdrop-blur-md text-ink rounded-full p-3 px-5 shadow-soft-xl flex items-center justify-between gap-4 border border-border">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-soft-sm shrink-0">
                <Icon name="shopping_bag" size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <Badge variant="success" size="sm" dot>
                    Ready for PO
                  </Badge>
                  <span className="text-border">•</span>
                  <span className="text-xs text-ink-muted num truncate font-medium">
                    {cartItems.length} Lines ({cartTotalBoxes} Boxes)
                  </span>
                </div>
                <div className="text-base sm:text-lg font-bold text-primary font-mono num">
                  <AnimatedCounter value={cartGrandTotal} />
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="rounded-full shrink-0"
              onClick={() => setIsReviewOrderOpen(true)}
              rightIcon={<Icon name="arrow_forward" size={18} />}
            >
              Review Order
            </Button>
          </div>
        </aside>
      )}

      {/* Filter Bottom Sheet (Mobile & Tablet) */}
      {isFilterSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-surface rounded-t-2xl sm:rounded-2xl max-h-[85vh] flex flex-col shadow-soft-xl border border-border text-ink overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Sheet Header */}
            <div className="p-4 bg-surface border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="tune" size={20} className="text-primary" />
                <h3 className="font-bold text-base text-ink">
                  {getRetailerString(language, "filterTitle")}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-background hover:bg-surface-raised flex items-center justify-center text-ink-muted hover:text-ink cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Sheet Body */}
            <div className="p-4 overflow-y-auto space-y-5 flex-1">
              {/* Category Filter */}
              <div>
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-2">
                  Category
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer border ${
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-ink hover:bg-surface"
                      }`}
                    >
                      {cat === "All" ? getRetailerString(language, "allCategories") : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Filter */}
              <div>
                <span className="text-xs font-bold text-ink-muted uppercase tracking-wider block mb-2">
                  Brand
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {brands.map(brand => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer border ${
                        selectedBrand === brand
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border text-ink hover:bg-surface"
                      }`}
                    >
                      {brand === "All" ? getRetailerString(language, "allBrands") : brand}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stock Toggle */}
              <div className="p-3 bg-background rounded-xl border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-ink block">
                    {getRetailerString(language, "inStockOnly")}
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    Show only articles ready in Secunderabad hub
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => setInStockOnly(e.target.checked)}
                  className="w-5 h-5 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
                />
              </div>
            </div>

            {/* Sheet Footer CTAs */}
            <div className="p-3.5 bg-surface border-t border-border flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedBrand("All");
                  setInStockOnly(false);
                }}
                className="flex-1 min-h-[44px] rounded-xl bg-background border border-border text-xs font-semibold text-ink hover:bg-surface cursor-pointer"
              >
                {getRetailerString(language, "resetFilters")}
              </button>
              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 min-h-[44px] rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 cursor-pointer shadow-soft-sm"
              >
                {getRetailerString(language, "applyFilters")} ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
