"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { isDemoModeEnabled } from "@/lib/mock/retailer";

export function HeaderSwitcher() {
  const { portalMode, setPortalMode, cartTotalBoxes, orders, retailers } = useApp();
  const { user, quickDemoLogin } = useAuth();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(isDemoModeEnabled());
  }, []);

  if (!isDemo) return null;

  const pendingApprovals = retailers.filter(r => r.status === "Needs Approval").length;
  const submittedOrders = orders.filter(o => o.status === "Submitted").length;

  const handleSwitchToRetailer = async () => {
    setPortalMode("retailer");
    if (!user || user.type !== "retailer") {
      await quickDemoLogin("retailer");
    }
  };

  const handleSwitchToDistributor = async () => {
    setPortalMode("distributor");
    if (!user || user.type !== "distributor") {
      await quickDemoLogin("owner");
    }
  };

  return (
    <div className="bg-ink text-surface text-xs border-b border-border/40 px-4 py-2 flex items-center justify-between select-none z-50 relative">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-primary/20 text-surface font-semibold tracking-wider uppercase text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
          Demo Mode (?demo=true)
        </span>
        <span className="text-surface/70 hidden sm:inline">
          Fast-switch between wholesale portals:
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleSwitchToRetailer}
          className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            portalMode === "retailer"
              ? "bg-primary text-primary-foreground shadow-soft-xs font-semibold ring-1 ring-white/20"
              : "text-surface/80 hover:text-surface hover:bg-surface/10"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">storefront</span>
          <span>Retailer Portal (ARK Connect)</span>
          {cartTotalBoxes > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary/30 text-surface font-mono tabular-nums text-[10px]">
              {cartTotalBoxes} bx
            </span>
          )}
        </button>

        <button
          onClick={handleSwitchToDistributor}
          className={`px-3 py-1 rounded-md font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
            portalMode === "distributor"
              ? "bg-primary text-primary-foreground shadow-soft-xs font-semibold ring-1 ring-white/20"
              : "text-surface/80 hover:text-surface hover:bg-surface/10"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">inventory_2</span>
          <span>Distributor Hub (ARK Backoffice)</span>
          {(pendingApprovals > 0 || submittedOrders > 0) && (
            <span className="px-1.5 py-0.2 rounded-full bg-warning text-ink font-semibold text-[10px]">
              {pendingApprovals + submittedOrders} action
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

