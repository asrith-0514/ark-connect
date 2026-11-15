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

function CatalogueProductImage({
  product,
}: {
  product: { id: string; title: string; image: string };
}) {
  const { primaryUrl } = useEntityImages("style", product.id);
  const display = primaryUrl || product.image;

  return (
    <img
      src={display}
      alt={product.title}
      loading="lazy"
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
    />
  );
}

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

  return (
    <div className="flex flex-col w-full pb-36 sm:pb-32 text-ink">
      {/* Top Header & Search Area */}
      <div className="bg-surface border-b border-border py-4 px-3 sm:px-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-page-title text-xl sm:text-3xl text-ink font-normal tracking-tight">
              {getRetailerString(language, "navShop")} • Tiruppur Wholesale
            </h1>
            <p className="text-[11px] sm:text-xs text-ink-muted mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span>{RETAILER_PROFILE.dispatchHub}</span>
              <span>•</span>
              <span>Box packed wholesale</span>
              <span>•</span>
              <span>Net prices (GST extra)</span>
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Icon name="search" size={18} className="absolute left-3.5 top-2.5 sm:top-3 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={getRetailerString(language, "searchPlaceholder")}
              className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-background border border-border text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-soft-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 sm:top-3 text-ink-muted hover:text-ink cursor-pointer p-1"
                aria-label="Clear search query"
              >
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Filter & Category Bar */}
      <div
        style={{ top: "var(--retailer-header-height, 60px)" }}
        className="sticky top-[var(--retailer-header-height,60px)] z-20 bg-surface/95 backdrop-blur-md border-b border-border shadow-soft-sm py-2.5 px-3 sm:px-6 transition-colors duration-200"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          {/* Filter Bottom Sheet Trigger Button */}
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 border transition-all cursor-pointer ${
              activeFiltersCount > 0
                ? "bg-primary text-primary-foreground border-primary shadow-soft-sm"
                : "bg-background border-border text-ink hover:bg-surface"
            }`}
          >
            <Icon name="tune" size={16} />
            <span>{getRetailerString(language, "filterBtn")}</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white text-primary text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div className="h-5 w-px bg-border shrink-0" />

          {/* Horizontal Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-accent/15 text-accent border border-accent/40 shadow-[0_0_8px_rgba(34,229,255,0.2)] font-bold"
                    : "bg-surface border border-border text-ink-muted hover:text-ink hover:bg-background"
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
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-surface border border-border text-xs font-semibold text-ink outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-soft-sm"
            >
              {brands.map(b => (
                <option key={b} value={b}>
                  {b === "All" ? `All Brands (${MOCK_BRANDS.length})` : b}
                </option>
              ))}
            </select>

            <label className="min-h-[40px] flex items-center gap-2 text-xs text-ink font-medium cursor-pointer bg-surface px-3 py-1.5 rounded-lg border border-border hover:bg-background shadow-soft-sm select-none">
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
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 py-4 sm:py-8 w-full">
        {/* Count Strip */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-[11px] sm:text-xs font-bold text-ink-muted uppercase tracking-wider num">
            {filteredProducts.length} wholesale articles
          </span>
          <Badge variant="success" size="sm" dot pulse>
            Ready in Hub
          </Badge>
        </div>

        {filteredProducts.length === 0 ? (
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
            {filteredProducts.map(product => {
              const pieces = product.piecesPerUnit || 10;
              const pricePerPiece = product.pricePerUnit / pieces;
              const unitShort = getUnitShort(product.unitLabel);

              const productCartItems = cartItems.filter(item => item.productId === product.id);
              const totalBoxesInCart = productCartItems.reduce((sum, item) => sum + item.units, 0);
              const isInDraftPO = totalBoxesInCart > 0;

              return (
                <div
                  key={product.id}
                  className="flex flex-col justify-between bg-surface rounded-xl sm:rounded-2xl p-2.5 sm:p-4 shadow-soft-sm hover:shadow-soft-md transition-all duration-200 border border-border group"
                >
                  {/* Top Imagery Container */}
                  <div>
                    <div className="relative w-full aspect-square sm:aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-background mb-2 sm:mb-3 border border-border">
                      <CatalogueProductImage product={product} />
                      {/* Top Badges */}
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-1">
                        <span className="bg-surface/90 backdrop-blur-md text-ink text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shadow-soft-sm border border-border">
                          {product.brand}
                        </span>
                        {product.pricePending && (
                          <span className="bg-warning/20 border border-warning/40 text-warning text-[9px] px-1.5 py-0.5 rounded font-bold font-mono uppercase shadow-soft-sm">
                            {getRetailerString(language, "pricePending")}
                          </span>
                        )}
                      </div>

                      {/* Stock LED Badge */}
                      <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 bg-surface/90 backdrop-blur-md px-1.5 py-0.5 rounded flex items-center gap-1.5 shadow-soft-sm border border-border">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-success shadow-[0_0_6px_rgba(47,208,138,0.9)]" />
                        </span>
                        <span className="text-[10px] text-success font-bold font-mono num">
                          {product.stockUnits.toLocaleString("en-IN")} pcs
                        </span>
                      </div>
                    </div>

                    {/* Article Info */}
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[9px] text-ink-muted font-mono uppercase tracking-wider num">
                        <span>ART #{product.artNumber}</span>
                        <span>{product.category}</span>
                      </div>
                      <h3 className="font-bold text-ink text-xs sm:text-sm mt-0.5 leading-snug line-clamp-1 group-hover:text-accent transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-ink-muted mt-0.5 line-clamp-1">
                        {product.description}
                      </p>

                      {/* Pricing in Mono + Pack Info */}
                      <div className="mt-2 p-2 sm:p-2.5 bg-background rounded-lg border border-border">
                        {product.pricePending ? (
                          <div className="text-[11px] sm:text-xs font-bold text-warning font-mono flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
                            <span>{getRetailerString(language, "pricePending")}</span>
                          </div>
                        ) : (
                          <div className="flex items-baseline justify-between gap-1 flex-wrap">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xs sm:text-base font-bold text-ink font-mono num">
                                {formatINR(product.pricePerUnit)}
                              </span>
                              <span className="text-[10px] text-ink-muted font-mono">/{unitShort}</span>
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-semibold text-ink-muted font-mono num">
                              {formatINR(pricePerPiece)}/{getRetailerString(language, "perPiece")}
                            </span>
                          </div>
                        )}

                        <div className="mt-1 pt-1 border-t border-border flex items-center justify-between text-[10px] text-ink-muted font-mono">
                          <span>{getRetailerString(language, "boxOf")} {pieces} {getRetailerString(language, "pcs")}</span>
                          <span className="font-medium">Min: {product.minOrderUnits || 5}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button: 48px Tap Target */}
                  <div className="mt-2.5 pt-1">
                    {isInDraftPO ? (
                      <div className="w-full min-h-[44px] flex items-center bg-success/15 border border-success/30 rounded-xl overflow-hidden shadow-soft-sm">
                        <button
                          type="button"
                          onClick={() => handleStepQuantity(product.id, -1)}
                          className="w-11 min-h-[44px] flex items-center justify-center text-success hover:bg-success/20 active:bg-success/30 transition-colors cursor-pointer"
                          aria-label={`Decrease ${product.title} by 1 box`}
                        >
                          <Icon name="remove" size={18} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openMatrixModal(product)}
                          className="flex-1 min-h-[44px] px-1 flex items-center justify-center gap-1 text-success font-bold text-xs cursor-pointer num"
                        >
                          <span>{totalBoxesInCart} {getRetailerString(language, "boxes")}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStepQuantity(product.id, 1)}
                          className="w-11 min-h-[44px] flex items-center justify-center text-success hover:bg-success/20 active:bg-success/30 transition-colors cursor-pointer"
                          aria-label={`Increase ${product.title} by 1 box`}
                        >
                          <Icon name="add" size={18} />
                        </button>
                      </div>
                    ) : product.pricePending ? (
                      <button
                        type="button"
                        onClick={() => openMatrixModal(product)}
                        className="w-full min-h-[44px] px-2 rounded-xl bg-surface border border-warning/30 text-warning text-xs font-bold hover:bg-warning/10 flex items-center justify-center gap-1.5 cursor-pointer shadow-soft-sm"
                      >
                        <Icon name="visibility" size={16} />
                        <span>{getRetailerString(language, "previewVariants")}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openMatrixModal(product)}
                        className="w-full min-h-[44px] px-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 active:scale-98 transition-transform flex items-center justify-center gap-1.5 cursor-pointer shadow-soft-sm"
                      >
                        <Icon name="add_circle" size={16} />
                        <span>{getRetailerString(language, "selectSizes")}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
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
