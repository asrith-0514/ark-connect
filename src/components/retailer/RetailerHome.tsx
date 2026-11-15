"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { MOCK_BRANDS, MOCK_PRODUCTS, Product, Brand } from "@/data/mockData";
import { CATEGORIES_CONFIG, getBrandConfig } from "@/lib/mock/catalogueConfig";
import {
  RETAILER_PROFILE,
  formatINR,
  getRetailerFinancials,
} from "@/lib/mock/retailer";
import { getRetailerString } from "@/lib/i18n/retailer";
import confetti from "canvas-confetti";
import { useEntityImages } from "@/lib/storage/imageStore";

function BrandStoryRing({
  brand,
  onClick,
}: {
  brand: Brand;
  onClick: () => void;
}) {
  const { primaryUrl } = useEntityImages("brand", brand.id);
  const config = getBrandConfig(brand.id);
  const initials = brand.name
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 3);
  const displayImage = primaryUrl || brand.image;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
    >
      <div className="w-16 h-16 rounded-full p-0.5 ring-2 ring-primary/30 group-hover:ring-primary group-hover:scale-105 transition-all duration-200 bg-surface shadow-soft-sm flex items-center justify-center overflow-hidden">
        {displayImage ? (
          <img
            src={displayImage}
            alt={brand.name}
            loading="lazy"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full rounded-full ${config.colorConfig.accentBadge} font-bold text-sm flex items-center justify-center font-mono`}
          >
            {initials}
          </div>
        )}
      </div>
      <span className="text-[11px] font-semibold text-ink group-hover:text-primary transition-colors max-w-[70px] truncate text-center">
        {brand.name}
      </span>
    </button>
  );
}

function ProductRailImage({ product }: { product: Product }) {
  const { primaryUrl } = useEntityImages("style", product.id);
  const displayImage = primaryUrl || product.image;

  return (
    <img
      src={displayImage}
      alt={product.title}
      loading="lazy"
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
    />
  );
}

export function RetailerHome() {
  const {
    setRetailerNav,
    setIsReviewOrderOpen,
    openMatrixModal,
    addToCart,
    orders,
    currentDate,
    activeRetailer,
  } = useApp();
  const { language, user } = useAuth();

  const [reorderSuccess, setReorderSuccess] = useState(false);
  const [isTrackLrModalOpen, setIsTrackLrModalOpen] = useState(false);

  const financials = getRetailerFinancials(undefined, undefined, currentDate);

  // 1. Last completed or active order for "Reorder" card
  const lastOrder = orders.find(o => o.status === "Dispatched" || o.status === "Delivered") || orders[0];

  const handleReorder = () => {
    if (!lastOrder || !lastOrder.items) return;
    addToCart(lastOrder.items);
    setReorderSuccess(true);
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
    setTimeout(() => setReorderSuccess(false), 3000);
  };

  // 2. Active dispatched order for Tracker
  const activeDispatchedOrder = orders.find(o => o.status === "Dispatched") || orders[0];

  // 3. Rails: New Arrivals & Fast Moving
  const newArrivals = MOCK_PRODUCTS.slice(0, 6);
  const fastMoving = MOCK_PRODUCTS.slice(6, 12).length > 0 ? MOCK_PRODUCTS.slice(6, 12) : MOCK_PRODUCTS.slice(0, 4);

  const storeName = user?.name || activeRetailer?.name || RETAILER_PROFILE.name;
  const proprietorName = activeRetailer?.ownerName || RETAILER_PROFILE.proprietor;

  return (
    <div className="w-full flex flex-col gap-5 pb-28 text-ink max-w-full overflow-x-hidden">
      {/* =========================================================================
          SECTION 1: GREETING + CREDIT / DUES STRIP (Tap opens Dues)
          ========================================================================= */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-ink-muted font-medium">
              {getRetailerString(language, "namasteGreeting")} {proprietorName}
            </span>
            <h1 className="text-lg sm:text-xl font-bold text-ink leading-tight truncate">
              {storeName}
            </h1>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-bold font-mono">
            {activeRetailer?.code || RETAILER_PROFILE.code}
          </span>
        </div>

        {/* Credit & Dues Strip (Thumb-friendly clickable card) */}
        <div
          onClick={() => setRetailerNav("account")}
          className="w-full bg-surface hover:bg-surface-raised rounded-2xl p-4 border border-border shadow-soft-sm transition-all duration-200 cursor-pointer active:scale-[0.99] flex flex-col gap-3 group"
          role="button"
          tabIndex={0}
          title="Open Dues & Ledger"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
              </span>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
                  {getRetailerString(language, "outstandingDues")}
                </span>
                <span className="font-mono text-base sm:text-lg font-bold text-ink num leading-none">
                  {formatINR(financials.totalOutstanding)}
                </span>
              </div>
            </div>

            {/* Overdue Pill or Available Headroom */}
            {financials.overdueAmount > 0 ? (
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-full bg-danger/10 text-danger text-[10px] font-bold border border-danger/20 font-mono">
                  {formatINR(financials.overdueAmount)} Overdue
                </span>
                <span className="text-[10px] text-ink-muted block mt-0.5">
                  Due {financials.nextDueDate}
                </span>
              </div>
            ) : (
              <div className="text-right">
                <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold font-mono">
                  Credit Available
                </span>
                <span className="text-[10px] font-mono text-ink-muted block mt-0.5 num">
                  {formatINR(financials.availableCredit)}
                </span>
              </div>
            )}
          </div>

          <div className="pt-2.5 border-t border-border/70 flex items-center justify-between text-xs font-semibold text-primary">
            <span className="text-[11px] text-ink-muted font-normal">
              Credit Limit: {formatINR(activeRetailer?.creditLimit || RETAILER_PROFILE.creditLimit)}
            </span>
            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              <span>{getRetailerString(language, "viewDuesDetails")}</span>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: REORDER LAST ORDER ONE-TAP CARD
          ========================================================================= */}
      {lastOrder && (
        <div className="w-full bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-4 border border-primary/20 shadow-soft-sm flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="material-symbols-outlined text-primary text-[18px]">replay</span>
              <span className="text-xs font-bold text-ink">
                {getRetailerString(language, "reorderTitle")}
              </span>
            </div>
            <p className="text-[11px] text-ink-muted truncate">
              {lastOrder.orderNumber} • {lastOrder.totalBoxes} {getRetailerString(language, "boxes")} • {lastOrder.transporter || "Navata Road Transport"}
            </p>
            <span className="font-mono text-xs font-bold text-primary num mt-0.5 block">
              {formatINR(lastOrder.grandTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReorder}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-soft-sm hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
            <span>{reorderSuccess ? "Added!" : getRetailerString(language, "reorderBtn")}</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          SECTION 3: BRAND ROW AS STORY-RING STYLE CIRCLES (~64px)
          ========================================================================= */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted font-mono">
            {getRetailerString(language, "browseBrands")}
          </h2>
          <button
            type="button"
            onClick={() => setRetailerNav("catalogue")}
            className="text-xs text-primary font-semibold hover:underline"
          >
            {getRetailerString(language, "viewAll")}
          </button>
        </div>

        {/* Horizontal scrollable story rings */}
        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1 px-0.5">
          {MOCK_BRANDS.map(brand => (
            <BrandStoryRing
              key={brand.id}
              brand={brand}
              onClick={() => setRetailerNav("catalogue")}
            />
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 4: CATEGORY CHIPS
          ========================================================================= */}
      <div className="flex flex-col gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-muted font-mono">
          {getRetailerString(language, "categoriesTitle")}
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORIES_CONFIG.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setRetailerNav("catalogue")}
              className="min-h-[40px] px-4 py-2 rounded-full bg-surface hover:bg-surface-raised border border-border text-xs font-bold text-ink whitespace-nowrap shadow-soft-xs hover:border-primary/40 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-primary">
                {cat === "Leggings" ? "straighten" : cat === "Petticoats" ? "styler" : cat === "Bras" ? "checkroom" : "dry_cleaning"}
              </span>
              <span>{cat}</span>
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: ORDER STATUS MINI-TRACKER WITH "TRACK LR"
          ========================================================================= */}
      {activeDispatchedOrder && (
        <div className="w-full bg-surface rounded-2xl p-4 border border-border shadow-soft-sm flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-bold text-ink font-mono uppercase tracking-wider">
                {getRetailerString(language, "orderStatusTitle")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsTrackLrModalOpen(prev => !prev)}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{getRetailerString(language, "trackLR")}</span>
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>

          <div className="bg-surface-raised rounded-xl p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-ink">{activeDispatchedOrder.orderNumber}</span>
              <span className="font-mono text-ink-muted">{activeDispatchedOrder.lrNumber || "NRT-77492-SDP"}</span>
            </div>

            {/* Visual 3-Stage Progress Bar */}
            <div className="w-full flex items-center gap-1.5">
              <div className="flex-1 h-1.5 rounded-full bg-success" />
              <div className="flex-1 h-1.5 rounded-full bg-success animate-pulse" />
              <div className="flex-1 h-1.5 rounded-full bg-border" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span className="text-success font-semibold">Dispatched (24 Oct)</span>
              <span className="text-primary font-bold">{getRetailerString(language, "inTransit")}</span>
              <span>Delivery (Tomorrow)</span>
            </div>
          </div>

          {/* Expanded LR Tracking Details */}
          {isTrackLrModalOpen && (
            <div className="p-3 rounded-xl bg-background border border-border text-xs flex flex-col gap-1.5 animate-in fade-in duration-150">
              <p className="font-semibold text-ink">Transporter: {activeDispatchedOrder.transporter || "Navata Road Transport"}</p>
              <p className="text-ink-muted">LR Consignment: <strong className="text-ink font-mono">{activeDispatchedOrder.lrNumber || "NRT-77492-SDP"}</strong></p>
              <p className="text-ink-muted">Origin Hub: Tiruppur Mill Hub → Destination: Siddipet Station</p>
              <p className="text-[11px] text-primary font-semibold mt-1">Helpline: 1800-425-0000</p>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 6: PRODUCT RAILS ("NEW ARRIVALS" & "FAST MOVING")
          ========================================================================= */}
      {/* Rail 1: New Arrivals */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[18px]">fiber_new</span>
            <h2 className="text-sm font-bold text-ink">
              {getRetailerString(language, "newArrivals")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setRetailerNav("catalogue")}
            className="text-xs text-primary font-semibold hover:underline"
          >
            {getRetailerString(language, "viewAll")}
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
          {newArrivals.map((product: Product) => (
            <div
              key={product.id}
              onClick={() => openMatrixModal(product)}
              className="w-40 sm:w-44 shrink-0 bg-surface rounded-2xl p-2.5 border border-border shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between cursor-pointer group active:scale-[0.98]"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-raised mb-2">
                <ProductRailImage product={product} />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-ink/75 text-surface text-[9px] font-bold uppercase font-mono">
                  {product.brand}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-ink-muted font-mono font-semibold block">
                  {product.artNumber}
                </span>
                <h3 className="text-xs font-bold text-ink line-clamp-1 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                <span className="text-[10px] text-ink-muted block mt-0.5">
                  Box of {product.piecesPerUnit || 12} pcs
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-ink font-mono num">
                    {product.pricePending ? "Price Pending" : formatINR(product.pricePerUnit)}
                  </span>
                  {!product.pricePending && product.piecesPerUnit > 0 && (
                    <span className="text-[9px] text-ink-muted font-mono block">
                      ₹{(product.pricePerUnit / product.piecesPerUnit).toFixed(1)}/pc
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMatrixModal(product);
                  }}
                  className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-soft-xs"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rail 2: Fast Moving Bestsellers */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-accent text-[18px]">local_fire_department</span>
            <h2 className="text-sm font-bold text-ink">
              {getRetailerString(language, "fastMoving")}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setRetailerNav("catalogue")}
            className="text-xs text-primary font-semibold hover:underline"
          >
            {getRetailerString(language, "viewAll")}
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
          {fastMoving.map((product: Product) => (
            <div
              key={product.id}
              onClick={() => openMatrixModal(product)}
              className="w-40 sm:w-44 shrink-0 bg-surface rounded-2xl p-2.5 border border-border shadow-soft-sm hover:shadow-soft-md transition-all flex flex-col justify-between cursor-pointer group active:scale-[0.98]"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-surface-raised mb-2">
                <ProductRailImage product={product} />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-accent text-white text-[9px] font-bold uppercase font-mono">
                  Bestseller
                </span>
              </div>

              <div>
                <span className="text-[10px] text-ink-muted font-mono font-semibold block">
                  {product.artNumber}
                </span>
                <h3 className="text-xs font-bold text-ink line-clamp-1 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                <span className="text-[10px] text-ink-muted block mt-0.5">
                  Box of {product.piecesPerUnit || 12} pcs
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-ink font-mono num">
                    {product.pricePending ? "Price Pending" : formatINR(product.pricePerUnit)}
                  </span>
                  {!product.pricePending && product.piecesPerUnit > 0 && (
                    <span className="text-[9px] text-ink-muted font-mono block">
                      ₹{(product.pricePerUnit / product.piecesPerUnit).toFixed(1)}/pc
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openMatrixModal(product);
                  }}
                  className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-soft-xs"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
