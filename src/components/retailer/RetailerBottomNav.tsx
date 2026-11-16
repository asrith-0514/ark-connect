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

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-3">
      {/* 1. Floating PO Dock Bar (Docks above bottom tab bar when items exist) */}
      {cartTotalBoxes > 0 && retailerNav !== "review-po" && (
        <div className="pointer-events-auto mb-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-full bg-surface text-ink rounded-2xl p-3 shadow-soft-lg border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 pl-1">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shrink-0 shadow-soft-xs">
                <Icon name="shopping_bag" size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-primary">
                    Order draft
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono font-bold text-sm text-ink num">
                    {formatINR(cartGrandTotal)}
                  </span>
                  <span className="text-xs text-ink-muted font-mono num">
                    ({cartTotalBoxes} {cartTotalBoxes === 1 ? "box" : "boxes"})
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsReviewOrderOpen(true)}
              className="min-h-[48px] h-12 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm shadow-soft-xs flex items-center gap-2 shrink-0 cursor-pointer active:scale-98 transition-all"
            >
              <span>Review order</span>
              <Icon name="arrow_forward" size={16} />
            </button>
          </div>
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
