"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  formatINR,
  getRetailerInsights,
  Retailer,
  FollowUpType,
} from "@/lib/mock";
import { AddFollowUpModal } from "./AddFollowUpModal";

export const DistributorInsights: React.FC = () => {
  const {
    retailers,
    orders,
    complaints,
    invoices,
    addFollowUp,
    setSelectedRetailer360Id,
    setDistributorNav,
    currentDate,
  } = useApp();

  const [preselectedRetailerId, setPreselectedRetailerId] = useState<string | undefined>(undefined);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [aiCallFeedback, setAiCallFeedback] = useState<string | null>(null);

  // Selector-derived insights
  const insights = useMemo(
    () => getRetailerInsights(retailers, orders, complaints, invoices, currentDate),
    [retailers, orders, complaints, invoices, currentDate]
  );

  const handleCreateFollowUp = (retailerId: string) => {
    setPreselectedRetailerId(retailerId);
    setIsFollowUpModalOpen(true);
  };

  const handleOpen360 = (retailerId: string) => {
    setSelectedRetailer360Id(retailerId);
    setDistributorNav("retailer-360");
  };

  const handleTriggerAiCall = (retailerName: string, phone: string, reason: string) => {
    setAiCallFeedback(`AI Voice Call scheduled for ${retailerName} (${phone}) regarding: "${reason}". Voice bot will dial at 11:00 AM.`);
    setTimeout(() => {
      setAiCallFeedback(null);
    }, 5000);
  };

  return (
    <div className="w-full flex flex-col gap-6 pb-20 animate-in fade-in duration-150 text-ink">
      {/* Toast Feedback for AI Voice Call */}
      {aiCallFeedback && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-soft-xl bg-ink text-surface border border-border text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="material-symbols-outlined text-[18px] text-primary">smart_toy</span>
          <span>{aiCallFeedback}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Actionable Relationship Insights</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
            AI Automated
          </span>
        </div>
        <p className="text-xs sm:text-sm text-ink-muted mt-1">
          Proactive account interventions derived from 12-month ordering velocity, product gaps, and service tickets.
        </p>
      </div>

      {/* Grid of Actionable Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: Retailers Who Stopped Ordering (> 60 Days) */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-500/10 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">person_off</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Dormant Accounts ({insights.inactiveRetailers.length})</h3>
                  <p className="text-[11px] text-ink-muted">Zero wholesale orders placed in the last 60+ days</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/15 text-slate-700 dark:text-slate-400">
                Re-engagement Needed
              </span>
            </div>

            <div className="divide-y divide-border">
              {insights.inactiveRetailers.slice(0, 4).map((item) => (
                <div key={item.retailer.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpen360(item.retailer.id)}
                      className="font-bold text-ink hover:text-primary transition-colors cursor-pointer text-left block"
                    >
                      {item.retailer.name}
                    </button>
                    <div className="text-[11px] text-ink-muted mt-0.5">
                      {item.retailer.town} · Inactive for <span className="text-danger font-semibold">{item.daysInactive}d</span> (Last: {item.lastOrderDate})
                    </div>
                  </div>

                  {/* 1-Click CTAs */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`https://wa.me/${item.retailer.phone.replace(/[^0-9]/g, "")}?text=Namaste%20${encodeURIComponent(item.retailer.ownerName)}%20garu,%20ARK%20Distributors%20lo%20new%20festive%20stock%20vachindi.%20Check%20chestara?`}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Send WhatsApp catalog message"
                    >
                      <span className="material-symbols-outlined text-[14px]">chat</span>
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCreateFollowUp(item.retailer.id)}
                      className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-soft-xs"
                      title="Schedule callback reminder"
                    >
                      + Follow-up
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTriggerAiCall(item.retailer.name, item.retailer.phone, "Re-engagement check for seasonal stocking")}
                      className="h-8 w-8 rounded-lg bg-surface hover:bg-surface-raised border border-border text-ink-muted hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
                      title="Trigger automated AI Voice check-in call"
                    >
                      <span className="material-symbols-outlined text-[15px]">smart_toy</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 2: Declining Purchases (Last 90d vs Previous 90d) */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">trending_down</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Declining Reorders ({insights.decliningRetailers.length})</h3>
                  <p className="text-[11px] text-ink-muted">Purchase spend dropped significantly vs prior 90 days</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-700 dark:text-orange-400">
                Retention Risk
              </span>
            </div>

            <div className="divide-y divide-border">
              {insights.decliningRetailers.map((item) => (
                <div key={item.retailer.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <button
                      type="button"
                      onClick={() => handleOpen360(item.retailer.id)}
                      className="font-bold text-ink hover:text-primary transition-colors cursor-pointer text-left block"
                    >
                      {item.retailer.name}
                    </button>
                    <div className="text-[11px] text-ink-muted mt-0.5">
                      Prev 90d: <span className="font-mono">{formatINR(item.spendPrev90d)}</span> → Last 90d:{" "}
                      <span className="font-mono text-danger font-bold">{formatINR(item.spendLast90d)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-1 rounded-lg bg-danger/10 text-danger font-mono font-bold text-xs">
                      -{item.dropPercent}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCreateFollowUp(item.retailer.id)}
                      className="h-8 px-2.5 rounded-lg bg-surface border border-border hover:bg-surface-raised text-xs font-semibold text-ink transition-colors cursor-pointer"
                    >
                      Schedule Visit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CARD 3: Frequently Purchased Products Across Network */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">local_fire_department</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink">Network Top Movers (Fast Moving)</h3>
                <p className="text-[11px] text-ink-muted">Highest wholesale velocity articles across 28 retailers</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
              Top Velocity
            </span>
          </div>

          <div className="divide-y divide-border">
            {insights.topProducts.map((p, idx) => (
              <div key={p.productId} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface-raised font-bold text-[11px] flex items-center justify-center text-ink-muted shrink-0">
                    #{idx + 1}
                  </span>
                  <div>
                    <span className="font-bold text-ink">{p.title}</span>
                    <span className="text-ink-muted ml-1.5 font-mono text-[11px]">({p.artNumber})</span>
                    <div className="text-[11px] text-ink-muted mt-0.5">
                      Stocked by <span className="font-semibold text-ink">{p.retailersCount}</span> partner stores
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-ink block">{p.totalBoxes} boxes</span>
                  <span className="text-[11px] font-mono text-ink-muted">{formatINR(p.totalSpend)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 4: Retailers with Pending Complaints */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-danger/10 text-danger flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink">Open Retailer Complaints ({insights.pendingComplaints.length})</h3>
                <p className="text-[11px] text-ink-muted">Unresolved delivery delays, shortages, or billing queries</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/15 text-danger">
              Urgent Attention
            </span>
          </div>

          <div className="divide-y divide-border">
            {insights.pendingComplaints.map(({ complaint, retailer: ret, daysOpen }) => (
              <div key={complaint.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-danger/10 text-danger">
                      {complaint.type}
                    </span>
                    <span className="font-bold text-ink">{ret?.name || complaint.retailerId}</span>
                    <span className="text-[11px] text-danger font-semibold">Open {daysOpen}d</span>
                  </div>
                  <p className="text-[11px] text-ink line-clamp-1">{complaint.notes}</p>
                  <span className="text-[10px] text-ink-muted block">Assigned: {complaint.assignee}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpen360(complaint.retailerId)}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-raised text-primary font-bold text-xs shrink-0 cursor-pointer shadow-soft-xs"
                >
                  Resolve
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CARD 5: Cross-Selling & Category Expansion Opportunities */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-surface border border-border shadow-soft-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-ink">Cross-Selling &amp; Basket Expansion Opportunities</h3>
                <p className="text-[11px] text-ink-muted">Identified store gaps where retailers buy only one category</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
              Revenue Growth
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.crossSellingOpportunities.map((opp, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-background border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleOpen360(opp.retailer.id)}
                    className="font-bold text-xs text-ink hover:text-primary transition-colors cursor-pointer text-left"
                  >
                    {opp.retailer.name} ({opp.retailer.town})
                  </button>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                    +30% Upsell
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="text-ink-muted">
                    Currently Buys: <span className="font-semibold text-ink">{opp.currentCategory}</span>
                  </div>
                  <div className="text-primary font-bold">
                    Target Expansion: <span>{opp.recommendedCategory}</span>
                  </div>
                </div>

                <p className="text-[11px] text-ink-muted leading-relaxed">
                  {opp.rationale}
                </p>

                <div className="pt-1 flex items-center justify-between gap-2">
                  <a
                    href={`https://wa.me/${opp.retailer.phone.replace(/[^0-9]/g, "")}?text=Namaste%20${encodeURIComponent(opp.retailer.ownerName)}%20garu,%20ARK%20lo%20${encodeURIComponent(opp.recommendedProduct)}%20sample%20box%20offer%20undi.%20Mee%20store%20kosam%20send%20cheyamantara?`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">chat</span>
                    WhatsApp Offer
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCreateFollowUp(opp.retailer.id)}
                    className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-[11px] font-bold hover:bg-primary/90 transition-colors cursor-pointer shadow-soft-xs"
                  >
                    + Pitch Task
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global Add Follow-up Modal */}
      <AddFollowUpModal
        retailers={retailers}
        preselectedRetailerId={preselectedRetailerId}
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setPreselectedRetailerId(undefined);
        }}
        onSave={addFollowUp}
      />
    </div>
  );
};
