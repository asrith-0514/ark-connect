"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/mock/retailer";
import { getRetailerString } from "@/lib/i18n/retailer";

export function RetailerBottomNav() {
  const {
    retailerNav,
    setRetailerNav,
    cartTotalBoxes,
    cartTotalPieces,
    cartGrandTotal,
    setIsReviewOrderOpen,
  } = useApp();
  const { language } = useAuth();

  const navItems = [
    {
      id: "home",
      labelKey: "navHome" as const,
      icon: "storefront",
    },
    {
      id: "catalogue", // Shop
      labelKey: "navShop" as const,
      icon: "grid_view",
    },
    {
      id: "orders",
      labelKey: "navOrders" as const,
      icon: "receipt_long",
    },
    {
      id: "account", // Dues / Invoices & Balance
      labelKey: "navDues" as const,
      icon: "account_balance_wallet",
    },
    {
      id: "account-profile", // Account
      labelKey: "navAccount" as const,
      icon: "person",
    },
  ];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-3">
      {/* 1. Floating PO Dock Bar (Docks above bottom tab bar when items exist) */}
      {cartTotalBoxes > 0 && retailerNav !== "review-po" && (
        <div className="pointer-events-auto mb-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-full bg-ink text-surface rounded-2xl p-3 shadow-soft-xl border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 pl-1">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shrink-0 shadow-soft-sm">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-success tracking-wider">
                    {getRetailerString(language, "activePO")}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono font-bold text-sm text-surface num">
                    {formatINR(cartGrandTotal)}
                  </span>
                  <span className="text-[11px] text-surface/70 font-mono num">
                    ({cartTotalBoxes} {getRetailerString(language, "boxes")} • {cartTotalPieces} {getRetailerString(language, "pieces")})
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewOrderOpen(true)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-soft-sm flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 transition-transform"
            >
              <span>{getRetailerString(language, "reviewPO")}</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Floating Bottom Tab Bar: 5 Tabs (48px tap targets, thumb-zone friendly) */}
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto w-full bg-surface/95 backdrop-blur-md text-ink rounded-full p-1.5 border border-border shadow-soft-lg flex items-center justify-around select-none"
      >
        {navItems.map((item) => {
          const isActive =
            retailerNav === item.id ||
            (item.id === "catalogue" && retailerNav === "shop") ||
            (item.id === "account" && retailerNav === "dues");

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setRetailerNav(item.id)}
              className={`flex-1 min-h-[48px] min-w-[48px] py-1 px-1 rounded-full flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                isActive
                  ? "text-primary font-bold bg-primary/10"
                  : "text-ink-muted hover:text-ink active:scale-95"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[22px] transition-transform ${
                  isActive ? "scale-110" : ""
                }`}
              >
                {item.icon}
              </span>
              <span className="text-[10px] tracking-tight truncate font-sans mt-0.5 leading-none">
                {getRetailerString(language, item.labelKey)}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
