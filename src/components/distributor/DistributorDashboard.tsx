"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  getDistributorKPIs,
  getAgeingBuckets,
  getOrderPipelineMetrics,
  getTopBrandsBySales,
  getTopRetailersBySales,
  get6MonthTrend,
  getDashboardPeriodDeltas,
  getRetailerAgeingLedgers,
  formatINR,
  MOCK_BRANDS,
  getFollowUpsGrouped,
} from "@/lib/mock";
import { AddFollowUpModal } from "@/components/distributor/AddFollowUpModal";

export default function DistributorDashboard() {
  const {
    setDistributorNav,
    setIsReceiptModalOpen,
    setIsCreateInvoiceOpen,
    setViewingInvoice,
    setOrderTabFilter,
    invoices,
    orders,
    payments,
    purchaseBills,
    retailers,
    currentDate,
    selectedMonth,
    followUps,
    addFollowUp,
    updateFollowUpStatus,
    retailerRequests,
  } = useApp();
  const { hasPermission } = useAuth();
  const canViewSupplierPayables = hasPermission("canViewSupplierPayables");

  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);

  // Grouped follow-ups from selector
  const followUpGrouped = useMemo(() => getFollowUpsGrouped(followUps, currentDate), [followUps, currentDate]);
  const pendingRequestsCount = useMemo(() => retailerRequests.filter(r => r.status === "pending").length, [retailerRequests]);
  const activeFollowUps = useMemo(() => [...followUpGrouped.missed, ...followUpGrouped.today], [followUpGrouped]);

  const draftInvoice = invoices.find(i => i.status === "Draft") || invoices[0];

  // Derive all data via selectors (filtered by selectedMonth)
  const kpis = useMemo(
    () => getDistributorKPIs(orders, invoices, payments, purchaseBills, retailers, currentDate, selectedMonth),
    [orders, invoices, payments, purchaseBills, retailers, currentDate, selectedMonth]
  );
  const pipeline = useMemo(() => getOrderPipelineMetrics(orders), [orders]);
  const ageing = useMemo(() => getAgeingBuckets(invoices, currentDate), [invoices, currentDate]);
  const topBrands = useMemo(() => getTopBrandsBySales(invoices, MOCK_BRANDS, 5), [invoices]);
  const topRetailers = useMemo(
    () => getTopRetailersBySales(invoices, retailers, 5, currentDate),
    [invoices, retailers, currentDate]
  );
  const trend = useMemo(
    () => get6MonthTrend(invoices, payments, currentDate),
    [invoices, payments, currentDate]
  );
  const deltas = useMemo(
    () => getDashboardPeriodDeltas(kpis, trend, invoices, selectedMonth, currentDate),
    [kpis, trend, invoices, selectedMonth, currentDate]
  );

  const ledgers = useMemo(
    () => getRetailerAgeingLedgers(retailers, invoices, currentDate),
    [retailers, invoices, currentDate]
  );

  // Current Month label
  const currentMonthName = useMemo(() => {
    return currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [currentDate]);

  // Chart hover interaction (tooltip on hover only)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Needs attention metrics
  const pendingRetailersCount = useMemo(() => {
    return retailers.filter(r => r.status === "Needs Approval").length;
  }, [retailers]);

  const overdueAccounts = useMemo(() => {
    return ledgers.filter(l => (l.d1_30 + l.d31_60 + l.d60_plus) > 0);
  }, [ledgers]);

  // Pipeline proportions
  const totalPipelineCount =
    pipeline.submittedCount +
    pipeline.approvedCount +
    pipeline.confirmedCount +
    pipeline.processingCount +
    pipeline.dispatchedCount +
    pipeline.deliveredCount;

  const submittedWidth = totalPipelineCount > 0 ? (pipeline.submittedCount / totalPipelineCount) * 100 : 0;
  const approvedWidth = totalPipelineCount > 0 ? (pipeline.approvedCount / totalPipelineCount) * 100 : 0;
  const confirmedWidth = totalPipelineCount > 0 ? (pipeline.confirmedCount / totalPipelineCount) * 100 : 0;
  const processingWidth = totalPipelineCount > 0 ? (pipeline.processingCount / totalPipelineCount) * 100 : 0;
  const dispatchedWidth = totalPipelineCount > 0 ? (pipeline.dispatchedCount / totalPipelineCount) * 100 : 0;
  const deliveredWidth = totalPipelineCount > 0 ? (pipeline.deliveredCount / totalPipelineCount) * 100 : 0;

  // Receivables overdue health ratio
  const overduePercent = kpis.totalReceivables > 0 ? Math.round((kpis.overdueReceivables / kpis.totalReceivables) * 100) : 0;
  const healthyPercent = Math.max(0, 100 - overduePercent);

  return (
    <div className="w-full flex flex-col gap-5 text-ink">
      {/* 1. Seller / Admin Console Header: Clean, Dense, Task-First with Quick Actions */}
      <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border shadow-soft-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
            <h1 className="font-bold text-lg sm:text-xl text-ink tracking-tight font-sans">
              Today • Operations &amp; Hub Command
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono font-bold num border border-primary/20">
              {currentDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1 flex items-center gap-2 flex-wrap">
            <span>Tiruppur Mill Hub</span>
            <span>•</span>
            <span className="text-primary font-semibold">Same-day dispatch cut-off: 17:30 IST</span>
            <span>•</span>
            <span>Tally Prime ERP live</span>
          </p>
        </div>

        {/* Quick Actions (Create invoice, Record receipt, Add follow-up) */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            type="button"
            onClick={() => {
              setIsCreateInvoiceOpen(true);
              setDistributorNav("invoices");
            }}
            className="px-3.5 min-h-[40px] rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 active:scale-98 transition-all shadow-soft-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px]">receipt</span>
            <span>Create Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-3.5 min-h-[40px] rounded-xl bg-surface-raised hover:bg-surface border border-border text-ink font-bold text-xs active:scale-98 transition-all shadow-soft-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-success">payments</span>
            <span>Record Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddFollowUpOpen(true)}
            className="px-3.5 min-h-[40px] rounded-xl bg-surface-raised hover:bg-surface border border-border text-ink font-bold text-xs active:scale-98 transition-all shadow-soft-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-accent">phone_callback</span>
            <span>Add Follow-up</span>
          </button>
        </div>
      </div>

      {/* 2. Tasks Bento Strip: Action-First Tasks (Orders to review, Follow-ups due, Overdue payments) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Task 1: Orders to Review */}
        <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm flex flex-col justify-between group hover:border-warning/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                Orders to Review
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-warning/15 text-warning">
                {pipeline.submittedCount} Pending
              </span>
            </div>
            {pipeline.submittedCount > 0 ? (
              <div className="p-2.5 rounded-lg bg-surface-raised border border-border mt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-ink">PO #ARK-8839</span>
                  <span className="font-mono font-bold text-primary num">₹38,400</span>
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  Sri Balaji Textiles • 96 boxes awaiting credit allocation
                </div>
              </div>
            ) : (
              <p className="text-xs text-ink-muted mt-2">All store orders reviewed &amp; approved.</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOrderTabFilter("review");
              setDistributorNav("orders");
            }}
            className="mt-3 w-full py-1.5 rounded-lg bg-background hover:bg-surface text-warning font-bold text-xs border border-border hover:border-warning/40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Review Store Orders</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        {/* Task 2: Follow-ups Due Today */}
        <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm flex flex-col justify-between group hover:border-accent/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${followUpGrouped.counts.missed > 0 ? "bg-danger" : "bg-accent"}`} />
                Follow-ups &amp; Tasks
              </span>
              <div className="flex items-center gap-1">
                {followUpGrouped.counts.missed > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-danger/15 text-danger">
                    {followUpGrouped.counts.missed} Missed
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-accent/15 text-accent">
                  {followUpGrouped.counts.today} Today
                </span>
              </div>
            </div>
            <div className="space-y-1.5 mt-1 max-h-36 overflow-y-auto no-scrollbar">
              {activeFollowUps.slice(0, 2).map((task) => {
                const ret = retailers.find((r) => r.id === task.retailerId);
                const isMissed = task.dueDate < currentDate.toISOString().split("T")[0];
                return (
                  <div
                    key={task.id}
                    className="p-2 rounded-lg bg-surface-raised border border-border flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-ink truncate">{ret?.name || task.retailerId}</span>
                        {task.promisedAmount && (
                          <span className="text-[10px] text-success font-mono font-bold num">
                            ₹{task.promisedAmount.toLocaleString("en-IN")}
                          </span>
                        )}
                        {isMissed && (
                          <span className="text-[9px] font-bold text-danger px-1 rounded bg-danger/10">Missed</span>
                        )}
                      </div>
                      <span className="text-[10px] text-ink-muted line-clamp-1">{task.notes}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateFollowUpStatus(task.id, "done")}
                      className="w-6 h-6 rounded-md bg-background hover:bg-success/20 text-ink-muted hover:text-success flex items-center justify-center border border-border shrink-0 cursor-pointer"
                      title="Mark Done"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDistributorNav("follow-ups")}
              className="flex-1 py-1.5 rounded-lg bg-background hover:bg-surface text-ink font-semibold text-xs border border-border flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Manage Tasks</span>
            </button>
            <button
              type="button"
              onClick={() => setIsAddFollowUpOpen(true)}
              className="py-1.5 px-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center cursor-pointer shadow-soft-xs"
              title="Schedule Follow-up"
            >
              <span className="material-symbols-outlined text-[15px]">add</span>
            </button>
          </div>
        </div>

        {/* Task 3: Overdue Payments */}
        <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm flex flex-col justify-between group hover:border-danger/40 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-danger" />
                Overdue Collections
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-danger/15 text-danger">
                {overdueAccounts.length} Stores
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-danger/5 border border-danger/20 mt-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-danger">Total Overdue Dues</span>
                <span className="font-mono font-bold text-danger num text-sm">
                  {formatINR(kpis.overdueReceivables)}
                </span>
              </div>
              <div className="text-[11px] text-ink-muted mt-0.5">
                {overdueAccounts.length} retailer accounts past credit terms (30-60+ days)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDistributorNav("receivables")}
            className="mt-3 w-full py-1.5 rounded-lg bg-background hover:bg-surface text-danger font-bold text-xs border border-border hover:border-danger/40 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open Overdue Ledgers</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Row 1: Bento Grid - Hero KPI Card for Receivables vs Overdue + Smaller Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-5">
        {/* HERO KPI CARD: Receivables vs Overdue (Spans 6 cols on XL) */}
        <div className="xl:col-span-6 bg-surface rounded-md p-6 shadow-soft-sm border border-border flex flex-col justify-between group hover:shadow-soft-md transition-shadow">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs uppercase font-bold text-ink-muted tracking-wider font-mono">
                Receivables vs Overdue Risk
              </span>
              <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-surface-raised text-ink-muted border border-border">
                {kpis.activeRetailersCount} Active Retailers
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-2">
              <div>
                <span className="text-[11px] font-semibold text-ink-muted uppercase block tracking-wider">
                  Total Receivables
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-ink font-mono num tracking-tight mt-0.5">
                  {formatINR(kpis.totalReceivables)}
                </div>
                <span className="text-xs text-ink-muted mt-1 block">
                  {kpis.activeRetailersCount} retailer ledgers
                </span>
              </div>

              <div>
                <span className="text-[11px] font-semibold text-danger uppercase block tracking-wider">
                  Overdue Terms
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-danger font-mono num tracking-tight mt-0.5">
                  {formatINR(kpis.overdueReceivables)}
                </div>
                <span className="text-xs text-danger/80 mt-1 block">
                  Past 30-day terms ({overduePercent}% of book)
                </span>
              </div>
            </div>

            {/* Health Meter Gauge */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs text-ink-muted mb-1.5">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  <span>Healthy / Within Terms ({healthyPercent}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-danger" />
                  <span>Overdue Risk ({overduePercent}%)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-surface-raised rounded-full overflow-hidden flex border border-border">
                <div
                  className="bg-success h-full transition-all duration-300"
                  style={{ width: `${healthyPercent}%` }}
                />
                <div
                  className="bg-danger h-full transition-all duration-300"
                  style={{ width: `${overduePercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-ink-muted border-t border-border">
            <span>30 Net Days Term Standard</span>
            <button
              type="button"
              onClick={() => setDistributorNav("receivables")}
              className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Receivables Table</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* 4 Smaller Stat Cards (Spans 6 cols on XL: 2x2 grid) */}
        <div className="xl:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Order value */}
          <div className="bg-surface rounded-md p-4 sm:p-5 shadow-soft-sm border border-border flex flex-col justify-between group hover:shadow-soft-md transition-shadow">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[11px] uppercase font-bold text-ink-muted tracking-wider truncate font-mono">
                  Order Value (incl. GST)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap shrink-0 font-mono">
                  {deltas.orderValueDelta}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-ink font-mono num tracking-tight">
                {formatINR(kpis.orderValue)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 flex items-center justify-between text-xs text-ink-muted border-t border-border">
              <span className="truncate">Demand ({kpis.orderCount} orders)</span>
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0">
                shopping_bag
              </span>
            </div>
          </div>

          {/* Card 2: Invoiced Sales */}
          <div className="bg-surface rounded-md p-4 sm:p-5 shadow-soft-sm border border-border flex flex-col justify-between group hover:shadow-soft-md transition-shadow">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[11px] uppercase font-bold text-ink-muted tracking-wider truncate font-mono">
                  Invoiced Sales (incl. GST)
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 whitespace-nowrap shrink-0 font-mono">
                  {deltas.invoicedSalesDelta}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-ink font-mono num tracking-tight">
                {formatINR(kpis.invoicedSales)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 flex items-center justify-between text-xs text-ink-muted border-t border-border">
              <span className="truncate">{kpis.invoicedCount} invoices billed</span>
              <span className="material-symbols-outlined text-success text-[18px] shrink-0">
                verified
              </span>
            </div>
          </div>

          {/* Card 3: Collections Received */}
          <div className="bg-surface rounded-md p-4 sm:p-5 shadow-soft-sm border border-border flex flex-col justify-between group hover:shadow-soft-md transition-shadow">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[11px] uppercase font-bold text-ink-muted tracking-wider truncate font-mono">
                  Collections Recv.
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-raised text-ink-muted border border-border whitespace-nowrap shrink-0 font-mono">
                  {deltas.collectionsDelta}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-ink font-mono num tracking-tight">
                {formatINR(kpis.collectionsReceived)}
              </div>
            </div>
            <div className="mt-3 pt-2.5 flex items-center justify-between text-xs text-ink-muted border-t border-border">
              <span className="truncate">{kpis.collectionsCount} collections settled</span>
              <span className="material-symbols-outlined text-ink-muted text-[18px] shrink-0">
                account_balance
              </span>
            </div>
          </div>

          {/* Card 4: Supplier Payables */}
          <div className="bg-surface-raised rounded-md p-4 sm:p-5 shadow-soft-sm border border-border flex flex-col justify-between group hover:shadow-soft-md transition-shadow">
            <div>
              <div className="flex items-center justify-between gap-1.5 mb-2">
                <span className="text-[11px] uppercase font-bold text-ink-muted tracking-wider truncate font-mono">
                  You Owe (Payables)
                </span>
                {canViewSupplierPayables && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface text-ink-muted border border-border whitespace-nowrap shrink-0 font-mono">
                    {deltas.payablesDelta}
                  </span>
                )}
              </div>
              {canViewSupplierPayables ? (
                <div className="text-xl sm:text-2xl font-bold text-ink font-mono num tracking-tight">
                  {formatINR(kpis.supplierPayables)}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-ink-muted text-xs py-1.5 font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-warning">lock</span>
                  <span>Restricted to Finance &amp; Owner</span>
                </div>
              )}
            </div>
            <div className="mt-3 pt-2.5 flex items-center justify-between text-xs text-ink-muted border-t border-border">
              <span className="truncate">Tiruppur mill payables</span>
              <span className="material-symbols-outlined text-ink-muted text-[18px] shrink-0">factory</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Line Chart Section: Invoiced Sales vs Collections */}
      <div className="bg-surface rounded-md p-6 shadow-soft-sm border border-border relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-ink font-sans">
                Invoiced Sales vs Collections
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-surface-raised text-ink-muted font-semibold font-mono border border-border">
                6-Month Trend
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              Direct monthly correlation between dispatched turnover and realized liquidity
            </p>
          </div>

          {/* Legend and Month Delta Stats */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-ink">Invoiced Sales (incl. GST)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs font-semibold text-ink">Collections Recv.</span>
            </div>
            <div className="px-3 py-1.5 rounded-md bg-surface-raised border border-border flex items-center gap-2 text-xs">
              <span className="text-ink-muted">Current Gap:</span>
              <span className="font-bold text-primary font-mono num">{formatINR(kpis.currentMonthGap)}</span>
            </div>
          </div>
        </div>

        {/* SVG Chart Visualization with Hover Tooltip Only */}
        <div
          className="w-full h-64 sm:h-72 relative"
          onMouseLeave={() => setHoveredPointIndex(null)}
        >
          <svg
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
            viewBox="0 0 1000 240"
          >
            <defs>
              <linearGradient id="invoicedGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="collectionsGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--success)" stopOpacity="0.20" />
                <stop offset="100%" stopColor="var(--success)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line stroke="currentColor" className="text-border" strokeDasharray="4 4" x1="50" x2="960" y1="30" y2="30" />
            <line stroke="currentColor" className="text-border" strokeDasharray="4 4" x1="50" x2="960" y1="80" y2="80" />
            <line stroke="currentColor" className="text-border" strokeDasharray="4 4" x1="50" x2="960" y1="130" y2="130" />
            <line stroke="currentColor" className="text-border" strokeDasharray="4 4" x1="50" x2="960" y1="180" y2="180" />

            {/* Y-Axis Labels */}
            <text className="fill-ink-muted font-mono text-[11px]" x="15" y="34">₹12L</text>
            <text className="fill-ink-muted font-mono text-[11px]" x="15" y="84">₹11L</text>
            <text className="fill-ink-muted font-mono text-[11px]" x="15" y="134">₹10L</text>
            <text className="fill-ink-muted font-mono text-[11px]" x="15" y="184">₹9L</text>

            {/* Area Fills */}
            <polygon
              fill="url(#invoicedGrad)"
              points="100,210 100,140 270,120 440,92 610,75 780,107 950,33 950,210"
            />
            <polygon
              fill="url(#collectionsGrad)"
              points="100,210 100,185 270,160 440,175 610,127 780,195 950,162 950,210"
            />

            {/* Invoiced Sales Polyline */}
            <polyline
              fill="none"
              points="100,140 270,120 440,92 610,75 780,107 950,33"
              stroke="var(--primary)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {/* Collections Polyline */}
            <polyline
              fill="none"
              points="100,185 270,160 440,175 610,127 780,195 950,162"
              stroke="var(--success)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />

            {/* Interactive Data Points and Guidelines */}
            {trend.map((pt, idx) => {
              const xPos = 100 + idx * 170;
              const invoicedY = [140, 120, 92, 75, 107, 33][idx];
              const collectedY = [185, 160, 175, 127, 195, 162][idx];
              const isHovered = hoveredPointIndex === idx;

              return (
                <g key={pt.monthLabel}>
                  {/* Invisible hit box for comfortable hovering */}
                  <rect
                    x={xPos - 75}
                    y={10}
                    width={150}
                    height={210}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPointIndex(idx)}
                  />

                  {/* Vertical guideline on hover */}
                  {isHovered && (
                    <line
                      x1={xPos}
                      x2={xPos}
                      y1={20}
                      y2={210}
                      stroke="var(--primary)"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Invoiced Point */}
                  <circle
                    cx={xPos}
                    cy={invoicedY}
                    fill={isHovered ? "var(--primary)" : "var(--surface)"}
                    r={isHovered ? 7 : 5}
                    stroke="var(--primary)"
                    strokeWidth={isHovered ? 3 : 2.5}
                    className="transition-all duration-150"
                  />

                  {/* Collections Point */}
                  <circle
                    cx={xPos}
                    cy={collectedY}
                    fill={isHovered ? "var(--success)" : "var(--surface)"}
                    r={isHovered ? 7 : 5}
                    stroke="var(--success)"
                    strokeWidth={isHovered ? 3 : 2.5}
                    className="transition-all duration-150"
                  />

                  {/* Month Label */}
                  <text
                    className={
                      isHovered
                        ? "fill-primary text-[13px] font-bold font-sans"
                        : pt.isCurrent
                        ? "fill-primary text-[12px] font-bold font-sans"
                        : "fill-ink-muted text-[12px] font-medium font-sans"
                    }
                    textAnchor="middle"
                    x={xPos}
                    y="232"
                  >
                    {pt.monthLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Tooltip visible ON HOVER ONLY */}
          {hoveredPointIndex !== null && trend[hoveredPointIndex] && (
            <div
              className="absolute bg-surface-raised/95 backdrop-blur-md text-ink rounded-md p-3.5 shadow-soft-xl border border-border pointer-events-none text-xs z-30 transition-all duration-150 min-w-[200px]"
              style={{
                left: `clamp(12px, ${10 + (hoveredPointIndex / 5) * 65}%, calc(100% - 220px))`,
                top: "16px",
              }}
            >
              <div className="font-bold text-ink-muted uppercase tracking-wider text-[10px] pb-1 border-b border-border flex items-center justify-between font-mono">
                <span>{trend[hoveredPointIndex].monthLabel}</span>
                {trend[hoveredPointIndex].isCurrent && (
                  <span className="text-success font-semibold lowercase text-[10px]">active</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 font-mono num text-xs pt-1.5">
                <span className="text-primary font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Sales:
                </span>
                <span className="font-bold text-ink">{formatINR(trend[hoveredPointIndex].invoiced)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-mono num text-xs mt-1">
                <span className="text-success font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-success" />
                  Collected:
                </span>
                <span className="font-bold text-ink">{formatINR(trend[hoveredPointIndex].collected)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-mono num text-[11px] text-ink-muted mt-1.5 pt-1.5 border-t border-border">
                <span>Unsettled Gap:</span>
                <span className="font-bold text-warning">
                  {formatINR(Math.max(0, trend[hoveredPointIndex].invoiced - trend[hoveredPointIndex].collected))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Operational Flow (Orders Pipeline Stepper) & Receivables Ageing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Orders Pipeline Horizontal Stepper with Counts (7 Cols) */}
        <div className="lg:col-span-7 bg-surface rounded-md p-6 shadow-soft-sm border border-border flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-ink font-sans">Orders Pipeline</h2>
                <p className="text-xs text-ink-muted">
                  Stage distribution across factory dispatch and transport
                </p>
              </div>
              <span className="font-mono num text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-raised text-ink border border-border w-fit">
                {kpis.orderCount} active POs
              </span>
            </div>

            {/* 6 Stage Horizontal Stepper Tiles */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { stage: "Needs Review", count: pipeline.submittedCount, tint: "bg-warning/10 border-warning/25 text-warning", icon: "pending_actions" },
                { stage: "Ready to Invoice", count: pipeline.approvedCount, tint: "bg-surface-raised border-border text-ink", icon: "verified" },
                { stage: "Invoiced", count: pipeline.confirmedCount, tint: "bg-surface-raised border-border text-ink", icon: "receipt_long" },
                { stage: "Processing", count: pipeline.processingCount, tint: "bg-primary/10 border-primary/25 text-primary", icon: "conveyor_belt" },
                { stage: "Dispatched", count: pipeline.dispatchedCount, tint: "bg-accent/10 border-accent/25 text-accent", icon: "local_shipping" },
                { stage: "Delivered", count: pipeline.deliveredCount, tint: "bg-success/10 border-success/25 text-success", icon: "task_alt" },
              ].map(s => (
                <div
                  key={s.stage}
                  className={`p-2 rounded-md flex flex-col items-center justify-between text-center border min-h-[76px] transition-all duration-150 ${s.tint}`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider text-center leading-tight min-h-[26px] flex items-center justify-center w-full font-mono">
                    {s.stage}
                  </span>
                  <span className="text-xl font-bold font-mono num mt-0.5">{s.count}</span>
                </div>
              ))}
            </div>

            {/* Proportional Stepper Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-xs text-ink-muted">
                <span className="text-[11px] font-medium">Stage Proportions</span>
                <span className="text-[11px] font-bold font-mono num text-ink">
                  {pipeline.fulfillmentRatePercent}% Fulfilled
                </span>
              </div>
              <div className="w-full bg-surface-raised h-2.5 rounded-full overflow-hidden flex border border-border">
                {submittedWidth > 0 && (
                  <div
                    className="bg-warning h-full transition-all duration-300"
                    style={{ width: `${submittedWidth}%` }}
                    title={`Needs Review: ${pipeline.submittedCount}`}
                  />
                )}
                {approvedWidth > 0 && (
                  <div
                    className="bg-primary/50 h-full transition-all duration-300"
                    style={{ width: `${approvedWidth}%` }}
                    title={`Ready to Invoice: ${pipeline.approvedCount}`}
                  />
                )}
                {confirmedWidth > 0 && (
                  <div
                    className="bg-primary/70 h-full transition-all duration-300"
                    style={{ width: `${confirmedWidth}%` }}
                    title={`Invoiced: ${pipeline.confirmedCount}`}
                  />
                )}
                {processingWidth > 0 && (
                  <div
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${processingWidth}%` }}
                    title={`Processing: ${pipeline.processingCount}`}
                  />
                )}
                {dispatchedWidth > 0 && (
                  <div
                    className="bg-accent h-full transition-all duration-300"
                    style={{ width: `${dispatchedWidth}%` }}
                    title={`Dispatched: ${pipeline.dispatchedCount}`}
                  />
                )}
                {deliveredWidth > 0 && (
                  <div
                    className="bg-success h-full transition-all duration-300"
                    style={{ width: `${deliveredWidth}%` }}
                    title={`Delivered: ${pipeline.deliveredCount}`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Inline Action Row */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setOrderTabFilter("review");
                setDistributorNav("orders");
              }}
              className="group flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <span>
                {pipeline.submittedCount === 1
                  ? "1 order needs review · Review →"
                  : `${pipeline.submittedCount} orders need review · Review →`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setOrderTabFilter("all");
                setDistributorNav("orders");
              }}
              className="text-xs text-ink-muted hover:text-ink font-semibold cursor-pointer"
            >
              All orders ({kpis.orderCount}) →
            </button>
          </div>
        </div>

        {/* Receivables Ageing Card (5 Cols) */}
        <div className="lg:col-span-5 bg-surface rounded-md p-6 shadow-soft-sm border border-border flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-ink font-sans">Receivables Ageing</h2>
                <p className="text-xs text-ink-muted">Risk distribution across 30-day net credit terms</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-ink-muted font-mono">Total Book</span>
                <div className="text-base font-bold text-ink font-mono num">{formatINR(ageing.total)}</div>
              </div>
            </div>

            {/* Ageing Stacked Segment Bar with Token Colors */}
            <div className="w-full h-3 bg-surface-raised rounded-full overflow-hidden flex my-2 border border-border">
              <div
                className="bg-success h-full transition-all duration-300"
                style={{ width: `${ageing.notYetDuePct}%` }}
                title={`Not yet due: ${ageing.notYetDuePct}%`}
              />
              <div
                className="bg-warning h-full transition-all duration-300"
                style={{ width: `${ageing.d1_30Pct}%` }}
                title={`1-30 days overdue: ${ageing.d1_30Pct}%`}
              />
              <div
                className="bg-accent h-full transition-all duration-300"
                style={{ width: `${ageing.d31_60Pct}%` }}
                title={`31-60 days overdue: ${ageing.d31_60Pct}%`}
              />
              <div
                className="bg-danger h-full transition-all duration-300"
                style={{ width: `${ageing.d60_plusPct}%` }}
                title={`60+ days overdue: ${ageing.d60_plusPct}%`}
              />
            </div>

            {/* Breakdown Ledger Matrix with Tokens */}
            <div className="space-y-2 mt-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-2.5 rounded-md bg-surface-raised border border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
                  <span className="text-ink font-medium">Not yet due</span>
                  <span className="text-[11px] text-ink-muted font-mono num">({ageing.notYetDuePct}%)</span>
                </div>
                <span className="font-mono num font-bold text-ink">{formatINR(ageing.notYetDue)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-surface-raised border border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning shrink-0" />
                  <span className="text-ink font-medium">1–30 days overdue</span>
                  <span className="text-[11px] text-ink-muted font-mono num">({ageing.d1_30Pct}%)</span>
                </div>
                <span className="font-mono num font-bold text-ink">{formatINR(ageing.d1_30)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-surface-raised border border-border">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent shrink-0" />
                  <span className="text-ink font-medium">31–60 days overdue</span>
                  <span className="text-[11px] text-ink-muted font-mono num">({ageing.d31_60Pct}%)</span>
                </div>
                <span className="font-mono num font-bold text-ink">{formatINR(ageing.d31_60)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-danger/10 border border-danger/25">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger shrink-0" />
                  <span className="text-danger font-bold">60+ days overdue</span>
                  <span className="text-[11px] text-danger/80 font-mono num">({ageing.d60_plusPct}%)</span>
                </div>
                <span className="font-mono num font-bold text-danger">{formatINR(ageing.d60_plus)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-ink-muted">
            <span>Standard Terms: 30 Net Days</span>
            <button
              type="button"
              onClick={() => setDistributorNav("receivables")}
              className="text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ledger Aging Audit</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 3: Commercial Leaders (Brands & Retailers) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Brands by Invoiced Sales */}
        <div className="bg-surface rounded-md p-6 shadow-soft-sm border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink font-sans">
                Top Brands by Invoiced Sales (incl. GST)
              </h2>
              <p className="text-xs text-ink-muted">Brand volume distribution for {currentMonthName}</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-raised text-ink-muted uppercase font-mono border border-border">
              Top 5 of 9 Brands
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {topBrands.map(b => (
              <div key={b.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded bg-surface-raised flex items-center justify-center font-mono num text-xs font-bold text-ink border border-border">
                      {b.rank}
                    </span>
                    <span className="font-bold text-ink">{b.name}</span>
                    <span className="text-ink-muted text-xs hidden sm:inline">{b.tagline}</span>
                  </div>
                  <span className="font-mono num font-bold text-ink">{formatINR(Math.round(b.sales))}</span>
                </div>
                <div className="w-full bg-surface-raised h-2 rounded-full overflow-hidden border border-border">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${b.relativePercent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Retailers by Invoiced Sales */}
        <div className="bg-surface rounded-md p-6 shadow-soft-sm border border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-ink font-sans">
                Top Retailers by Invoiced Sales (incl. GST)
              </h2>
              <p className="text-xs text-ink-muted">Leading accounts in Telangana &amp; Andhra Pradesh</p>
            </div>
            <button
              type="button"
              onClick={() => setDistributorNav("retailers")}
              className="text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              View All {kpis.activeRetailersCount}
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {topRetailers.map(r => (
              <div
                key={r.name}
                className="flex items-center justify-between p-3 rounded-md bg-surface-raised hover:bg-surface transition-colors border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                    {r.code}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-ink leading-tight font-sans">
                      {r.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink-muted">
                      <span
                        className={`px-1.5 py-0.2 rounded font-medium ${
                          r.isInterState
                            ? "bg-accent/15 text-accent font-semibold"
                            : "bg-surface text-ink-muted border border-border"
                        }`}
                      >
                        {r.stateDisplay}
                      </span>
                      <span className="font-mono">GST: {r.gstin}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono num font-bold text-ink text-xs sm:text-sm block">
                    {formatINR(r.amount)}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 font-mono ${
                      r.isOverdue
                        ? "bg-danger/10 text-danger border border-danger/25"
                        : "bg-success/10 text-success border border-success/25"
                    }`}
                  >
                    {r.statusBadge}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Follow-Up Modal */}
      <AddFollowUpModal
        retailers={retailers}
        isOpen={isAddFollowUpOpen}
        onClose={() => setIsAddFollowUpOpen(false)}
        onSave={addFollowUp}
      />
    </div>
  );
}
