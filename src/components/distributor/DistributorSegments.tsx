"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/context/AppContext";
import {
  formatINR,
  getRetailerSegments,
  RetailerSegment,
  RetailerSegmentMetrics,
  SegmentationConfig,
  DEFAULT_SEGMENTATION_CONFIG,
} from "@/lib/mock";

export const DistributorSegments: React.FC = () => {
  const {
    retailers,
    orders,
    invoices,
    setSelectedRetailer360Id,
    setDistributorNav,
    currentDate,
  } = useApp();

  // Configurable thresholds state
  const [config, setConfig] = useState<SegmentationConfig>(DEFAULT_SEGMENTATION_CONFIG);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Active filter tab
  const [selectedSegmentTab, setSelectedSegmentTab] = useState<"ALL" | RetailerSegment>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Evaluated segmentation via pure selector
  const segmentation = useMemo(
    () => getRetailerSegments(retailers, orders, invoices, config, currentDate),
    [retailers, orders, invoices, config, currentDate]
  );

  const activeRetailers = useMemo(() => retailers.filter((r) => r.status === "Active"), [retailers]);

  // Filtered rows for table
  const filteredMetrics = useMemo(() => {
    let list = segmentation.allMetrics;
    if (selectedSegmentTab !== "ALL") {
      list = list.filter((m) => m.segment === selectedSegmentTab);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => {
        const ret = activeRetailers.find((r) => r.id === m.retailerId);
        return (
          m.retailerId.toLowerCase().includes(q) ||
          (ret && (ret.name.toLowerCase().includes(q) || ret.town.toLowerCase().includes(q) || ret.district.toLowerCase().includes(q)))
        );
      });
    }
    return list;
  }, [segmentation.allMetrics, selectedSegmentTab, searchQuery, activeRetailers]);

  // Jump to 360 profile
  const handleOpen360 = (retId: string) => {
    setSelectedRetailer360Id(retId);
    setDistributorNav("retailer-360");
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Retailer ID",
      "Store Name",
      "Town",
      "Segment",
      "Orders (Last 90d)",
      "Spend 12M (INR)",
      "Boxes 12M",
      "Preferred Brand",
      "On-Time Pay %",
      "Avg Days to Pay",
      "Days Since Last Order",
      "Overdue Balance (INR)",
    ];

    const rows = segmentation.allMetrics.map((m) => {
      const ret = activeRetailers.find((r) => r.id === m.retailerId);
      return [
        m.retailerId,
        `"${ret?.name || ""}"`,
        `"${ret?.town || ""}"`,
        m.segment,
        m.ordersLast90d,
        m.totalSpend12m,
        m.boxes12m,
        m.preferredBrand,
        `${m.onTimePaymentPct}%`,
        m.avgDaysToPay,
        m.daysSinceLastOrder,
        m.overdueAmount,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ARK_Retailer_Segmentation_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full flex flex-col gap-5 pb-20 animate-in fade-in duration-150">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-ink tracking-tight">Retailer Segmentation</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {segmentation.counts.total} Active Accounts
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Dynamic behavioral cohorting based on 90-day frequency, 12-month volume, brand loyalty, and payment punctuality.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="h-10 px-3.5 rounded-xl bg-surface border border-border hover:bg-surface-raised text-ink font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-soft-xs"
          >
            <Icon name="tune" size={18} className="text-ink-muted" />
            {isConfigOpen ? "Hide Rules" : "Configure Rules"}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs flex items-center gap-1.5 shadow-soft-sm transition-all active:scale-[0.98] cursor-pointer"
          >
            <Icon name="download" size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Collapsible Rules Configuration Panel */}
      {isConfigOpen && (
        <div className="p-5 rounded-lg bg-surface border border-border shadow-soft-sm text-ink space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <Icon name="settings_suggest" size={18} className="text-primary" />
              Segmentation Threshold Rules
            </h3>
            <button
              type="button"
              onClick={() => setConfig(DEFAULT_SEGMENTATION_CONFIG)}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-ink-muted mb-1 uppercase tracking-wider text-[10px]">
                Champion Frequency (Orders / 90d)
              </label>
              <input
                type="number"
                value={config.frequencyThreshold}
                onChange={(e) => setConfig({ ...config, frequencyThreshold: Number(e.target.value) || 1 })}
                className="w-full h-9 px-3 bg-background border border-border rounded-xl font-mono text-ink focus:outline-hidden"
              />
              <span className="text-[10px] text-ink-muted mt-1 block">Default: ≥ 4 orders</span>
            </div>

            <div>
              <label className="block font-semibold text-ink-muted mb-1 uppercase tracking-wider text-[10px]">
                Champion 12M Volume (₹)
              </label>
              <input
                type="number"
                step="50000"
                value={config.valueThreshold}
                onChange={(e) => setConfig({ ...config, valueThreshold: Number(e.target.value) || 100000 })}
                className="w-full h-9 px-3 bg-background border border-border rounded-xl font-mono text-ink focus:outline-hidden"
              />
              <span className="text-[10px] text-ink-muted mt-1 block">Default: ≥ {formatINR(DEFAULT_SEGMENTATION_CONFIG.valueThreshold)}</span>
            </div>

            <div>
              <label className="block font-semibold text-ink-muted mb-1 uppercase tracking-wider text-[10px]">
                Dormancy Inactivity Window (Days)
              </label>
              <input
                type="number"
                value={config.dormantDays}
                onChange={(e) => setConfig({ ...config, dormantDays: Number(e.target.value) || 30 })}
                className="w-full h-9 px-3 bg-background border border-border rounded-xl font-mono text-ink focus:outline-hidden"
              />
              <span className="text-[10px] text-ink-muted mt-1 block">Default: &gt; 60 days without order</span>
            </div>

            <div>
              <label className="block font-semibold text-ink-muted mb-1 uppercase tracking-wider text-[10px]">
                On-Time Payment Target (%)
              </label>
              <input
                type="number"
                value={config.onTimePaymentThresholdPct}
                onChange={(e) => setConfig({ ...config, onTimePaymentThresholdPct: Number(e.target.value) || 50 })}
                className="w-full h-9 px-3 bg-background border border-border rounded-xl font-mono text-ink focus:outline-hidden"
              />
              <span className="text-[10px] text-ink-muted mt-1 block">Default: ≥ 75% on-time</span>
            </div>
          </div>
        </div>
      )}

      {/* 5 Segment Bento Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Champions */}
        <div
          onClick={() => setSelectedSegmentTab("Champions")}
          className={`p-4 rounded-lg border transition-all cursor-pointer shadow-soft-xs ${
            selectedSegmentTab === "Champions"
              ? "bg-warning/10 border-warning/40 shadow-soft-sm scale-[1.02]"
              : "bg-surface border-border hover:bg-surface-raised"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-warning">
              ★ Champions
            </span>
            <span className="w-6 h-6 rounded-full bg-warning/20 text-warning font-bold text-xs flex items-center justify-center font-mono">
              {segmentation.counts.Champions}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-ink mt-2">
            {Math.round((segmentation.counts.Champions / 28) * 100)}%
          </div>
          <p className="text-[11px] text-ink-muted mt-1">High spend, steady reorders, top on-time payment</p>
        </div>

        {/* Regular */}
        <div
          onClick={() => setSelectedSegmentTab("Regular")}
          className={`p-4 rounded-lg border transition-all cursor-pointer shadow-soft-xs ${
            selectedSegmentTab === "Regular"
              ? "bg-primary/10 border-primary/40 shadow-soft-sm scale-[1.02]"
              : "bg-surface border-border hover:bg-surface-raised"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Regular Core
            </span>
            <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center font-mono">
              {segmentation.counts.Regular}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-ink mt-2">
            {Math.round((segmentation.counts.Regular / 28) * 100)}%
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Steady ordering cadence, dependable territory partners</p>
        </div>

        {/* New */}
        <div
          onClick={() => setSelectedSegmentTab("New")}
          className={`p-4 rounded-lg border transition-all cursor-pointer shadow-soft-xs ${
            selectedSegmentTab === "New"
              ? "bg-success/10 border-success/40 shadow-soft-sm scale-[1.02]"
              : "bg-surface border-border hover:bg-surface-raised"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-success">
              New Onboarded
            </span>
            <span className="w-6 h-6 rounded-full bg-success/20 text-success font-bold text-xs flex items-center justify-center font-mono">
              {segmentation.counts.New}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-ink mt-2">
            {Math.round((segmentation.counts.New / 28) * 100)}%
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Joined in last 60d, initial stocking stage</p>
        </div>

        {/* At Risk */}
        <div
          onClick={() => setSelectedSegmentTab("At risk")}
          className={`p-4 rounded-lg border transition-all cursor-pointer shadow-soft-xs ${
            selectedSegmentTab === "At risk"
              ? "bg-danger/10 border-danger/40 shadow-soft-sm scale-[1.02]"
              : "bg-surface border-border hover:bg-surface-raised"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-danger">
              At Risk
            </span>
            <span className="w-6 h-6 rounded-full bg-danger/20 text-danger font-bold text-xs flex items-center justify-center font-mono">
              {segmentation.counts["At risk"]}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-ink mt-2">
            {Math.round((segmentation.counts["At risk"] / 28) * 100)}%
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Declining order volume or overdue collection warning</p>
        </div>

        {/* Dormant */}
        <div
          onClick={() => setSelectedSegmentTab("Dormant")}
          className={`p-4 rounded-lg border transition-all cursor-pointer shadow-soft-xs col-span-2 sm:col-span-1 ${
            selectedSegmentTab === "Dormant"
              ? "bg-ink-muted/10 border-border-strong shadow-soft-sm scale-[1.02]"
              : "bg-surface border-border hover:bg-surface-raised"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Dormant (&gt;60d)
            </span>
            <span className="w-6 h-6 rounded-full bg-ink-muted/20 text-ink font-bold text-xs flex items-center justify-center font-mono">
              {segmentation.counts.Dormant}
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-ink mt-2">
            {Math.round((segmentation.counts.Dormant / 28) * 100)}%
          </div>
          <p className="text-[11px] text-ink-muted mt-1">Zero orders in last 60 days, needs re-engagement</p>
        </div>
      </div>

      {/* Cohort Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-3 rounded-lg border border-border shadow-soft-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {[
            { id: "ALL", label: `All Active (${segmentation.counts.total})` },
            { id: "Champions", label: `Champions (${segmentation.counts.Champions})` },
            { id: "Regular", label: `Regular (${segmentation.counts.Regular})` },
            { id: "New", label: `New (${segmentation.counts.New})` },
            { id: "At risk", label: `At Risk (${segmentation.counts["At risk"]})` },
            { id: "Dormant", label: `Dormant (${segmentation.counts.Dormant})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedSegmentTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                selectedSegmentTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-soft-xs font-bold"
                  : "text-ink-muted hover:text-ink hover:bg-surface-raised"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 max-w-xs w-full bg-background px-3 py-1.5 rounded-xl border border-border">
          <Icon name="search" size={18} className="text-ink-muted" />
          <input
            type="text"
            placeholder="Search store name, town, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent text-ink placeholder:text-ink-muted/50 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Retailers Table */}
      <div className="bg-surface rounded-lg border border-border shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-raised border-b border-border text-ink-muted uppercase font-bold text-[10px]">
              <tr>
                <th className="p-3">Retailer</th>
                <th className="p-3">Location</th>
                <th className="p-3">Segment</th>
                <th className="p-3 text-right">90d Orders</th>
                <th className="p-3 text-right">12M Spend</th>
                <th className="p-3">Preferred Brand</th>
                <th className="p-3 text-right">On-Time Pay</th>
                <th className="p-3 text-right">Last Order</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredMetrics.map((m) => {
                const ret = activeRetailers.find((r) => r.id === m.retailerId);
                return (
                  <tr key={m.retailerId} className="hover:bg-surface-raised/50 transition-colors">
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleOpen360(m.retailerId)}
                        className="font-bold text-ink hover:text-primary transition-colors cursor-pointer text-left block"
                      >
                        {ret?.name || m.retailerId}
                      </button>
                      <span className="text-[10px] text-ink-muted font-mono">{ret?.code}</span>
                    </td>

                    <td className="p-3 text-ink-muted">
                      <div>{ret?.town}</div>
                      <div className="text-[10px]">{ret?.district}</div>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          m.segment === "Champions"
                            ? "bg-warning/15 text-warning border border-warning/30"
                            : m.segment === "Regular"
                            ? "bg-primary/15 text-primary border border-primary/30"
                            : m.segment === "New"
                            ? "bg-success/15 text-success border border-success/30"
                            : m.segment === "At risk"
                            ? "bg-danger/15 text-danger border border-danger/30"
                            : "bg-surface-raised text-ink-muted border border-border"
                        }`}
                      >
                        {m.segment}
                      </span>
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-ink">{m.ordersLast90d}</td>

                    <td className="p-3 text-right font-mono font-bold text-ink">{formatINR(m.totalSpend12m)}</td>

                    <td className="p-3">
                      <div className="font-semibold text-ink">{m.preferredBrand}</div>
                      <div className="text-[10px] text-ink-muted">{m.preferredBrandSharePct}% of purchases</div>
                    </td>

                    <td className="p-3 text-right">
                      <span
                        className={`font-mono font-bold ${
                          m.onTimePaymentPct >= 80
                            ? "text-success"
                            : m.onTimePaymentPct >= 65
                            ? "text-warning"
                            : "text-danger"
                        }`}
                      >
                        {m.onTimePaymentPct}%
                      </span>
                      <div className="text-[10px] text-ink-muted font-mono">avg {m.avgDaysToPay}d</div>
                    </td>

                    <td className="p-3 text-right">
                      <span className="text-ink font-mono font-semibold">
                        {m.daysSinceLastOrder > 60 ? (
                          <span className="text-danger">{m.daysSinceLastOrder}d ago</span>
                        ) : (
                          <span>{m.daysSinceLastOrder}d ago</span>
                        )}
                      </span>
                      <div className="text-[10px] text-ink-muted font-mono">{m.lastOrderDate}</div>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpen360(m.retailerId)}
                        className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:bg-surface-raised text-primary font-bold text-[11px] cursor-pointer transition-colors shadow-soft-xs"
                      >
                        360 View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
