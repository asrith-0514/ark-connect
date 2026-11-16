"use client";

import React, { useState } from "react";
import { RetailerLogin } from "./RetailerLogin";
import { DistributorLogin } from "./DistributorLogin";

export function AuthScreen({ defaultTab = "retailer" }: { defaultTab?: "retailer" | "distributor" }) {
  const [activeTab, setActiveTab] = useState<"retailer" | "distributor">(defaultTab);

  return (
    <div className="relative min-h-screen bg-background text-ink flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-primary/20 overflow-hidden">
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
