"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  getDistributorKPIs,
  getAgeingBuckets,
  getRetailerAgeingLedgers,
  getTopBrandsBySales,
  get6MonthTrend,
  formatINR,
  MOCK_BRANDS,
} from "@/lib/mock";

export const DistributorReports: React.FC = () => {
  const { retailers, invoices, orders, payments, purchaseBills, currentDate } = useApp();

  const [activeReport, setActiveReport] = useState<"brand" | "retailer" | "ageing" | "collections">("brand");
  const [dateRange, setDateRange] = useState("current-mtd");

  const currentMonthLabel = useMemo(() => {
    return currentDate.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }, [currentDate]);

  const kpis = useMemo(
    () => getDistributorKPIs(orders, invoices, payments, purchaseBills, retailers, currentDate),
    [orders, invoices, payments, purchaseBills, retailers, currentDate]
  );

  const ageing = useMemo(
    () => getAgeingBuckets(invoices, currentDate),
    [invoices, currentDate]
  );

  const ledgers = useMemo(
    () => getRetailerAgeingLedgers(retailers, invoices, currentDate),
    [retailers, invoices, currentDate]
  );

  const topBrands = useMemo(
    () => getTopBrandsBySales(invoices, MOCK_BRANDS, 9),
    [invoices]
  );

  const trend = useMemo(
    () => get6MonthTrend(invoices, payments, currentDate),
    [invoices, payments, currentDate]
  );

  // 1. Brand sales data derived from topBrands
  const totalBrandRevenue = useMemo(() => {
    return topBrands.reduce((sum, b) => sum + b.sales, 0) || 1;
  }, [topBrands]);

  const brandSalesData = useMemo(() => {
    return topBrands.map(b => ({
      brand: b.name,
      shortCode: b.shortCode,
      boxes: Math.round(b.sales / 1200),
      pieces: Math.round(b.sales / 120),
      revenue: b.sales,
      share: Math.round((b.sales / totalBrandRevenue) * 1000) / 10,
      growth: "+14.2%",
    }));
  }, [topBrands, totalBrandRevenue]);

  // 2. Retailer sales data
  const retailerSalesData = useMemo(() => {
    return ledgers.map(l => {
      const retailerInvoices = invoices.filter(
        inv => (inv.retailerId === l.retailer.id || inv.retailerName === l.retailer.name) && inv.status !== "Draft"
      );
      const invoicedSum = retailerInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const pos = orders.filter(
        o => (o.retailerId === l.retailer.id || o.retailerName === l.retailer.name) && o.status !== "Draft"
      ).length;
      const totalBoxes = retailerInvoices.reduce(
        (sum, inv) => sum + (inv.items?.reduce((isum, item) => isum + (item.boxes || 0), 0) || 0),
        0
      );

      return {
        code: l.retailer.code || l.retailer.id,
        name: l.retailer.name,
        owner: l.retailer.ownerName,
        town: l.retailer.town,
        district: l.retailer.district,
        pos,
        boxes: totalBoxes,
        invoiced: invoicedSum,
        paid: Math.max(0, invoicedSum - l.totalOwed),
        outstanding: l.totalOwed,
      };
    });
  }, [ledgers, invoices, orders]);

  // 3. Receivables Ageing Data
  const ageingData = useMemo(() => {
    return ledgers.map(l => {
      let risk: "Low" | "Medium" | "High" = "Low";
      if (l.d60_plus > 0 || l.creditUsedPercent >= 90) risk = "High";
      else if (l.d31_60 > 0 || l.d1_30 > 0 || l.creditUsedPercent >= 70) risk = "Medium";

      return {
        retailer: `${l.retailer.name} (${l.retailer.code || l.retailer.id})`,
        town: l.retailer.town,
        total: l.totalOwed,
        current: l.notYetDue,
        d30: l.d1_30,
        d60: l.d31_60,
        d90plus: l.d60_plus,
        limit: l.retailer.creditLimit,
        risk,
      };
    });
  }, [ledgers]);

  // 4. Collections vs Invoiced Data
  const collectionsData = useMemo(() => {
    return trend.map(t => {
      const gap = Math.max(0, t.invoiced - t.collected);
      const efficiency = t.invoiced > 0 ? Math.round((t.collected / t.invoiced) * 1000) / 10 : 100;
      return {
        month: t.monthLabel,
        invoiced: t.invoiced,
        collected: t.collected,
        gap,
        efficiency: `${efficiency}%`,
      };
    });
  }, [trend]);

  // Generic CSV export
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${currentDate.toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCurrent = () => {
    if (activeReport === "brand") {
      downloadCSV(
        "Sales_by_Brand",
        ["Brand", "Short Code", "Master Boxes", "Total Pieces", "Revenue (INR)", "Share (%)", "Growth"],
        brandSalesData.map(b => [`"${b.brand}"`, b.shortCode, b.boxes, b.pieces, b.revenue, b.share, b.growth])
      );
    } else if (activeReport === "retailer") {
      downloadCSV(
        "Sales_by_Retailer",
        [
          "Code",
          "Retailer Name",
          "Proprietor",
          "Town",
          "District",
          "POs",
          "Boxes",
          "Invoiced (INR)",
          "Paid (INR)",
          "Outstanding (INR)",
        ],
        retailerSalesData.map(r => [
          r.code,
          `"${r.name}"`,
          `"${r.owner}"`,
          `"${r.town}"`,
          `"${r.district}"`,
          r.pos,
          r.boxes,
          r.invoiced,
          r.paid,
          r.outstanding,
        ])
      );
    } else if (activeReport === "ageing") {
      downloadCSV(
        "Receivables_Ageing_Report",
        [
          "Retailer",
          "Town",
          "Total Outstanding (INR)",
          "Current (0-30d)",
          "31-60 Days",
          "61-90 Days",
          "90+ Days",
          "Credit Limit",
          "Risk",
        ],
        ageingData.map(a => [
          `"${a.retailer}"`,
          `"${a.town}"`,
          a.total,
          a.current,
          a.d30,
          a.d60,
          a.d90plus,
          a.limit,
          a.risk,
        ])
      );
    } else {
      downloadCSV(
        "Collections_vs_Invoiced",
        ["Month", "Invoiced (INR)", "Collected (INR)", "Deficit Gap (INR)", "Collection Realization Rate"],
        collectionsData.map(c => [c.month, c.invoiced, c.collected, c.gap, c.efficiency])
      );
    }
  };

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Reports &amp; Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              Live Ledger Analytics
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Financial analytics, brand volume velocity, retailer ledger balances, and receivables ageing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Date range picker */}
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_month</span>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="current-mtd">Month-to-Date ({currentMonthLabel})</option>
              <option value="last-month">Previous Month</option>
              <option value="rolling-6m">Rolling 6 Months</option>
              <option value="fy2026-27">Financial Year 2026–27</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportCurrent}
            className="px-4 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "brand", label: "Sales by Brand", icon: "loyalty" },
          { id: "retailer", label: "Sales by Retailer", icon: "storefront" },
          { id: "ageing", label: "Receivables Ageing", icon: "hourglass_bottom" },
          { id: "collections", label: "Collections vs Invoiced", icon: "query_stats" },
        ].map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveReport(t.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeReport === t.id
                ? "bg-[#0047d3] text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Report 1: Sales by Brand */}
      {activeReport === "brand" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Total Brand Wholesale Volume
              </span>
              <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
                {brandSalesData.reduce((s, b) => s + b.boxes, 0).toLocaleString("en-IN")} Boxes
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Across all 9 distributor brands
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Gross Invoiced Revenue
              </span>
              <span className="text-2xl font-bold text-[#0047d3] font-sans tabular-nums mt-1 block">
                {formatINR(totalBrandRevenue)}
              </span>
              <span className="text-[11px] text-emerald-700 mt-0.5 block font-semibold">
                +14.8% vs last month
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Leading Label Share
              </span>
              <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
                {brandSalesData[0]?.brand || "Flybirds"} ({brandSalesData[0]?.share || 0}%)
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Top brand by wholesale velocity
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-3 text-right">Master Boxes</th>
                    <th className="py-3 px-3 text-right">Total Pieces</th>
                    <th className="py-3 px-3 text-right">Wholesale Sales</th>
                    <th className="py-3 px-3 text-right">Volume Share</th>
                    <th className="py-3 px-4 text-right">MoM Growth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {brandSalesData.map(b => (
                    <tr key={b.brand} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-mono text-[10px] flex items-center justify-center font-bold">
                          {b.shortCode}
                        </span>
                        <span>{b.brand}</span>
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {b.boxes.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                        {b.pieces.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold font-sans tabular-nums text-slate-900">
                        {formatINR(b.revenue)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2 font-mono">
                          <span>{b.share}%</span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-[#0047d3] h-full rounded-full" style={{ width: `${b.share}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-700 font-mono">
                        {b.growth}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 2: Sales by Retailer */}
      {activeReport === "retailer" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">Retailer</th>
                    <th className="py-3 px-3">Town</th>
                    <th className="py-3 px-3 text-right">POs</th>
                    <th className="py-3 px-3 text-right">Boxes</th>
                    <th className="py-3 px-3 text-right">Invoiced (Gross)</th>
                    <th className="py-3 px-3 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Outstanding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {retailerSalesData.map(r => (
                    <tr key={r.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{r.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {r.code} • Prop. {r.owner}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {r.town}, {r.district}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                        {r.pos}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600">
                        {r.boxes.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold font-sans tabular-nums text-slate-900 text-sm">
                        {formatINR(r.invoiced)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                        {formatINR(r.paid)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-sans tabular-nums text-rose-700">
                        {formatINR(r.outstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 3: Receivables Ageing */}
      {activeReport === "ageing" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Not Yet Due (Within Terms)
              </span>
              <span className="text-2xl font-bold text-emerald-700 font-sans tabular-nums mt-1 block">
                {formatINR(ageing.notYetDue)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {ageing.notYetDuePct}% of Book • Within 30-day terms
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">
                1–30 Days Overdue
              </span>
              <span className="text-2xl font-bold text-amber-900 font-sans tabular-nums mt-1 block">
                {formatINR(ageing.d1_30)}
              </span>
              <span className="text-[11px] text-amber-700 mt-0.5 block">
                {ageing.d1_30Pct}% • First Follow-up Alert
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">
                31–60 Days Overdue
              </span>
              <span className="text-2xl font-bold text-rose-800 font-sans tabular-nums mt-1 block">
                {formatINR(ageing.d31_60)}
              </span>
              <span className="text-[11px] text-rose-600 mt-0.5 block">
                {ageing.d31_60Pct}% • Credit Hold Recommended
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-red-300 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-red-700 tracking-wider block">
                60+ Days Overdue
              </span>
              <span className="text-2xl font-bold text-red-900 font-sans tabular-nums mt-1 block">
                {formatINR(ageing.d60_plus)}
              </span>
              <span className="text-[11px] text-red-700 mt-0.5 block">
                {ageing.d60_plusPct}% • Action Required
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">Retailer Name</th>
                    <th className="py-3 px-3">Town</th>
                    <th className="py-3 px-3 text-right">Total Outstanding</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Not Yet Due</th>
                    <th className="py-3 px-3 text-right text-amber-700">1–30 Days</th>
                    <th className="py-3 px-3 text-right text-rose-700">31–60 Days</th>
                    <th className="py-3 px-3 text-right text-red-800">60+ Days</th>
                    <th className="py-3 px-4 text-center">Risk Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {ageingData.map(a => (
                    <tr key={a.retailer} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {a.retailer}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {a.town}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold font-sans tabular-nums text-slate-900 text-sm">
                        {formatINR(a.total)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                        {a.current > 0 ? formatINR(a.current) : "—"}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-amber-800">
                        {a.d30 > 0 ? formatINR(a.d30) : "—"}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-rose-800">
                        {a.d60 > 0 ? formatINR(a.d60) : "—"}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-red-900 font-bold">
                        {a.d90plus > 0 ? formatINR(a.d90plus) : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            a.risk === "Low"
                              ? "bg-emerald-100 text-emerald-800"
                              : a.risk === "Medium"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {a.risk} Risk
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report 4: Collections vs Invoiced */}
      {activeReport === "collections" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                {currentMonthLabel} Invoiced Sales
              </span>
              <span className="text-2xl font-bold text-[#0047d3] font-sans tabular-nums mt-1 block">
                {formatINR(kpis.invoicedSales)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Dispatched &amp; Billed
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                {currentMonthLabel} Collections Settled
              </span>
              <span className="text-2xl font-bold text-emerald-700 font-sans tabular-nums mt-1 block">
                {formatINR(kpis.collections)}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                Realized Liquidity via Bank &amp; Cash
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                {currentMonthLabel} Realization Deficit
              </span>
              <span className="text-2xl font-bold text-amber-800 font-sans tabular-nums mt-1 block">
                {formatINR(Math.max(0, kpis.invoicedSales - kpis.collections))}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                {kpis.onTimePaymentPct}% On-Time Payment Rate
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
                    <th className="py-3 px-4">Cycle Month</th>
                    <th className="py-3 px-3 text-right">Invoiced Sales (INR)</th>
                    <th className="py-3 px-3 text-right">Collections Received (INR)</th>
                    <th className="py-3 px-3 text-right">Gap / Deficit (INR)</th>
                    <th className="py-3 px-4 text-right">Realization Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {collectionsData.map(c => (
                    <tr key={c.month} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {c.month}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold font-sans tabular-nums text-slate-900 text-sm">
                        {formatINR(c.invoiced)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                        {formatINR(c.collected)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-amber-800">
                        {formatINR(c.gap)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-slate-800">
                        {c.efficiency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
