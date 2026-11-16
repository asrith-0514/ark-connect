"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  formatINR,
  getRetailerInsights,
  getDistributorKPIs,
  getOrderPipelineMetrics,
  get6MonthTrend,
  getDashboardPeriodDeltas,
} from "@/lib/mock";
import { AddFollowUpModal } from "./AddFollowUpModal";

export const DistributorInsights: React.FC = () => {
  const {
    retailers,
    orders,
    complaints,
    invoices,
    payments,
    purchaseBills,
    addFollowUp,
    setSelectedRetailer360Id,
    setDistributorNav,
    currentDate,
    selectedMonth,
    setOrderTabFilter,
  } = useApp();

  const { hasPermission } = useAuth();
  const canViewSupplierPayables = hasPermission("canViewSupplierPayables");

  const [preselectedRetailerId, setPreselectedRetailerId] = useState<string | undefined>(undefined);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [aiCallFeedback, setAiCallFeedback] = useState<string | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Selector-derived data
  const kpis = useMemo(
    () => getDistributorKPIs(orders, invoices, payments, purchaseBills, retailers, currentDate, selectedMonth),
    [orders, invoices, payments, purchaseBills, retailers, currentDate, selectedMonth]
  );
  const pipeline = useMemo(() => getOrderPipelineMetrics(orders), [orders]);
  const trend = useMemo(
    () => get6MonthTrend(invoices, payments, currentDate),
    [invoices, payments, currentDate]
  );
  const deltas = useMemo(
    () => getDashboardPeriodDeltas(kpis, trend, invoices, selectedMonth, currentDate),
    [kpis, trend, invoices, selectedMonth, currentDate]
  );
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

  return (
    <div className="w-full flex flex-col gap-6 pb-20 text-ink animate-in fade-in duration-150">
      {/* Toast Feedback for AI Voice Call */}
      {aiCallFeedback && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-soft-xl bg-ink text-surface border border-border text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200">
          <Icon name="smart_toy" size={18} className="text-primary" />
          <span>{aiCallFeedback}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Insights &amp; Analytics</h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
            <Icon name="insights" size={14} />
            Analytics Engine
          </span>
        </div>
        <p className="text-xs text-ink-muted mt-0.5">
          Financial health, sales trends, wholesale pipeline, and proactive retailer relationship insights
        </p>
      </div>

      {/* =========================================================================
          SECTION 1: KEY PERFORMANCE INDICATORS (4 Bento Cards)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Receivables & Overdue */}
        <div
          onClick={() => setDistributorNav("receivables")}
          className="rounded-2xl p-4 bg-surface border border-border shadow-soft-sm hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted font-medium">Receivables</span>
              <Icon name="account_balance_wallet" size={18} className="text-primary" />
            </div>
            <div className="text-xl font-bold font-mono text-ink num mt-1">
              {formatINR(kpis.receivables)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs">
            <span className="text-danger font-semibold font-mono num">
              {formatINR(kpis.overdue)} overdue
            </span>
            <span className="text-ink-muted">{kpis.activeRetailersCount} stores</span>
          </div>
        </div>

        {/* Card 2: Sales Billed (Filtered Month) */}
        <div
          onClick={() => setDistributorNav("invoices")}
          className="rounded-2xl p-4 bg-surface border border-border shadow-soft-sm hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted font-medium">Monthly sales</span>
              <Icon name="trending_up" size={18} className="text-success" />
            </div>
            <div className="text-xl font-bold font-mono text-ink num mt-1">
              {formatINR(kpis.invoicedSales)}
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-ink-muted">
            <span>{selectedMonth ? `Billed in ${selectedMonth}` : "All issued invoices"}</span>
            {deltas.invoicedSalesDelta && (
              <span className="text-success font-semibold font-mono num">
                {deltas.invoicedSalesDelta}
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Orders in Flight */}
        <div
          onClick={() => setDistributorNav("orders")}
          className="rounded-2xl p-4 bg-surface border border-border shadow-soft-sm hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-muted font-medium">Active orders</span>
              <Icon name="inventory_2" size={18} className="text-primary" />
            </div>
            <div className="text-xl font-bold font-mono text-ink num mt-1">
              {pipeline.submittedCount + pipeline.confirmedCount + pipeline.processingCount + pipeline.dispatchedCount} in flight
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-ink-muted">
            <span>{pipeline.dispatchedCount} dispatched</span>
            <span className="text-warning font-semibold font-mono num">
              {pipeline.submittedCount} needs review
            </span>
          </div>
        </div>

        {/* Card 4: Mill Payables */}
        {canViewSupplierPayables && (
          <div
            onClick={() => setDistributorNav("suppliers")}
            className="rounded-2xl p-4 bg-surface border border-border shadow-soft-sm hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-muted font-medium">Mill payables</span>
                <Icon name="factory" size={18} className="text-warning" />
              </div>
              <div className="text-xl font-bold font-mono text-ink num mt-1">
                {formatINR(kpis.supplierPayables)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between text-xs text-ink-muted">
              <span>{purchaseBills.filter(b => b.status !== "Paid").length} purchase bills</span>
              <span className="text-ink font-semibold">Tiruppur mills</span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 2: 6-MONTH TREND & PIPELINE STEPPER
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart (Collections vs Sales) */}
        <div className="lg:col-span-2 rounded-2xl bg-surface border border-border p-5 shadow-soft-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-ink">Collections vs Sales (6 months)</h2>
              <span className="text-xs text-ink-muted">Monthly billing and collection reconciliation</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-primary font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" /> Sales
              </span>
              <span className="flex items-center gap-1.5 text-success font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-success" /> Collected
              </span>
            </div>
          </div>

          <div className="relative h-44 w-full flex items-end justify-between gap-3 pt-4 px-2">
            {trend.map((pt, idx) => {
              const maxVal = Math.max(...trend.map(t => Math.max(t.invoiced, t.collected)), 1);
              const salesHeight = Math.max(Math.round((pt.invoiced / maxVal) * 120), 8);
              const collHeight = Math.max(Math.round((pt.collected / maxVal) * 120), 8);

              return (
                <div
                  key={pt.monthKey || pt.monthLabel}
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  {/* Tooltip */}
                  {hoveredPointIndex === idx && (
                    <div className="absolute -top-12 z-20 bg-ink text-surface px-2.5 py-1.5 rounded-lg text-[10px] font-mono shadow-soft-md whitespace-nowrap">
                      <div>Sales: {formatINR(pt.invoiced)}</div>
                      <div>Collected: {formatINR(pt.collected)}</div>
                    </div>
                  )}

                  <div className="w-full flex items-end justify-center gap-1.5 h-36">
                    <div
                      style={{ height: `${salesHeight}px` }}
                      className="w-3 sm:w-4 rounded-t bg-primary group-hover:brightness-110 transition-all"
                    />
                    <div
                      style={{ height: `${collHeight}px` }}
                      className="w-3 sm:w-4 rounded-t bg-success group-hover:brightness-110 transition-all"
                    />
                  </div>

                  <span className="text-[11px] text-ink-muted font-mono mt-2">
                    {pt.monthLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pipeline Stepper */}
        <div className="rounded-2xl bg-surface border border-border p-5 shadow-soft-sm flex flex-col justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-ink">Wholesale order pipeline</h2>
            <span className="text-xs text-ink-muted">Active order processing status</span>
          </div>

          <div className="flex flex-col gap-3 my-auto">
            <button
              type="button"
              onClick={() => {
                setOrderTabFilter("review");
                setDistributorNav("orders");
              }}
              className="p-3 rounded-xl bg-background hover:bg-surface-raised border border-border flex items-center justify-between text-xs cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-warning" />
                <span className="font-semibold text-ink">Needs review</span>
              </div>
              <span className="font-mono font-bold text-warning num">
                {pipeline.submittedCount} orders
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderTabFilter("processing");
                setDistributorNav("orders");
              }}
              className="p-3 rounded-xl bg-background hover:bg-surface-raised border border-border flex items-center justify-between text-xs cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="font-semibold text-ink">Processing &amp; packing</span>
              </div>
              <span className="font-mono font-bold text-primary num">
                {pipeline.processingCount + pipeline.confirmedCount} orders
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderTabFilter("dispatched");
                setDistributorNav("orders");
              }}
              className="p-3 rounded-xl bg-background hover:bg-surface-raised border border-border flex items-center justify-between text-xs cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                <span className="font-semibold text-ink">Dispatched (in transit)</span>
              </div>
              <span className="font-mono font-bold text-accent num">
                {pipeline.dispatchedCount} orders
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setOrderTabFilter("delivered");
                setDistributorNav("orders");
              }}
              className="p-3 rounded-xl bg-background hover:bg-surface-raised border border-border flex items-center justify-between text-xs cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-success" />
                <span className="font-semibold text-ink">Delivered (fulfilled)</span>
              </div>
              <span className="font-mono font-bold text-success num">
                {pipeline.deliveredCount} orders
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: ACTIONABLE RELATIONSHIP INSIGHTS
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dormant Accounts */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-ink-muted/10 text-ink-muted flex items-center justify-center font-bold">
                  <Icon name="person_off" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Dormant accounts ({insights.inactiveRetailers.length})</h3>
                  <p className="text-xs text-ink-muted">Zero wholesale orders placed in the last 60+ days</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {insights.inactiveRetailers.slice(0, 4).map((item) => (
                <div key={item.retailer.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-ink block">{item.retailer.name}</span>
                    <span className="text-ink-muted text-[11px] font-mono">
                      {item.retailer.town} • Last ordered: {item.lastOrderDate || "None"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateFollowUp(item.retailer.id)}
                    className="min-h-[36px] px-3 rounded-lg bg-surface hover:bg-surface-raised border border-border text-xs font-semibold cursor-pointer"
                  >
                    Follow up
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cross-Selling Opportunities */}
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Icon name="auto_awesome" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-ink">Cross-selling opportunities</h3>
                  <p className="text-xs text-ink-muted">Stores ready for brand expansion</p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-border">
              {insights.crossSellingOpportunities.slice(0, 4).map((item) => (
                <div key={item.retailer.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-ink block">{item.retailer.name}</span>
                    <span className="text-ink-muted text-[11px]">
                      Buys {item.currentCategory} → Recommend <strong className="text-primary">{item.recommendedCategory}</strong>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCreateFollowUp(item.retailer.id)}
                    className="min-h-[36px] px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white border border-primary/20 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Recommend
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Follow-up Modal */}
      {isFollowUpModalOpen && (
        <AddFollowUpModal
          retailers={retailers}
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          preselectedRetailerId={preselectedRetailerId}
          onSave={addFollowUp}
        />
      )}
    </div>
  );
};
