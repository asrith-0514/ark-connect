"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { isDemoModeEnabled } from "@/lib/mock/retailer";

export function HeaderSwitcher() {
  const { portalMode, setPortalMode, cartTotalBoxes, cartGrandTotal, orders, retailers } = useApp();
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(isDemoModeEnabled());
  }, []);

  if (!isDemo) return null;

  const pendingApprovals = retailers.filter(r => r.status === "Needs Approval").length;
  const submittedOrders = orders.filter(o => o.status === "Submitted").length;

  return (
    <div className="bg-[#111827] text-white text-xs border-b border-gray-800 px-4 py-2 flex items-center justify-between select-none z-50 relative">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/20 text-primary-fixed font-semibold tracking-wider uppercase text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          ARK Unified B2B Platform
        </span>
        <span className="text-gray-400 hidden sm:inline">
          Switch viewing role to experience both sides of the wholesale workflow:
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setPortalMode("retailer")}
          className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            portalMode === "retailer"
              ? "bg-primary text-white shadow-sm font-semibold ring-1 ring-white/20"
              : "text-gray-300 hover:text-white hover:bg-gray-800"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">storefront</span>
          <span>Retailer Portal (ARK Connect)</span>
          {cartTotalBoxes > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary-container text-white font-numeric-table text-[10px]">
              {cartTotalBoxes} bx
            </span>
          )}
        </button>

        <button
          onClick={() => setPortalMode("distributor")}
          className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
            portalMode === "distributor"
              ? "bg-primary text-white shadow-sm font-semibold ring-1 ring-white/20"
              : "text-gray-300 hover:text-white hover:bg-gray-800"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">inventory_2</span>
          <span>Distributor Hub (ARK Backoffice)</span>
          {(pendingApprovals > 0 || submittedOrders > 0) && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black font-semibold text-[10px]">
              {pendingApprovals + submittedOrders} action
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

