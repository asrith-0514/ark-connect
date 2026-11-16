"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { MOCK_BRANDS, MOCK_PRODUCTS, Product, Order } from "@/data/mockData";
import {
  RETAILER_PROFILE,
  formatINR,
  getRetailerFinancials,
} from "@/lib/mock/retailer";
import { getRetailerString } from "@/lib/i18n/retailer";
import confetti from "canvas-confetti";
import { ProductTile, BrandMonogramCircle } from "./ProductTile";

export function RetailerHome() {
  const {
    setRetailerNav,
    openMatrixModal,
    addToCart,
    orders,
    currentDate,
    activeRetailer,
  } = useApp();
  const { language, user } = useAuth();

  const [reorderSuccess, setReorderSuccess] = useState(false);

  const financials = getRetailerFinancials(undefined, undefined, currentDate);

  const activeRetailerId = user?.type === "retailer" ? (user.retailerId || "ret-1") : "ret-1";
  const activeRetailerCode = user?.type === "retailer" ? (user.retailerCode || "RET-0001") : "RET-0001";

  const retailerOrders = useMemo(() => {
    return orders.filter(
      (o: Order) =>
        (o.retailerId === activeRetailerId || o.retailerId === activeRetailerCode) &&
        !o.orderNumber.startsWith("ARK-H")
    );
  }, [orders, activeRetailerId, activeRetailerCode]);

  // Last order for "Reorder" card
  const lastOrder =
    retailerOrders.find((o: Order) => o.status === "Dispatched" || o.status === "Delivered") ||
    retailerOrders[0];

  const handleReorder = () => {
    if (!lastOrder || !lastOrder.items) return;
    addToCart(lastOrder.items);
    setReorderSuccess(true);
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // ignore
    }
    setTimeout(() => setReorderSuccess(false), 3000);
  };

  // Active dispatched order for top chip
  const activeDispatchedOrder = retailerOrders.find((o: Order) => o.status === "Dispatched");

  // Single fast-moving rail (products with priced status)
  const fastMovingProducts = useMemo(() => {
    const priced = MOCK_PRODUCTS.filter((p: Product) => !p.pricePending);
    return priced.length >= 4 ? priced.slice(0, 8) : MOCK_PRODUCTS.slice(0, 8);
  }, []);

  const storeName = user?.name || activeRetailer?.name || RETAILER_PROFILE.name;
  const proprietorName = activeRetailer?.ownerName || RETAILER_PROFILE.proprietor;

  return (
    <div className="w-full flex flex-col gap-4 pb-28 text-ink max-w-full overflow-x-hidden">
      {/* =========================================================================
          BLOCK A: DUES STRIP + DISPATCH CHIP
          "Outstanding Rs X, overdue Rs Y" with a Pay or View button
          Small "1 order on the way" chip when dispatched order exists
          ========================================================================= */}
      <div className="w-full rounded-2xl bg-surface border border-border p-4 sm:p-5 shadow-soft-sm flex flex-col gap-3">
        {/* Header Greeting & Dispatched Order Chip */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="text-xs text-ink-muted">
              {getRetailerString(language, "namasteGreeting")} {proprietorName}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-ink truncate leading-tight">
              {storeName}
            </h1>
          </div>

          {/* Small "1 order on the way" chip */}
          {activeDispatchedOrder ? (
            <button
              type="button"
              onClick={() => setRetailerNav("orders")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/15 transition-colors cursor-pointer shrink-0"
              title="View order in Orders tab"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>1 order on the way</span>
              <Icon name="arrow_forward" size={14} />
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-surface-raised border border-border text-[11px] font-mono text-ink-muted shrink-0">
              {activeRetailer?.code || RETAILER_PROFILE.code}
            </span>
          )}
        </div>

        {/* Dues Summary Strip */}
        <div className="w-full rounded-xl bg-background border border-border p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-ink-muted">Account balance</span>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-bold font-mono text-ink num">
                Outstanding {formatINR(financials.totalOutstanding)}
              </span>
              {financials.overdueAmount > 0 && (
                <span className="text-xs font-bold font-mono text-danger num bg-danger/10 px-2 py-0.5 rounded-full border border-danger/25">
                  overdue {formatINR(financials.overdueAmount)}
                </span>
              )}
            </div>
            {financials.overdueAmount === 0 && (
              <span className="text-xs text-success font-medium">
                All invoices up to date • {formatINR(financials.availableCredit)} available credit
              </span>
            )}
          </div>

          {/* 48px Pay / View Button */}
          <button
            type="button"
            onClick={() => setRetailerNav("account")}
            className={`min-h-[48px] h-12 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-soft-xs active:scale-[0.98] ${
              financials.overdueAmount > 0
                ? "bg-danger text-white hover:bg-danger/90"
                : "bg-primary text-white hover:bg-primary/90"
            }`}
          >
            <Icon name={financials.overdueAmount > 0 ? "payments" : "receipt_long"} size={18} />
            <span>{financials.overdueAmount > 0 ? "Pay now" : "View dues"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          BLOCK B: REORDER LAST ORDER
          Card with details and 48px Reorder button
          ========================================================================= */}
      {lastOrder && (
        <div className="w-full rounded-2xl bg-surface border border-border p-4 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon name="replay" size={16} />
              </span>
              <span className="text-sm font-bold text-ink">Reorder last order</span>
            </div>
            <p className="text-xs text-ink-muted truncate">
              {lastOrder.orderNumber} • {lastOrder.totalBoxes} {getRetailerString(language, "boxes")} • {lastOrder.transporter || "Navata Road Transport"}
            </p>
            <span className="font-mono text-sm font-bold text-primary num mt-0.5 block">
              {formatINR(lastOrder.grandTotal)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReorder}
            className="min-h-[48px] h-12 px-6 rounded-xl bg-primary text-white font-bold text-sm shadow-soft-xs hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Icon name={reorderSuccess ? "check" : "add_shopping_cart"} size={18} />
            <span>{reorderSuccess ? "Added to order" : "Reorder"}</span>
          </button>
        </div>
      )}

      {/* =========================================================================
          BLOCK C: BRAND CIRCLES
          Monogram circles for the 7 canonical brands
          ========================================================================= */}
      <div className="w-full rounded-2xl bg-surface border border-border p-4 shadow-soft-sm flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Brands</h2>
          <button
            type="button"
            onClick={() => setRetailerNav("catalogue")}
            className="text-xs text-primary font-semibold hover:underline"
          >
            View all
          </button>
        </div>

        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1 px-0.5">
          {MOCK_BRANDS.map(brand => (
            <BrandMonogramCircle
              key={brand.id}
              brandName={brand.name}
              size={56}
              onClick={() => setRetailerNav("catalogue")}
            />
          ))}
        </div>
      </div>

      {/* =========================================================================
          BLOCK D: ONE PRODUCT RAIL "FAST MOVING"
          Single rail with category-branded ProductTile
          ========================================================================= */}
      <div className="w-full rounded-2xl bg-surface border border-border p-4 shadow-soft-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Icon name="trending_up" size={16} />
            </span>
            <h2 className="text-sm font-bold text-ink">Fast moving</h2>
          </div>
          <button
            type="button"
            onClick={() => setRetailerNav("catalogue")}
            className="text-xs text-primary font-semibold hover:underline"
          >
            View shop
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
          {fastMovingProducts.map((product: Product) => (
            <div
              key={product.id}
              onClick={() => openMatrixModal(product)}
              className="w-40 sm:w-44 shrink-0 rounded-xl p-2.5 bg-background border border-border shadow-soft-xs hover:border-primary/40 transition-all flex flex-col justify-between cursor-pointer group active:scale-[0.98]"
            >
              <ProductTile
                productId={product.id}
                brand={product.brand}
                category={product.category}
                title={product.title}
                pcsPerBox={product.piecesPerUnit}
                aspectRatio="aspect-square"
              />

              <div className="mt-2.5 flex flex-col gap-1">
                <span className="text-xs font-bold text-ink line-clamp-1 group-hover:text-primary transition-colors">
                  {product.title}
                </span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-mono font-bold text-ink num">
                    {formatINR(product.pricePerUnit)}
                  </span>
                  <span className="text-[10px] text-ink-muted">
                    Box of {product.piecesPerUnit}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openMatrixModal(product);
                }}
                className="mt-2.5 w-full min-h-[40px] h-10 rounded-lg bg-surface border border-border text-xs font-semibold text-ink group-hover:border-primary group-hover:text-primary transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Icon name="add" size={16} />
                <span>Order sizes</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
