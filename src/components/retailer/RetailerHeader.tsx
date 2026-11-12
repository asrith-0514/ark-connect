"use client";

import React, { useRef, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { RETAILER_PROFILE, formatINR } from "@/lib/mock/retailer";

export function RetailerHeader() {
  const {
    retailerNav,
    setRetailerNav,
    cartGrandTotal,
    setIsReviewOrderOpen,
    setIsSearchOpen,
  } = useApp();

  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      const wrapper = document.getElementById("retailer-sticky-header-wrapper");
      const target = wrapper || headerRef.current;
      if (target) {
        const height = target.offsetHeight;
        if (height > 0) {
          document.documentElement.style.setProperty("--retailer-header-height", `${height}px`);
        }
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    const target = document.getElementById("retailer-sticky-header-wrapper") || headerRef.current;
    let ro: ResizeObserver | null = null;
    if (target && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateHeight);
      ro.observe(target);
    }

    return () => {
      window.removeEventListener("resize", updateHeight);
      if (ro) ro.disconnect();
    };
  }, []);

  return (
    <>
      {/* Top Header */}
      <header ref={headerRef} className="w-full bg-white border-b border-slate-200 shadow-xs">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 flex flex-col justify-between py-1.5 sm:py-2">
          {/* Main Top Row (Collapsed on mobile to Logo + Search Icon + PO Chip + Avatar) */}
          <div className="flex items-center justify-between gap-1.5 sm:gap-4 h-13 sm:h-14 min-w-0">
            {/* Logo */}
            <button
              type="button"
              className="flex items-center gap-1.5 sm:gap-3 cursor-pointer select-none min-h-[44px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl shrink-0"
              onClick={() => setRetailerNav("home")}
              aria-label="Go to Home"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold text-sm sm:text-base tracking-tight shadow-sm shrink-0">
                A
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs sm:text-base text-slate-900 leading-tight tracking-tight whitespace-nowrap">
                  ARK Connect
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium hidden xs:inline whitespace-nowrap">
                  B2B Portal
                </span>
              </div>
            </button>

            {/* Desktop Search Box (⌘K trigger) */}
            <div className="flex-1 max-w-xl mx-4 hidden md:block">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search catalogue and SKU (Press Command-K)"
                className="relative flex items-center justify-between w-full h-10 px-3.5 bg-slate-100 hover:bg-slate-200/80 rounded-xl cursor-pointer transition-colors border border-slate-200/60 focus-visible:ring-2 focus-visible:ring-[#0047d3] focus-visible:outline-none"
              >
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                  <span className="text-xs sm:text-sm text-slate-500">
                    Search innerwear, brands, SKU (e.g. FB-104), style codes...
                  </span>
                </div>
                <kbd className="hidden lg:inline-flex items-center px-2 py-0.5 rounded bg-white text-slate-500 font-mono text-[11px] border border-slate-200 shadow-2xs font-semibold">
                  ⌘K
                </kbd>
              </button>
            </div>

            {/* Right cluster: Mobile Search Icon + Active PO Chip + Avatar */}
            <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
              {/* Mobile Search Icon Button (min 44px tap target) */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-10 h-10 min-h-[44px] flex md:hidden items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-colors focus-visible:ring-2 focus-visible:ring-[#0047d3] cursor-pointer shrink-0"
                aria-label="Open search catalogue"
                title="Search Catalogue (⌘K)"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>

              {/* Active PO Button (min 44px tap target) */}
              <button
                type="button"
                onClick={() => setIsReviewOrderOpen(true)}
                className="min-h-[44px] h-10 sm:h-11 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors focus-visible:ring-2 focus-visible:ring-[#0047d3] cursor-pointer shrink-0"
                aria-label={`View Active Purchase Order: ${formatINR(cartGrandTotal)}`}
              >
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-[9px] sm:text-[10px] text-emerald-800 uppercase font-bold tracking-tight">
                      PO
                    </span>
                  </div>
                  <span className="font-mono text-[11px] sm:text-sm text-slate-900 font-bold leading-none">
                    {formatINR(cartGrandTotal)}
                  </span>
                </div>
                <div className="h-6 w-px bg-slate-300 hidden sm:block" />
                <span className="text-xs text-primary font-semibold hidden sm:flex items-center gap-0.5">
                  <span>Review</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </button>

              {/* Retailer Profile Avatar Button (min 44px tap target) */}
              <button
                type="button"
                onClick={() => setRetailerNav("account-profile")}
                className="w-10 h-10 min-h-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-all select-none cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-[#0047d3]"
                title="View My Account Profile"
                aria-label="View My Account Profile"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-xs font-bold text-xs">
                  <span className="material-symbols-outlined text-[16px] sm:text-[18px]">person</span>
                </div>
              </button>
            </div>
          </div>

          {/* Sub Navigation Bar (Hidden on mobile (< md), replaced by bottom tab bar) */}
          <div className="hidden md:flex items-center justify-between border-t border-slate-200/80 pt-1.5 mt-1">
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5" aria-label="Desktop Navigation">
              <button
                type="button"
                onClick={() => setRetailerNav("home")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  retailerNav === "home"
                    ? "bg-primary-container text-on-primary-container shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => setRetailerNav("catalogue")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  retailerNav === "catalogue"
                    ? "bg-primary-container text-on-primary-container shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Brands & Catalogue
              </button>
              <button
                type="button"
                onClick={() => setRetailerNav("orders")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  retailerNav === "orders"
                    ? "bg-primary-container text-on-primary-container shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                My Orders
              </button>
              <button
                type="button"
                onClick={() => setRetailerNav("account")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  retailerNav === "account"
                    ? "bg-primary-container text-on-primary-container shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Invoices & Balance
              </button>
              <button
                type="button"
                onClick={() => setRetailerNav("account-profile")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  retailerNav === "account-profile"
                    ? "bg-primary-container text-on-primary-container shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                My Account
              </button>
            </nav>

            <div className="flex items-center gap-1.5 text-slate-600 text-xs">
              <span>Credit Limit:</span>
              <span className="font-mono text-emerald-700 font-bold">
                {formatINR(RETAILER_PROFILE.creditLimit)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation Bar (5 tabs: Home, Catalogue, Orders, Invoices, Account) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-1 py-1 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Tab 1: Home */}
          <button
            type="button"
            onClick={() => setRetailerNav("home")}
            className={`min-h-[44px] h-13 flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none cursor-pointer rounded-xl ${
              retailerNav === "home"
                ? "text-primary font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-current={retailerNav === "home" ? "page" : undefined}
          >
            <span className="material-symbols-outlined text-[22px]">home</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
          </button>

          {/* Tab 2: Catalogue */}
          <button
            type="button"
            onClick={() => setRetailerNav("catalogue")}
            className={`min-h-[44px] h-13 flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none cursor-pointer rounded-xl ${
              retailerNav === "catalogue"
                ? "text-primary font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-current={retailerNav === "catalogue" ? "page" : undefined}
          >
            <span className="material-symbols-outlined text-[22px]">grid_view</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Catalogue</span>
          </button>

          {/* Tab 3: Orders */}
          <button
            type="button"
            onClick={() => setRetailerNav("orders")}
            className={`min-h-[44px] h-13 flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none cursor-pointer rounded-xl ${
              retailerNav === "orders"
                ? "text-primary font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-current={retailerNav === "orders" ? "page" : undefined}
          >
            <span className="material-symbols-outlined text-[22px]">receipt_long</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Orders</span>
          </button>

          {/* Tab 4: Invoices */}
          <button
            type="button"
            onClick={() => setRetailerNav("account")}
            className={`min-h-[44px] h-13 flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none cursor-pointer rounded-xl ${
              retailerNav === "account"
                ? "text-primary font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-current={retailerNav === "account" ? "page" : undefined}
          >
            <span className="material-symbols-outlined text-[22px]">receipt</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Invoices</span>
          </button>

          {/* Tab 5: Account */}
          <button
            type="button"
            onClick={() => setRetailerNav("account-profile")}
            className={`min-h-[44px] h-13 flex-1 flex flex-col items-center justify-center py-1 transition-colors select-none cursor-pointer rounded-xl ${
              retailerNav === "account-profile"
                ? "text-primary font-bold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            aria-current={retailerNav === "account-profile" ? "page" : undefined}
          >
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Account</span>
          </button>
        </div>
      </nav>
    </>
  );
}
