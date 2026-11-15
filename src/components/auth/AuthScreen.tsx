"use client";

import React, { useState } from "react";
import { RetailerLogin } from "./RetailerLogin";
import { DistributorLogin } from "./DistributorLogin";

export function AuthScreen({ defaultTab = "retailer" }: { defaultTab?: "retailer" | "distributor" }) {
  const [activeTab, setActiveTab] = useState<"retailer" | "distributor">(defaultTab);

  return (
    <div className="relative min-h-screen bg-background text-ink flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-primary/20 overflow-hidden">
      {/* Subtle Background Grid Texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:32px_32px] opacity-25 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      <div className="relative z-10 w-full max-w-lg">
        {activeTab === "retailer" ? (
          <RetailerLogin onSwitchToStaff={() => setActiveTab("distributor")} />
        ) : (
          <DistributorLogin onSwitchToRetailer={() => setActiveTab("retailer")} />
        )}
      </div>
    </div>
  );
}
