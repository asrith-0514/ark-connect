"use client";

import React, { useState } from "react";
import { DistributorSuppliers } from "./DistributorSuppliers";
import { DistributorPurchaseBills } from "./DistributorPurchaseBills";
import { Icon } from "@/components/ui/Icon";

export function DistributorSuppliersAndBills() {
  const [activeTab, setActiveTab] = useState<"suppliers" | "bills">("suppliers");

  return (
    <div className="w-full flex flex-col gap-6">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center bg-surface-raised p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab("suppliers")}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "suppliers"
                ? "bg-surface text-primary shadow-soft-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon name="factory" size={16} />
            <span>Mill suppliers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("bills")}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "bills"
                ? "bg-surface text-primary shadow-soft-xs"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon name="receipt_long" size={16} />
            <span>Purchase bills</span>
          </button>
        </div>
      </div>

      {activeTab === "suppliers" ? (
        <DistributorSuppliers />
      ) : (
        <DistributorPurchaseBills />
      )}
    </div>
  );
}
