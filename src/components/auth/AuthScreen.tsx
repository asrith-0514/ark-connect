"use client";

import React, { useState, useEffect } from "react";
import { RetailerLogin } from "./RetailerLogin";
import { DistributorLogin } from "./DistributorLogin";
import { Icon } from "@/components/ui/Icon";

export function AuthScreen({ defaultTab = "retailer" }: { defaultTab?: "retailer" | "distributor" }) {
  const [activeTab, setActiveTab] = useState<"retailer" | "distributor">(defaultTab);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  return (
    <div className="relative min-h-screen bg-background text-ink flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 selection:bg-primary/20 overflow-hidden">
      <div className="relative z-10 w-full max-w-lg flex flex-col items-center">
        {/* Quick Portal Switcher Tabs */}
        <div className="inline-flex p-1 bg-surface border border-border rounded-xl shadow-soft-xs mb-6 select-none">
          <button
            type="button"
            onClick={() => setActiveTab("retailer")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "retailer"
                ? "bg-primary text-white shadow-soft-xs"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
          >
            <Icon name="storefront" size={16} />
            <span>Retailer Store (OTP)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("distributor")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "distributor"
                ? "bg-primary text-white shadow-soft-xs"
                : "text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
          >
            <Icon name="factory" size={16} />
            <span>Wholesaler Staff (Password)</span>
          </button>
        </div>

        <div className="w-full">
          {activeTab === "retailer" ? (
            <RetailerLogin onSwitchToStaff={() => setActiveTab("distributor")} />
          ) : (
            <DistributorLogin onSwitchToRetailer={() => setActiveTab("retailer")} />
          )}
        </div>
      </div>
    </div>
  );
}
