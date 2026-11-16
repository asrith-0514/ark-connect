"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Icon } from "@/components/ui/Icon";

export function HeaderSwitcher() {
  const { setPortalMode } = useApp();
  const { user, quickDemoLogin } = useAuth();

  const handleSwitchToRetailer = async (code: string) => {
    await quickDemoLogin("retailer", code);
    setPortalMode("retailer");
  };

  const handleSwitchToWholesaler = async () => {
    await quickDemoLogin("owner");
    setPortalMode("distributor");
  };

  const isWholesaler = user?.type === "distributor";
  const activeRetailerCode = user?.type === "retailer" ? user.retailerCode : null;

  return (
    <div className="bg-ink text-surface text-xs border-b border-border/40 px-3 sm:px-4 py-2 flex items-center justify-between select-none z-50 relative flex-wrap gap-2">
      {/* Current Active Account Indicator */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-primary/20 text-surface font-semibold tracking-wider uppercase text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
          Demo Switcher
        </span>
        <div className="flex items-center gap-1 text-surface/80 text-[11px]">
          <span className="text-surface/50">Active:</span>
          <strong className="text-surface font-semibold truncate max-w-[220px] sm:max-w-none">
            {isWholesaler ? "ARK Wholesaler (Full Backoffice)" : `${user?.name || "Retailer"} (${activeRetailerCode || "RET-0001"})`}
          </strong>
        </div>
      </div>

      {/* Exactly 1 Wholesaler Account + 3 Retailer Accounts */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-surface/50 text-[11px] hidden sm:inline mr-1">Switch to:</span>

        {/* 1. Wholesaler Account */}
        <button
          type="button"
          onClick={handleSwitchToWholesaler}
          className={`px-3 py-1 rounded-md font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
            isWholesaler
              ? "bg-primary text-white shadow-soft-xs ring-1 ring-white/30"
              : "bg-surface/10 text-surface/90 hover:bg-surface/20 hover:text-white"
          }`}
          title="Switch to Wholesaler Backoffice (Full Access)"
        >
          <Icon name="factory" size={14} />
          <span>Wholesaler</span>
        </button>

        <span className="text-surface/30 mx-1">|</span>

        {/* 2. Retailer 1 */}
        <button
          type="button"
          onClick={() => handleSwitchToRetailer("RET-0001")}
          className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all flex items-center gap-1 cursor-pointer ${
            !isWholesaler && activeRetailerCode === "RET-0001"
              ? "bg-primary text-white font-bold ring-1 ring-white/30"
              : "bg-surface/10 text-surface/90 hover:bg-surface/20 hover:text-white"
          }`}
          title="Switch to Retailer 1: Sri Laxmi Narasimha Textiles (Siddipet)"
        >
          <Icon name="storefront" size={13} />
          <span>Retailer 1</span>
        </button>

        {/* 3. Retailer 2 */}
        <button
          type="button"
          onClick={() => handleSwitchToRetailer("RET-0002")}
          className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all flex items-center gap-1 cursor-pointer ${
            !isWholesaler && activeRetailerCode === "RET-0002"
              ? "bg-primary text-white font-bold ring-1 ring-white/30"
              : "bg-surface/10 text-surface/90 hover:bg-surface/20 hover:text-white"
          }`}
          title="Switch to Retailer 2: Sri Venkata Ramana Garments (Warangal)"
        >
          <Icon name="storefront" size={13} />
          <span>Retailer 2</span>
        </button>

        {/* 4. Retailer 3 */}
        <button
          type="button"
          onClick={() => handleSwitchToRetailer("RET-0003")}
          className={`px-2.5 py-1 rounded-md font-medium text-xs transition-all flex items-center gap-1 cursor-pointer ${
            !isWholesaler && activeRetailerCode === "RET-0003"
              ? "bg-primary text-white font-bold ring-1 ring-white/30"
              : "bg-surface/10 text-surface/90 hover:bg-surface/20 hover:text-white"
          }`}
          title="Switch to Retailer 3: Balaji Textiles (Karimnagar)"
        >
          <Icon name="storefront" size={13} />
          <span>Retailer 3</span>
        </button>
      </div>
    </div>
  );
}
