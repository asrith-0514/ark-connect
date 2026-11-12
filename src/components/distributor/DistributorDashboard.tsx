"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
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
} from "@/lib/mock";

export default function DistributorDashboard() {
  const {
    setDistributorNav,
    setIsReceiptModalOpen,
    setViewingInvoice,
    setOrderTabFilter,
    invoices,
    orders,
    payments,
    purchaseBills,
    retailers,
    currentDate,
  } = useApp();

  const draftInvoice = invoices.find(i => i.status === "Draft") || invoices[0];

  // Derive all data via selectors
  const kpis = useMemo(
    () => getDistributorKPIs(orders, invoices, payments, purchaseBills, retailers, currentDate),
    [orders, invoices, payments, purchaseBills, retailers, currentDate]
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
    () => getDashboardPeriodDeltas(kpis, trend),
    [kpis, trend]
  );

  const ledgers = useMemo(
    () => getRetailerAgeingLedgers(retailers, invoices, currentDate),
    [retailers, invoices, currentDate]
  );

  // Month Picker state (Requirement 1)
  const currentMonthName = useMemo(() => {
    return currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [currentDate]);

  const prevMonthName = useMemo(() => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [currentDate]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>("current-mtd");

  // Chart hover interaction (Requirement 4: tooltip on hover only)
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Needs attention metrics (Requirement 6)
  const pendingRetailersCount = useMemo(() => {
    return retailers.filter(r => r.status === "Needs Approval").length;
  }, [retailers]);

  const overdueAccounts = useMemo(() => {
    return ledgers.filter(l => (l.d1_30 + l.d31_60 + l.d60_plus) > 0);
  }, [ledgers]);

  // Sync Tally state in dashboard
  const [isSyncingTally, setIsSyncingTally] = useState(false);
  const [lastSyncedTimestamp, setLastSyncedTimestamp] = useState<string>("Today, 09:42 AM");
  const [tallyToast, setTallyToast] = useState<{ show: boolean; message: string } | null>(null);

  const handleSyncTally = () => {
    setIsSyncingTally(true);
    setTimeout(() => {
      setIsSyncingTally(false);
      const timeStr = `Today, ${new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
      setLastSyncedTimestamp(timeStr);
      setTallyToast({
        show: true,
        message: "Tally Prime ERP synchronized successfully. 28 retailer ledgers and 64 vouchers updated.",
      });
      setTimeout(() => setTallyToast(null), 4000);
    }, 1200);
  };

  // Pipeline proportions
  const totalOrdersCount = kpis.orderCount > 0 ? kpis.orderCount : 1;
  const submittedWidth = (pipeline.submittedCount / totalOrdersCount) * 100;
  const approvedWidth = (pipeline.approvedCount / totalOrdersCount) * 100;
  const confirmedWidth = (pipeline.confirmedCount / totalOrdersCount) * 100;
  const processingWidth = (pipeline.processingCount / totalOrdersCount) * 100;
  const dispatchedWidth = (pipeline.dispatchedCount / totalOrdersCount) * 100;
  const deliveredWidth = (pipeline.deliveredCount / totalOrdersCount) * 100;

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Top Dashboard Header & Operational Control Strip */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Business Dashboard
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Operational Ledger
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Wholesale Operations &amp; Ledger Overview • Secunderabad Distribution Hub • Month-to-Date ({currentMonthName})
          </p>
        </div>

        {/* Month Picker (Requirement 1) & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Picker dropdown replacing two-pill toggle */}
          <div className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold transition-colors">
            <span className="material-symbols-outlined text-[18px] text-[#0047d3] shrink-0">
              calendar_month
            </span>
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer pr-1"
            >
              <option value="current-mtd">{currentMonthName} (Month-to-Date)</option>
              <option value="prev-month">{prevMonthName}</option>
              <option value="rolling-6m">Rolling 6 Months</option>
              <option value="fy2026-27">Financial Year 2026–27</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 transition-colors border border-slate-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-emerald-700">payments</span>
            <span>Record Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => setViewingInvoice(draftInvoice)}
            className="h-10 px-4 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Requirement 6: "Needs attention" strip */}
      <div className="bg-gradient-to-r from-amber-50 via-rose-50/50 to-blue-50/40 rounded-2xl p-4 border border-amber-200/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-900 flex items-center justify-center font-bold shrink-0">
              <span className="material-symbols-outlined text-[20px] text-amber-700 animate-pulse">
                notification_important
              </span>
            </span>
            <div>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider block">
                Needs Attention
              </span>
              <span className="text-[11px] text-slate-600">
                Actionable operational items requiring hub intervention
              </span>
            </div>
          </div>

          {/* Actionable Badges/Links Strip */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. POs awaiting review */}
            <button
              type="button"
              onClick={() => {
                setOrderTabFilter("review");
                setDistributorNav("orders");
              }}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/70 text-slate-800 text-xs font-semibold flex items-center gap-2 transition-all border border-amber-300 shadow-2xs cursor-pointer group"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span>
                <strong className="text-amber-900 font-bold font-mono">{pipeline.submittedCount}</strong>{" "}
                {pipeline.submittedCount === 1 ? "PO awaiting review" : "POs awaiting review"}
              </span>
              <span className="material-symbols-outlined text-[14px] text-amber-700 group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </button>

            {/* 2. Retailers awaiting approval */}
            <button
              type="button"
              onClick={() => setDistributorNav("retailers")}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-100/70 text-slate-800 text-xs font-semibold flex items-center gap-2 transition-all border border-rose-300 shadow-2xs cursor-pointer group"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>
                <strong className="text-rose-900 font-bold font-mono">{pendingRetailersCount}</strong>{" "}
                {pendingRetailersCount === 1 ? "retailer awaiting approval" : "retailers awaiting approval"}
              </span>
              <span className="material-symbols-outlined text-[14px] text-rose-700 group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </button>

            {/* 3. Overdue accounts */}
            <button
              type="button"
              onClick={() => setDistributorNav("receivables")}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-100/70 text-slate-800 text-xs font-semibold flex items-center gap-2 transition-all border border-red-300 shadow-2xs cursor-pointer group"
            >
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>
                <strong className="text-red-900 font-bold font-mono">{overdueAccounts.length}</strong> overdue accounts{" "}
                <span className="text-red-700 font-mono font-bold">({formatINR(kpis.overdueReceivables)})</span>
              </span>
              <span className="material-symbols-outlined text-[14px] text-red-700 group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 1: Six Bento KPI Cards with Computed Deltas (Requirement 1) */}
      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-4">
        {/* Card 1: Order value */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between min-w-0 group hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1.5 mb-2 min-w-0">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider truncate">
                Order Value
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#0047d3] whitespace-nowrap shrink-0">
                {deltas.orderValueDelta}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-sans tabular-nums tracking-tight">
              {formatINR(kpis.orderValue)}
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 min-w-0">
            <span className="truncate">Demand ({kpis.orderCount} orders)</span>
            <span className="material-symbols-outlined text-[#0047d3] text-[18px] shrink-0">
              shopping_bag
            </span>
          </div>
        </div>

        {/* Card 2: Invoiced Sales */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between min-w-0 group hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1.5 mb-2 min-w-0">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider truncate">
                Invoiced Sales
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap shrink-0">
                {deltas.invoicedSalesDelta}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-sans tabular-nums tracking-tight">
              {formatINR(kpis.invoicedSales)}
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 min-w-0">
            <span className="truncate">{kpis.invoicedCount} invoices billed</span>
            <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0">
              verified
            </span>
          </div>
        </div>

        {/* Card 3: Collections Received */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between min-w-0 group hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1.5 mb-2 min-w-0">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider truncate">
                Collections Recv.
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap shrink-0">
                {deltas.collectionsDelta}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-sans tabular-nums tracking-tight">
              {formatINR(kpis.collectionsReceived)}
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 min-w-0">
            <span className="truncate">{kpis.collectionsCount} collections settled</span>
            <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0">
              account_balance
            </span>
          </div>
        </div>

        {/* Card 4: Outstanding Receivables */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between min-w-0 group hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1.5 mb-2 min-w-0">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider truncate">
                Receivables
              </span>
              <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap shrink-0">
                {deltas.receivablesDelta}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-sans tabular-nums tracking-tight">
              {formatINR(kpis.totalReceivables)}
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 min-w-0">
            <span className="truncate">{kpis.activeRetailersCount} retailer ledgers</span>
            <span className="material-symbols-outlined text-slate-400 text-[18px] shrink-0">
              contacts_product
            </span>
          </div>
        </div>

        {/* Card 5: Overdue Receivables */}
        <div className="bg-white rounded-2xl p-5 shadow-xs border border-rose-200 flex flex-col justify-between min-w-0 group hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1.5 mb-2 min-w-0">
              <span className="text-[11px] uppercase font-bold text-rose-700 tracking-wider truncate">
                Overdue Terms
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 whitespace-nowrap shrink-0">
                Action Req.
              </span>
            </div>
            <div className="text-2xl font-bold text-rose-700 font-sans tabular-nums tracking-tight">
              {formatINR(kpis.overdueReceivables)}
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-rose-600 border-t border-rose-100 bg-rose-50/50 -mx-5 -mb-5 px-5 py-3 rounded-b-2xl min-w-0">
            <span className="truncate">Past 30-day terms</span>
            <span className="material-symbols-outlined text-rose-600 text-[18px] shrink-0">error</span>
          </div>
        </div>

        {/* Card 6: Supplier Payables */}
        <div className="bg-slate-100 rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between min-w-0 group hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-1.5 mb-2 min-w-0">
              <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider truncate">
                You Owe (Payables)
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 whitespace-nowrap shrink-0">
                {deltas.payablesDelta}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-sans tabular-nums tracking-tight">
              {formatINR(kpis.supplierPayables)}
            </div>
          </div>
          <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200 min-w-0">
            <span className="truncate">Tiruppur mill payables</span>
            <span className="material-symbols-outlined text-slate-500 text-[18px] shrink-0">factory</span>
          </div>
        </div>
      </div>

      {/* Trend Line Chart Section: Invoiced Sales vs Collections */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Invoiced Sales vs Collections
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                6-Month Trend
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct monthly correlation between dispatched turnover and realized liquidity
            </p>
          </div>

          {/* Legend and Month Delta Stats */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1e5eff]" />
              <span className="text-xs font-semibold text-slate-700">Invoiced Sales</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#007e56]" />
              <span className="text-xs font-semibold text-slate-700">Collections Recv.</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center gap-2 text-xs">
              <span className="text-slate-500">Current Gap:</span>
              <span className="font-bold text-[#0047d3] font-mono">{formatINR(kpis.currentMonthGap)}</span>
            </div>
          </div>
        </div>

        {/* SVG Chart Visualization with Hover Tooltip Only (Requirement 4) */}
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
                <stop offset="0%" stopColor="#1e5eff" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#1e5eff" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="collectionsGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#007e56" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#007e56" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            <line stroke="#eceef0" strokeDasharray="4 4" x1="50" x2="960" y1="30" y2="30" />
            <line stroke="#eceef0" strokeDasharray="4 4" x1="50" x2="960" y1="80" y2="80" />
            <line stroke="#eceef0" strokeDasharray="4 4" x1="50" x2="960" y1="130" y2="130" />
            <line stroke="#eceef0" strokeDasharray="4 4" x1="50" x2="960" y1="180" y2="180" />

            {/* Y-Axis Labels (Requirement 4: keep y-axis labels) */}
            <text className="fill-slate-400 font-mono text-[11px]" x="15" y="34">₹12L</text>
            <text className="fill-slate-400 font-mono text-[11px]" x="15" y="84">₹11L</text>
            <text className="fill-slate-400 font-mono text-[11px]" x="15" y="134">₹10L</text>
            <text className="fill-slate-400 font-mono text-[11px]" x="15" y="184">₹9L</text>

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
              stroke="#1e5eff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />
            {/* Collections Polyline */}
            <polyline
              fill="none"
              points="100,185 270,160 440,175 610,127 780,195 950,162"
              stroke="#007e56"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="3"
            />

            {/* Interactive Vertical Columns & Points */}
            {trend.map((pt, idx) => {
              const xPos = 100 + idx * 170;
              const invoicedY = [140, 120, 92, 75, 107, 33][idx];
              const collectedY = [185, 160, 175, 127, 195, 162][idx];
              const isHovered = hoveredPointIndex === idx;

              return (
                <g key={pt.monthKey}>
                  {/* Hover zone trigger rectangle */}
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
                      stroke="#0047d3"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Invoiced Point */}
                  <circle
                    cx={xPos}
                    cy={invoicedY}
                    fill={isHovered ? "#0047d3" : "#ffffff"}
                    r={isHovered ? 7 : 5}
                    stroke="#1e5eff"
                    strokeWidth={isHovered ? 3 : 2.5}
                    className="transition-all duration-150"
                  />

                  {/* Collections Point */}
                  <circle
                    cx={xPos}
                    cy={collectedY}
                    fill={isHovered ? "#007e56" : "#ffffff"}
                    r={isHovered ? 7 : 5}
                    stroke="#007e56"
                    strokeWidth={isHovered ? 3 : 2.5}
                    className="transition-all duration-150"
                  />

                  {/* Month Label */}
                  <text
                    className={
                      isHovered
                        ? "fill-[#0047d3] text-[13px] font-bold"
                        : pt.isCurrent
                        ? "fill-[#0047d3] text-[12px] font-bold"
                        : "fill-slate-600 text-[12px] font-medium"
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

          {/* Requirement 4: Tooltip visible ON HOVER ONLY (does not cover peak by default) */}
          {hoveredPointIndex !== null && trend[hoveredPointIndex] && (
            <div
              className="absolute bg-slate-900/95 backdrop-blur-md text-white rounded-xl p-3.5 shadow-2xl border border-slate-700 pointer-events-none text-xs z-30 transition-all duration-150 min-w-[200px]"
              style={{
                left: `clamp(12px, ${10 + (hoveredPointIndex / 5) * 65}%, calc(100% - 220px))`,
                top: "16px",
              }}
            >
              <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-800 flex items-center justify-between">
                <span>{trend[hoveredPointIndex].monthLabel}</span>
                {trend[hoveredPointIndex].isCurrent && (
                  <span className="text-emerald-400 font-semibold lowercase text-[10px]">active</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-4 font-mono text-xs pt-1.5">
                <span className="text-blue-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1e5eff]" />
                  Sales:
                </span>
                <span className="font-bold text-white">{formatINR(trend[hoveredPointIndex].invoiced)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-mono text-xs mt-1">
                <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#007e56]" />
                  Collected:
                </span>
                <span className="font-bold text-white">{formatINR(trend[hoveredPointIndex].collected)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 font-mono text-[11px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800">
                <span>Unsettled Gap:</span>
                <span className="font-bold text-amber-300">
                  {formatINR(Math.max(0, trend[hoveredPointIndex].invoiced - trend[hoveredPointIndex].collected))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Operational Flow & Receivables Risk (Equal Height Cards - Requirement 2 & 3) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Requirement 2: Orders Pipeline (7 Cols, height matches Receivables Ageing, no big gap) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Orders Pipeline</h2>
                <p className="text-xs text-slate-500">
                  Stage distribution across factory dispatch and transport
                </p>
              </div>
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 w-fit">
                {kpis.orderCount} active POs
              </span>
            </div>

            {/* 6 Stage Count Tiles (Requirement 2) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { stage: "Needs Review", count: pipeline.submittedCount, color: "text-[#0047d3] bg-blue-50/70 border-blue-200" },
                { stage: "Ready to Invoice", count: pipeline.approvedCount, color: "text-slate-900 bg-slate-50 border-slate-200" },
                { stage: "Invoiced", count: pipeline.confirmedCount, color: "text-slate-900 bg-slate-50 border-slate-200" },
                { stage: "Processing", count: pipeline.processingCount, color: "text-indigo-800 bg-indigo-50/70 border-indigo-200" },
                { stage: "Dispatched", count: pipeline.dispatchedCount, color: "text-sky-800 bg-sky-50/70 border-sky-200" },
                { stage: "Delivered", count: pipeline.deliveredCount, color: "text-emerald-800 bg-emerald-50/70 border-emerald-200" },
              ].map(s => (
                <div
                  key={s.stage}
                  className={`p-2.5 rounded-xl flex flex-col items-center text-center border ${s.color}`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider truncate w-full">
                    {s.stage}
                  </span>
                  <span className="text-xl font-bold font-mono mt-0.5">{s.count}</span>
                </div>
              ))}
            </div>

            {/* Proportional Progress Bar (Requirement 2: proportional to counts) */}
            <div className="space-y-1.5 mt-4">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span className="text-[11px] font-medium">Stage Proportions</span>
                <span className="text-[11px] font-bold font-mono text-slate-700">
                  {pipeline.fulfillmentRatePercent}% Fulfilled
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                {submittedWidth > 0 && (
                  <div
                    className="bg-[#0047d3] h-full transition-all duration-300"
                    style={{ width: `${submittedWidth}%` }}
                    title={`Needs Review: ${pipeline.submittedCount}`}
                  />
                )}
                {approvedWidth > 0 && (
                  <div
                    className="bg-blue-400 h-full transition-all duration-300"
                    style={{ width: `${approvedWidth}%` }}
                    title={`Ready to Invoice: ${pipeline.approvedCount}`}
                  />
                )}
                {confirmedWidth > 0 && (
                  <div
                    className="bg-slate-400 h-full transition-all duration-300"
                    style={{ width: `${confirmedWidth}%` }}
                    title={`Invoiced: ${pipeline.confirmedCount}`}
                  />
                )}
                {processingWidth > 0 && (
                  <div
                    className="bg-indigo-400 h-full transition-all duration-300"
                    style={{ width: `${processingWidth}%` }}
                    title={`Processing: ${pipeline.processingCount}`}
                  />
                )}
                {dispatchedWidth > 0 && (
                  <div
                    className="bg-sky-400 h-full transition-all duration-300"
                    style={{ width: `${dispatchedWidth}%` }}
                    title={`Dispatched: ${pipeline.dispatchedCount}`}
                  />
                )}
                {deliveredWidth > 0 && (
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${deliveredWidth}%` }}
                    title={`Delivered: ${pipeline.deliveredCount}`}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Requirement 2: Replace wrapping blue button with clean inline row "1 order needs review · Review →" */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setOrderTabFilter("review");
                setDistributorNav("orders");
              }}
              className="group flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0047d3] hover:text-[#1e5eff] transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
              className="text-xs text-slate-500 hover:text-slate-900 font-semibold cursor-pointer"
            >
              All orders ({kpis.orderCount}) →
            </button>
          </div>
        </div>

        {/* Requirement 3: Receivables Ageing (5 Cols, height matches Orders Pipeline) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Receivables Ageing</h2>
                <p className="text-xs text-slate-500">Risk distribution across 30-day net credit terms</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Book</span>
                <div className="text-base font-bold text-slate-900 font-mono">{formatINR(ageing.total)}</div>
              </div>
            </div>

            {/* Ageing Stacked Segment Bar (Requirement 3: from data) */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex my-2">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${ageing.notYetDuePct}%` }}
                title={`Not yet due: ${ageing.notYetDuePct}%`}
              />
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${ageing.d1_30Pct}%` }}
                title={`1-30 days overdue: ${ageing.d1_30Pct}%`}
              />
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${ageing.d31_60Pct}%` }}
                title={`31-60 days overdue: ${ageing.d31_60Pct}%`}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${ageing.d60_plusPct}%` }}
                title={`60+ days overdue: ${ageing.d60_plusPct}%`}
              />
            </div>

            {/* Breakdown Ledger Matrix (Requirement 3: from data) */}
            <div className="space-y-2 mt-3 text-xs sm:text-sm">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-slate-800 font-medium">Not yet due</span>
                  <span className="text-[11px] text-slate-400 font-mono">({ageing.notYetDuePct}%)</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{formatINR(ageing.notYetDue)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-slate-800 font-medium">1–30 days overdue</span>
                  <span className="text-[11px] text-slate-400 font-mono">({ageing.d1_30Pct}%)</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{formatINR(ageing.d1_30)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/50">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-slate-800 font-medium">31–60 days overdue</span>
                  <span className="text-[11px] text-slate-400 font-mono">({ageing.d31_60Pct}%)</span>
                </div>
                <span className="font-mono font-bold text-slate-900">{formatINR(ageing.d31_60)}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <span className="text-rose-900 font-bold">60+ days overdue</span>
                  <span className="text-[11px] text-rose-600 font-mono">({ageing.d60_plusPct}%)</span>
                </div>
                <span className="font-mono font-bold text-rose-700">{formatINR(ageing.d60_plus)}</span>
              </div>
            </div>
          </div>

          {/* Requirement 3: "Ledger Aging Audit" opens Receivables */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Standard Terms: 30 Net Days</span>
            <button
              type="button"
              onClick={() => setDistributorNav("receivables")}
              className="text-[#0047d3] font-bold hover:underline flex items-center gap-1 cursor-pointer"
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
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Top Brands by Invoiced Sales
              </h2>
              <p className="text-xs text-slate-500">Brand volume distribution for {currentMonthName}</p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase">
              Top 5 of 9 Brands
            </span>
          </div>

          <div className="space-y-3 pt-1">
            {topBrands.map(b => (
              <div key={b.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-md bg-slate-100 flex items-center justify-center font-mono text-xs font-bold text-slate-700">
                      {b.rank}
                    </span>
                    <span className="font-bold text-slate-900">{b.name}</span>
                    <span className="text-slate-400 text-xs hidden sm:inline">{b.tagline}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{formatINR(b.sales)}</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[#0047d3] h-full rounded-full" style={{ width: `${b.relativePercent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Retailers by Invoiced Sales (Requirement 5: derived status & state for non-TG) */}
        <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Top Retailers by Invoiced Sales
              </h2>
              <p className="text-xs text-slate-500">Leading accounts in Telangana &amp; Andhra Pradesh</p>
            </div>
            <button
              type="button"
              onClick={() => setDistributorNav("retailers")}
              className="text-xs font-bold text-[#0047d3] hover:underline cursor-pointer"
            >
              View All {kpis.activeRetailersCount}
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {topRetailers.map(r => (
              <div
                key={r.name}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200/60"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0047d3] flex items-center justify-center font-bold text-xs shrink-0">
                    {r.code}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                      {r.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                      {/* Requirement 5: Show state for non-Telangana retailers */}
                      <span
                        className={`px-1.5 py-0.2 rounded font-medium ${
                          r.isInterState
                            ? "bg-purple-100 text-purple-800 font-semibold"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {r.stateDisplay}
                      </span>
                      <span className="font-mono">GST: {r.gstin}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm block">
                    {formatINR(r.amount)}
                  </span>
                  {/* Requirement 5: Sri Laxmi must show Overdue ₹31,000 in red, not '100% on-time' */}
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                      r.isOverdue
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : "bg-emerald-50 text-emerald-800 border border-emerald-200"
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
    </div>
  );
}
