"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { MOCK_BRANDS } from "@/data/mockData";
import {
  RETAILER_PROFILE,
  SHARED_PRODUCT_CATEGORIES,
  formatINR,
  getOrderingCycle,
  getRetailerFinancials,
  getRetailerOrderMetrics,
} from "@/lib/mock/retailer";
import CreditMeter from "@/components/retailer/CreditMeter";

function getBrandGradient(brandId: string): string {
  switch (brandId) {
    case "flybirds":
      return "from-[#002d80] via-[#0047d3] to-[#1e3a8a]";
    case "flycute":
      return "from-[#004d61] via-[#007a8c] to-[#0f4c5c]";
    case "within":
      return "from-[#1e293b] via-[#334155] to-[#0f172a]";
    case "sleepy-panda":
      return "from-[#004d34] via-[#007e56] to-[#003822]";
    case "aswathi":
      return "from-[#78350f] via-[#b45309] to-[#451a03]";
    case "exena":
      return "from-[#1e3a8a] via-[#2563eb] to-[#1e1b4b]";
    case "lichi":
      return "from-[#831843] via-[#be185d] to-[#500724]";
    case "fine-touch":
      return "from-[#4c1d95] via-[#6d28d9] to-[#2e1065]";
    case "little-angel":
      return "from-[#9a3412] via-[#c2410c] to-[#431407]";
    default:
      return "from-slate-800 via-slate-700 to-slate-900";
  }
}

export function RetailerHome() {
  const {
    setRetailerNav,
    setIsReviewOrderOpen,
    setOrderTabFilter,
    cartGrandTotal,
    cartTotalBoxes,
    cartTotalPieces,
    orders,
    currentDate,
  } = useApp();
  const [selectedCategory, setSelectedCategory] = useState("All");

  const financials = getRetailerFinancials(undefined, undefined, currentDate);
  const orderMetrics = getRetailerOrderMetrics(orders);
  const orderingCycle = getOrderingCycle(currentDate);

  const categories = SHARED_PRODUCT_CATEGORIES;

  const filteredBrands = MOCK_BRANDS.filter(brand => {
    if (selectedCategory === "All" || selectedCategory.startsWith("All")) return true;
    if (selectedCategory === "Men's Innerwear") return ["Flybirds", "Within", "Maxwell"].includes(brand.name);
    if (selectedCategory === "Women's Intimates") return ["Within", "Lichi Intimates"].includes(brand.name);
    if (selectedCategory === "Kids Wear") return ["Flycute", "Sleepy Panda", "Little Star"].includes(brand.name);
    if (selectedCategory === "Loungewear") return ["Sleepy Panda", "Within"].includes(brand.name);
    if (selectedCategory === "Traditional Wear") return ["Aswathi"].includes(brand.name);
    if (selectedCategory === "Winter Thermals") return ["Exena"].includes(brand.name);
    return true;
  });

  // Requirement 4: Show only 6 featured brands on Home
  const featuredBrands = filteredBrands.slice(0, 6);

  return (
    <div className="w-full flex flex-col gap-6 pb-24">
      {/* Marquee Banner */}
      <div className="bg-surface-container-lowest border-y sm:border border-surface-container py-2.5 px-3 sm:px-4 rounded-none sm:rounded-2xl flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 shadow-2xs overflow-hidden">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          <span className="font-label-sm text-label-sm font-bold text-on-surface uppercase tracking-wider truncate">
            {RETAILER_PROFILE.hubNotice}
          </span>
          <span className="font-body-sm text-outline hidden md:inline">
            Same-day dispatch cut-off: 17:30 IST
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 xs:pl-3 xs:border-l border-surface-container text-xs">
          <span className="font-label-sm text-on-surface-variant hidden xs:inline">Central Hub Status:</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-label-sm font-semibold">
            All 9 Mill Lines Online
          </span>
        </div>
      </div>

      {/* Top Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bento 1: Retailer Greeting & Fast Action (Col 1-6) */}
        <div className="lg:col-span-6 bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm flex flex-col justify-between relative overflow-hidden group border border-surface-container/50">
          <div className="absolute right-0 bottom-0 w-44 h-44 rounded-full bg-gradient-to-br from-primary-fixed/20 via-primary/5 to-transparent pointer-events-none"></div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
              <span suppressHydrationWarning className="font-label-sm text-label-sm text-primary uppercase font-bold tracking-wider">
                {orderingCycle.cycleName}
              </span>
              <span className="font-numeric-table text-numeric-table px-2.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-medium text-[11px]">
                GST: {RETAILER_PROFILE.gstin}
              </span>
            </div>

            <h1 className="font-headline-lg text-xl sm:text-2xl text-on-surface font-bold tracking-tight">
              {RETAILER_PROFILE.greeting}
            </h1>
            <p className="font-body-md text-xs sm:text-sm text-on-surface-variant mt-0.5">
              {RETAILER_PROFILE.name}, {RETAILER_PROFILE.town} • Preferred Stockist
            </p>

            {/* Tracking badge banner */}
            <div className="mt-3 flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container-low max-w-full border border-surface-container text-xs">
              <span className="material-symbols-outlined text-tertiary text-[18px]">local_shipping</span>
              <div className="flex flex-wrap items-center gap-1.5 font-body-sm text-on-surface-variant">
                <span>Last PO</span>
                <span className="font-numeric-table font-bold text-on-surface">
                  #{orderMetrics.activeDispatchedOrder?.orderNumber || "ARK-8841"}
                </span>
                <span>is</span>
                <span className="font-label-sm px-2 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-bold uppercase text-[10px]">
                  {orderMetrics.activeDispatchedOrder?.status || "Dispatched"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOrderTabFilter("dispatched");
                  setRetailerNav("orders");
                }}
                className="font-label-sm text-primary font-semibold hover:underline ml-auto cursor-pointer text-xs"
              >
                Track LR →
              </button>
            </div>
          </div>

          {/* Requirement 2: Neutral verified badge */}
          <div className="mt-5 pt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-surface-container/50">
            <div className="flex items-center gap-2 text-outline">
              <span className="material-symbols-outlined text-[18px] text-tertiary">verified</span>
              <span className="font-body-sm text-xs sm:text-sm text-on-surface-variant font-semibold">
                GSTIN Verified · Authorized Retailer
              </span>
            </div>

            <button
              type="button"
              onClick={() => setRetailerNav("catalogue")}
              className="min-h-[44px] h-11 px-5 rounded-xl bg-primary text-on-primary font-label-md text-xs sm:text-sm font-semibold hover:bg-primary/95 shadow-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>Start New Order</span>
            </button>
          </div>
        </div>

        {/* Bento 2: Order Status Summary Widget (Col 7-9) */}
        {/* Requirement 2: Counts match My Orders list, 4 tiles with Delivered, each clickable */}
        <div className="lg:col-span-3 bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex flex-col justify-between border border-surface-container/50">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-title-sm text-title-sm text-on-surface font-bold">
                Order Matrix
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Active 30 Days</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 pt-1">
              {/* Tile 1: Draft PO */}
              <div
                onClick={() => {
                  setOrderTabFilter("draft");
                  setRetailerNav("orders");
                }}
                className="p-2.5 rounded-xl bg-surface-container-low hover:bg-slate-200/80 text-center flex flex-col justify-center cursor-pointer transition-all hover:scale-[1.02] border border-transparent hover:border-slate-300"
                title="View Draft Orders in My Orders"
              >
                <span className="font-numeric-currency-lg text-headline-md text-on-surface font-bold">
                  {orderMetrics.draftCount}
                </span>
                <span className="font-label-sm text-on-surface-variant mt-0.5">Draft PO</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mx-auto mt-1"></span>
              </div>

              {/* Tile 2: In Review */}
              <div
                onClick={() => {
                  setOrderTabFilter("in-review");
                  setRetailerNav("orders");
                }}
                className="p-2.5 rounded-xl bg-secondary-container/40 hover:bg-secondary-container/70 text-center flex flex-col justify-center cursor-pointer transition-all hover:scale-[1.02] border border-transparent hover:border-blue-300"
                title="View In-Review Orders"
              >
                <span className="font-numeric-currency-lg text-headline-md text-on-surface font-bold">
                  {orderMetrics.inReviewCount}
                </span>
                <span className="font-label-sm text-on-secondary-container mt-0.5">In Review</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1"></span>
              </div>

              {/* Tile 3: Dispatched */}
              <div
                onClick={() => {
                  setOrderTabFilter("dispatched");
                  setRetailerNav("orders");
                }}
                className="p-2.5 rounded-xl bg-tertiary-container/15 hover:bg-tertiary-container/30 text-center flex flex-col justify-center cursor-pointer transition-all hover:scale-[1.02] border border-transparent hover:border-emerald-300"
                title="View Dispatched Orders"
              >
                <span className="font-numeric-currency-lg text-headline-md text-tertiary font-bold">
                  {orderMetrics.dispatchedCount}
                </span>
                <span className="font-label-sm text-tertiary mt-0.5 font-semibold">Dispatched</span>
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary mx-auto mt-1"></span>
              </div>

              {/* Tile 4: Delivered (Requirement 2) */}
              <div
                onClick={() => {
                  setOrderTabFilter("delivered");
                  setRetailerNav("orders");
                }}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-center flex flex-col justify-center cursor-pointer transition-all hover:scale-[1.02] border border-transparent hover:border-emerald-300"
                title="View Delivered Orders"
              >
                <span className="font-numeric-currency-lg text-headline-md text-emerald-800 font-bold">
                  {orderMetrics.deliveredCount}
                </span>
                <span className="font-label-sm text-emerald-700 mt-0.5 font-semibold">Delivered</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mx-auto mt-1"></span>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-surface-container-low p-3 rounded-xl border border-surface-container">
            <div className="flex items-center justify-between">
              <span className="font-body-sm text-on-surface-variant">
                {orderMetrics.dispatchedTransporter} LR #
              </span>
              <span className="font-numeric-table font-bold text-on-surface">
                {orderMetrics.dispatchedLR}
              </span>
            </div>
            <p className="font-body-sm text-outline mt-0.5">Est. Arrival: Tomorrow, 11:00 AM</p>
          </div>
        </div>

        {/* Bento 3: Outstanding Balance & Shared Credit Meter (Col 10-12) */}
        {/* Requirement 1: Overdue row first, next due row with computed days, shared credit-meter */}
        <div className="lg:col-span-3 bg-surface-container-lowest p-5 rounded-2xl shadow-sm flex flex-col justify-between border border-surface-container/50">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-title-sm text-title-sm text-on-surface font-bold">Wholesale Credit</span>
              <span suppressHydrationWarning className="font-label-sm text-label-sm px-2 py-0.5 rounded bg-error-container text-on-error-container font-semibold">
                {financials.nextDueBadge}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="font-numeric-currency-lg text-headline-md text-on-surface font-bold">
                {formatINR(financials.totalOutstanding)}
              </span>
              <span className="font-body-sm text-on-surface-variant">Total Due</span>
            </div>

            {/* Overdue alert row first */}
            {financials.overdueAmount > 0 && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <div className="flex items-center gap-1.5 font-bold">
                  <span className="material-symbols-outlined text-[15px] text-rose-600">error</span>
                  <span>{formatINR(financials.overdueAmount)} overdue</span>
                  <span className="font-normal text-rose-500">· {financials.overdueInvoices[0]?.invoiceNumber || "INV-0079"}</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-200/60 text-rose-800 uppercase font-mono">
                  Overdue
                </span>
              </div>
            )}

            {/* Next due row (computed days) */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-[15px] text-[#0047d3]">event_upcoming</span>
                <span suppressHydrationWarning>Next due {formatINR(financials.nextDueAmount)}</span>
                <span suppressHydrationWarning className="font-normal text-blue-700">
                  · in {financials.nextDueDays > 0 ? `${financials.nextDueDays} day${financials.nextDueDays === 1 ? "" : "s"}` : "1 day"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-blue-700 font-bold uppercase">
                {financials.nextDueInvoiceNumber}
              </span>
            </div>
          </div>

          {/* Shared credit-meter component (matches Invoices & Balance exactly) */}
          <CreditMeter
            compact
            totalOutstanding={financials.totalOutstanding}
            availableCredit={financials.availableCredit}
            creditLimit={financials.creditLimit}
            usedCreditPercent={financials.usedCreditPercent}
            availableCreditPercent={financials.availableCreditPercent}
            className="mt-3"
          />
        </div>
      </div>

      {/* Active Purchase Order Draft */}
      <div className="w-full bg-surface-container-lowest rounded-2xl p-5 md:p-6 shadow-sm border border-surface-container">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">shopping_cart_checkout</span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-label-sm text-label-sm uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {cartTotalBoxes > 0 ? "Active PO Draft" : "PO Draft Ready"}
                </span>
                <span className="font-title-sm text-title-sm text-on-surface font-bold">
                  PO #ARK-8902
                </span>
                <span className="font-body-sm text-outline">• Linked with Active PO Header Chip</span>
              </div>

              {cartTotalBoxes > 0 ? (
                <>
                  <p className="font-body-md text-on-surface-variant mt-1">
                    Items selected in current wholesale order ready for verification and dispatch allocation.
                  </p>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-body-sm">
                      <span className="material-symbols-outlined text-outline text-[18px]">inventory_2</span>
                      <span className="font-numeric-table text-on-surface font-medium">
                        {cartTotalBoxes} Master Boxes ({cartTotalPieces} pcs)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-outline text-[18px]">payments</span>
                      <span className="font-numeric-currency-md font-bold text-on-surface">
                        {formatINR(cartGrandTotal)}
                      </span>
                      <span className="font-body-sm text-outline">(Incl. 5% GST)</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <p className="font-body-md text-on-surface-variant mt-1">
                    No items in active draft yet. Select sizes and box quantities from the wholesale catalogue to build your purchase order.
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
            {cartTotalBoxes > 0 ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsReviewOrderOpen(true)}
                  className="h-10 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md font-semibold transition-colors flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">edit_note</span>
                  Review PO
                </button>
                <button
                  type="button"
                  onClick={() => setIsReviewOrderOpen(true)}
                  className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-label-md font-semibold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">send_and_archive</span>
                  Submit Order ({formatINR(cartGrandTotal)})
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setRetailerNav("catalogue")}
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/95 text-on-primary font-label-md font-semibold shadow-sm transition-transform active:scale-95 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">storefront</span>
                Browse Catalogue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 6 Featured Wholesale Brands Grid (Requirement 4) */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
          <div>
            <span className="font-label-sm text-primary uppercase font-bold tracking-wider">
              Brands {RETAILER_PROFILE.sourceOrigin}
            </span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
              Featured Wholesale Brands
            </h2>
          </div>

          {/* View all 9 brands link & Filter Pills (Requirement 4) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setRetailerNav("catalogue")}
              className="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/95 text-on-primary text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
            >
              <span>View all 9 brands</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <div className="flex items-center gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full font-label-sm font-semibold transition-colors ${
                    selectedCategory === cat || (cat.startsWith("All") && selectedCategory.startsWith("All"))
                      ? "bg-on-surface text-surface"
                      : "bg-surface-container hover:bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Brand Bento Cards (Requirement 5: equal height, nowrap badges, truncated category, and Requirement 6: gradient brand-tinted tiles) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
          {featuredBrands.map(brand => (
            <div
              key={brand.id}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group relative overflow-hidden border border-surface-container h-full"
            >
              <div className="h-1.5 w-full bg-primary absolute top-0 left-0"></div>

              <div className="flex flex-col flex-1 justify-between">
                <div>
                  {/* Brand Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-headline-md font-bold text-primary shrink-0">
                        {brand.shortCode}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-headline-md text-title-sm text-on-surface font-bold truncate">
                          {brand.name}
                        </h3>
                        {/* Requirement 5: Truncate category tag to one line */}
                        <span className="font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium truncate block max-w-full" title={brand.tagline}>
                          {brand.tagline}
                        </span>
                      </div>
                    </div>
                    {/* Requirement 5: whitespace-nowrap on stock/dispatch badges */}
                    <span className="font-label-sm px-2.5 py-0.5 rounded-full bg-tertiary-container/15 text-tertiary font-bold whitespace-nowrap shrink-0">
                      {brand.stockPercentage}
                    </span>
                  </div>

                  {/* Requirement 6: Brand-tinted gradient tile with brand initials */}
                  <div className={`my-3 w-full h-36 rounded-xl overflow-hidden relative bg-gradient-to-br ${getBrandGradient(brand.id)} flex flex-col justify-between p-3.5 shadow-inner border border-white/10 group-hover:scale-[1.01] transition-transform select-none`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest text-white/70 uppercase font-mono">
                        Tiruppur Mill Sourced
                      </span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>

                    <div className="flex flex-col items-center justify-center my-auto">
                      <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-headline-md drop-shadow-sm">
                        {brand.shortCode}
                      </span>
                      <span className="text-[11px] font-bold tracking-wider uppercase text-white/90 mt-0.5">
                        {brand.name}
                      </span>
                    </div>

                    <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 flex items-center justify-between">
                      <span className="text-[10px] text-white/95 font-medium truncate">
                        {brand.badge}
                      </span>
                      <span className="text-[9px] text-emerald-300 font-mono font-bold shrink-0 ml-1.5">
                        Ready in Hub
                      </span>
                    </div>
                  </div>

                  <p className="font-body-sm text-on-surface-variant line-clamp-2">
                    {brand.description}
                  </p>
                </div>

                <div className="pt-3 mt-3 flex items-center justify-between border-t border-surface-container/60">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-outline">Min. Order Pack</span>
                    <span className="font-numeric-table font-bold text-on-surface">{brand.minOrder}</span>
                  </div>

                  <button
                    onClick={() => setRetailerNav("catalogue")}
                    className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface font-label-md font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Browse Catalogue</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom link to view full catalogue */}
        <div className="flex items-center justify-center pt-2">
          <button
            type="button"
            onClick={() => setRetailerNav("catalogue")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs sm:text-sm transition-all border border-surface-container-high shadow-2xs"
          >
            <span>Explore all 9 brands in full catalogue</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}

