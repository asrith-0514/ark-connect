"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { formatINR } from "@/lib/mock/retailer";
import { getRetailerString } from "@/lib/i18n/retailer";
import { Icon } from "@/components/ui/Icon";

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

  const isHomeOrShop = retailerNav === "home" || retailerNav === "catalogue" || retailerNav === "shop";

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-3">
      {/* 1. Floating PO Draft Bar: Slim single-line pill (48px high) strictly on Home & Shop only */}
      {cartTotalBoxes > 0 && isHomeOrShop && (
        <div className="pointer-events-auto mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <button
            type="button"
            onClick={() => setIsReviewOrderOpen(true)}
            className="w-full h-12 min-h-[48px] bg-primary hover:bg-primary-hover text-white rounded-full px-4 shadow-soft-lg flex items-center justify-between cursor-pointer active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span className="text-xs font-semibold truncate">
                {cartTotalBoxes} {cartTotalBoxes === 1 ? "box" : "boxes"}
              </span>
              <span className="text-white/40">•</span>
              <span className="font-mono font-bold text-xs num">
                {formatINR(cartGrandTotal)}
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold shrink-0 pl-2">
              <span>Review order</span>
              <Icon name="arrow_forward" size={16} />
            </div>
          </button>
        </div>
      )}

      {/* 2. Floating Bottom Tab Bar: 5 Tabs */}
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto w-full bg-surface/95 backdrop-blur-xl text-ink rounded-2xl p-1.5 border border-border shadow-soft-lg flex items-center justify-around select-none"
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
              className={`flex-1 min-h-[48px] min-w-[48px] py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${
                isActive
                  ? "text-primary font-bold bg-primary/10 border border-primary/20"
                  : "text-ink-muted hover:text-ink active:scale-95 border border-transparent"
              }`}
            >
              <Icon
                name={item.icon}
                size={20}
                className={`transition-transform ${isActive ? "scale-105 text-primary" : ""}`}
              />
              <span className="text-[11px] tracking-tight truncate font-sans mt-0.5 leading-none">
                {getRetailerString(language, item.labelKey)}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
