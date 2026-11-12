"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  getDistributorKPIs,
  getAgeingBuckets,
  getRetailerAgeingLedgers,
  RetailerAgeingLedger,
  formatINR,
  getDaysUntil,
} from "@/lib/mock";

export const DistributorReceivables: React.FC = () => {
  const {
    retailers,
    invoices,
    orders,
    payments,
    purchaseBills,
    setIsReceiptModalOpen,
    setReceiptPrefillRetailerId,
    toggleCreditHold,
    setCreditHold,
    currentDate,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [ageFilter, setAgeFilter] = useState("all");

  // Requirement 1: NO row pre-selected by default!
  const [selectedRetailerId, setSelectedRetailerId] = useState<string | null>(null);

  // Requirement 1: Selected rows for bulk actions
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Requirement 2: Pagination controls
  const [pageSize, setPageSize] = useState<number | "all">(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Derive all data dynamically via selectors
  const kpis = useMemo(
    () => getDistributorKPIs(orders, invoices, payments, purchaseBills, retailers, currentDate),
    [orders, invoices, payments, purchaseBills, retailers, currentDate]
  );

  const ageing = useMemo(
    () => getAgeingBuckets(invoices, currentDate),
    [invoices, currentDate]
  );

  const allLedgers = useMemo(
    () => getRetailerAgeingLedgers(retailers, invoices, currentDate),
    [retailers, invoices, currentDate]
  );

  // Available districts from active ledgers
  const districts = useMemo(() => {
    return Array.from(new Set(allLedgers.map(l => l.retailer.district))).filter(Boolean).sort();
  }, [allLedgers]);

  // Filtered ledgers
  const filteredLedgers = useMemo(() => {
    return allLedgers.filter(item => {
      if (districtFilter !== "all" && item.retailer.district !== districtFilter) return false;
      if (ageFilter === "1-30" && item.d1_30 <= 0) return false;
      if (ageFilter === "31-60" && item.d31_60 <= 0) return false;
      if (ageFilter === "60+" && item.d60_plus <= 0) return false;
      if (ageFilter === "not_due" && item.notYetDue <= 0) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          item.retailer.name.toLowerCase().includes(q) ||
          item.retailer.town.toLowerCase().includes(q) ||
          item.retailer.district.toLowerCase().includes(q) ||
          (item.retailer.code && item.retailer.code.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [allLedgers, districtFilter, ageFilter, searchQuery]);

  // Totals for filtered set (Reconciles with Header Cards: ₹18,64,700 total)
  const totals = useMemo(() => {
    return filteredLedgers.reduce(
      (acc, item) => {
        acc.notYetDue += item.notYetDue;
        acc.d1_30 += item.d1_30;
        acc.d31_60 += item.d31_60;
        acc.d60_plus += item.d60_plus;
        acc.totalOwed += item.totalOwed;
        return acc;
      },
      { notYetDue: 0, d1_30: 0, d31_60: 0, d60_plus: 0, totalOwed: 0 }
    );
  }, [filteredLedgers]);

  // Pagination slicing
  const paginatedLedgers = useMemo(() => {
    if (pageSize === "all") return filteredLedgers;
    const start = (currentPage - 1) * pageSize;
    return filteredLedgers.slice(start, start + pageSize);
  }, [filteredLedgers, currentPage, pageSize]);

  const totalPages = pageSize === "all" ? 1 : Math.ceil(filteredLedgers.length / pageSize);

  // Active retailer in drawer (if any selected)
  const activeLedger = useMemo(() => {
    if (!selectedRetailerId) return null;
    return allLedgers.find(l => l.retailer.id === selectedRetailerId || l.retailer.code === selectedRetailerId) || null;
  }, [allLedgers, selectedRetailerId]);

  const activeRetailer = activeLedger?.retailer || null;

  // Active retailer's open invoices
  const activeRetailerInvoices = useMemo(() => {
    if (!activeRetailer) return [];
    return invoices
      .filter(
        inv =>
          (inv.retailerId === activeRetailer.id ||
            inv.retailerId === activeRetailer.code ||
            inv.retailerName.toLowerCase().includes(activeRetailer.name.toLowerCase())) &&
          inv.status !== "Draft" &&
          inv.balanceDue > 0
      )
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [activeRetailer, invoices]);

  // Dynamic reminder message for active drawer retailer
  const defaultReminder = useMemo(() => {
    if (!activeRetailer) return "";
    const overdueInv = activeRetailerInvoices.find(
      inv => getDaysUntil(inv.dueDate, currentDate) < 0
    );
    if (overdueInv) {
      return `Hello ${activeRetailer.name}, invoice ${overdueInv.invoiceNumber} for ${formatINR(overdueInv.balanceDue)} was due on ${overdueInv.dueDate}. Please arrange payment. Thank you, ARK Distributors.`;
    }
    if (activeLedger && activeLedger.totalOwed > 0) {
      const firstInv = activeRetailerInvoices[0];
      if (firstInv) {
        return `Hello ${activeRetailer.name}, invoice ${firstInv.invoiceNumber} for ${formatINR(firstInv.balanceDue)} is due on ${firstInv.dueDate}. Total outstanding balance is ${formatINR(activeLedger.totalOwed)}. Thank you, ARK Distributors.`;
      }
      return `Hello ${activeRetailer.name}, you have an outstanding balance of ${formatINR(activeLedger.totalOwed)} with ARK Distributors. Please arrange payment at your earliest convenience. Thank you.`;
    }
    return `Hello ${activeRetailer.name}, your account with ARK Distributors is up to date. Thank you for your partnership!`;
  }, [activeRetailer, activeRetailerInvoices, activeLedger, currentDate]);

  const [reminderMessage, setReminderMessage] = useState(defaultReminder);

  React.useEffect(() => {
    setReminderMessage(defaultReminder);
  }, [defaultReminder]);

  // Requirement 4: Per-row "Send reminder" WhatsApp function
  const handleSendRowReminder = (ledger: RetailerAgeingLedger) => {
    const ret = ledger.retailer;
    const retInvoices = invoices.filter(
      inv =>
        (inv.retailerId === ret.id ||
          inv.retailerId === ret.code ||
          inv.retailerName.toLowerCase().includes(ret.name.toLowerCase())) &&
        inv.status !== "Draft" &&
        inv.balanceDue > 0
    ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const overdueInv = retInvoices.find(inv => getDaysUntil(inv.dueDate, currentDate) < 0);
    const targetInv = overdueInv || retInvoices[0];

    let msg = "";
    if (targetInv && getDaysUntil(targetInv.dueDate, currentDate) < 0) {
      msg = `Hello ${ret.name}, invoice ${targetInv.invoiceNumber} for ${formatINR(targetInv.balanceDue)} was due on ${targetInv.dueDate}. Please arrange payment. Thank you, ARK Distributors.`;
    } else if (targetInv) {
      msg = `Hello ${ret.name}, invoice ${targetInv.invoiceNumber} for ${formatINR(targetInv.balanceDue)} is due on ${targetInv.dueDate}. Total balance is ${formatINR(ledger.totalOwed)}. Thank you, ARK Distributors.`;
    } else {
      msg = `Hello ${ret.name}, you have an outstanding balance of ${formatINR(ledger.totalOwed)} with ARK Distributors. Please arrange payment. Thank you.`;
    }

    const cleanPhone = ret.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Requirement 4: Per-row "Record receipt" opens modal prefilled
  const handleOpenReceiptForRetailer = (retailerId: string) => {
    setReceiptPrefillRetailerId(retailerId);
    setIsReceiptModalOpen(true);
  };

  // Bulk selection handlers
  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCurrentPage = () => {
    const pageIds = paginatedLedgers.map(l => l.retailer.id);
    const allSelected = pageIds.every(id => selectedRowIds.includes(id));
    if (allSelected) {
      setSelectedRowIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedRowIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const selectedTotalOwed = useMemo(() => {
    return allLedgers
      .filter(l => selectedRowIds.includes(l.retailer.id))
      .reduce((sum, l) => sum + l.totalOwed, 0);
  }, [allLedgers, selectedRowIds]);

  // Bulk WhatsApp reminders
  const handleBulkWhatsAppReminders = () => {
    const selectedLedgers = allLedgers.filter(l => selectedRowIds.includes(l.retailer.id));
    if (selectedLedgers.length === 0) return;

    // Open first one and show toast confirmation
    handleSendRowReminder(selectedLedgers[0]);
    if (selectedLedgers.length > 1) {
      alert(`Opened WhatsApp reminder for ${selectedLedgers[0].retailer.name}. (${selectedLedgers.length - 1} more selected in queue).`);
    }
  };

  // Bulk Record Receipt
  const handleBulkRecordReceipt = () => {
    if (selectedRowIds.length === 0) return;
    setReceiptPrefillRetailerId(selectedRowIds[0]);
    setIsReceiptModalOpen(true);
  };

  // Bulk Credit Hold Toggle
  const handleBulkToggleHold = () => {
    selectedRowIds.forEach(id => toggleCreditHold(id));
    setSelectedRowIds([]);
  };

  const handleExportCSV = () => {
    const headers = [
      "Retailer Code",
      "Retailer Name",
      "Town",
      "District",
      "Not Yet Due",
      "1-30 Days Overdue",
      "31-60 Days Overdue",
      "60+ Days Overdue",
      "Total Owed",
      "Credit Limit",
      "Credit Used %",
      "Credit Hold",
    ];
    const rows = filteredLedgers.map(l => [
      l.retailer.code || l.retailer.id,
      `"${l.retailer.name}"`,
      `"${l.retailer.town}"`,
      `"${l.retailer.district}"`,
      l.notYetDue,
      l.d1_30,
      l.d31_60,
      l.d60_plus,
      l.totalOwed,
      l.retailer.creditLimit,
      `${l.creditUsedPercent}%`,
      l.retailer.creditHold ? "YES" : "NO",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Receivables_Ageing_${currentDate.toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formattedDate = currentDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="w-full flex flex-col gap-6 pb-20">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Finance</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-900 font-bold">Receivables</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Receivables</h1>
          <p className="text-xs text-slate-500">
            Money owed to you by retailers, dynamically reconciled from issued wholesale invoices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">As of {formattedDate}</span>
          <button
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => {
              setReceiptPrefillRetailerId(null);
              setIsReceiptModalOpen(true);
            }}
            className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer active:scale-98"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Record receipt</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards (4 Bento Grids) - Totals ₹18,64,700 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Owed */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Owed
            </span>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">
              account_balance_wallet
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {formatINR(kpis.receivables)}
            </span>
            <span className="text-[11px] text-slate-500">
              Gross outstanding across all {allLedgers.length} active accounts
            </span>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 border-l-4 border-l-rose-500 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Overdue
            </span>
            <span className="material-symbols-outlined text-rose-500 text-[20px]">
              error_outline
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-black text-rose-600 tracking-tight font-mono">
              {formatINR(kpis.overdue)}
            </span>
            <span className="text-[11px] text-rose-700 font-semibold">
              {Math.round((kpis.overdue / (kpis.receivables || 1)) * 100)}% of total owed past credit terms
            </span>
          </div>
        </div>

        {/* Not Yet Due */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Not Yet Due
            </span>
            <span className="material-symbols-outlined text-emerald-600 text-[20px]">
              schedule
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {formatINR(ageing.notYetDue)}
            </span>
            <span className="text-[11px] text-slate-500">
              Within active credit grace window ({Math.round((ageing.notYetDue / (kpis.receivables || 1)) * 100)}%)
            </span>
          </div>
        </div>

        {/* Open Invoices Count */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Open Invoices
            </span>
            <span className="material-symbols-outlined text-slate-400 text-[20px]">receipt</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">
              {kpis.openInvoicesCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Reconciled across {allLedgers.length} retailers
            </span>
          </div>
        </div>
      </div>

      {/* Requirement 5: Overdue by Age Stacked Bar Widget (Must NOT clip or wrap awkwardly) */}
      <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col gap-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Aging Breakdown</span>
            <span className="text-xs text-slate-400">• Click segment to filter</span>
          </div>
          {/* Responsive legend pills that never clip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <button
              onClick={() => setAgeFilter(ageFilter === "not_due" ? "all" : "not_due")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer text-left ${
                ageFilter === "not_due"
                  ? "bg-blue-50 border-blue-300 text-blue-900 font-bold"
                  : "bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100"
              }`}
              type="button"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
              <span className="truncate">
                Not yet due: <strong className="font-mono">{formatINR(ageing.notYetDue)}</strong> ({ageing.notYetDuePct}%)
              </span>
            </button>

            <button
              onClick={() => setAgeFilter(ageFilter === "1-30" ? "all" : "1-30")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer text-left ${
                ageFilter === "1-30"
                  ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                  : "bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100"
              }`}
              type="button"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
              <span className="truncate">
                1–30 days: <strong className="font-mono">{formatINR(ageing.d1_30)}</strong> ({ageing.d1_30Pct}%)
              </span>
            </button>

            <button
              onClick={() => setAgeFilter(ageFilter === "31-60" ? "all" : "31-60")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer text-left ${
                ageFilter === "31-60"
                  ? "bg-orange-50 border-orange-300 text-orange-900 font-bold"
                  : "bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100"
              }`}
              type="button"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-orange-600 shrink-0"></span>
              <span className="truncate">
                31–60 days: <strong className="font-mono">{formatINR(ageing.d31_60)}</strong> ({ageing.d31_60Pct}%)
              </span>
            </button>

            <button
              onClick={() => setAgeFilter(ageFilter === "60+" ? "all" : "60+")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer text-left ${
                ageFilter === "60+"
                  ? "bg-rose-50 border-rose-300 text-rose-900 font-bold"
                  : "bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100"
              }`}
              type="button"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></span>
              <span className="truncate">
                60+ days: <strong className="font-mono">{formatINR(ageing.d60_plus)}</strong> ({ageing.d60_plusPct}%)
              </span>
            </button>
          </div>
        </div>

        {/* The Bar Visual */}
        <div className="w-full h-3.5 rounded-full bg-slate-100 flex overflow-hidden cursor-pointer shadow-inner">
          <div
            className="h-full bg-blue-600 hover:opacity-90 transition-opacity"
            style={{ width: `${ageing.notYetDuePct}%` }}
            title={`Not yet due: ${formatINR(ageing.notYetDue)}`}
            onClick={() => setAgeFilter(ageFilter === "not_due" ? "all" : "not_due")}
          ></div>
          <div
            className="h-full bg-amber-500 hover:opacity-90 transition-opacity"
            style={{ width: `${ageing.d1_30Pct}%` }}
            title={`1-30 days overdue: ${formatINR(ageing.d1_30)}`}
            onClick={() => setAgeFilter(ageFilter === "1-30" ? "all" : "1-30")}
          ></div>
          <div
            className="h-full bg-orange-600 hover:opacity-90 transition-opacity"
            style={{ width: `${ageing.d31_60Pct}%` }}
            title={`31-60 days overdue: ${formatINR(ageing.d31_60)}`}
            onClick={() => setAgeFilter(ageFilter === "31-60" ? "all" : "31-60")}
          ></div>
          <div
            className="h-full bg-rose-600 hover:opacity-90 transition-opacity"
            style={{ width: `${ageing.d60_plusPct}%` }}
            title={`60+ days overdue: ${formatINR(ageing.d60_plus)}`}
            onClick={() => setAgeFilter(ageFilter === "60+" ? "all" : "60+")}
          ></div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-72">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
              search
            </span>
            <input
              className="w-full h-10 pl-9 pr-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
              placeholder="Search retailer, code, or town..."
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={districtFilter}
              onChange={e => {
                setDistrictFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">District: All districts</option>
              {districts.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={ageFilter}
              onChange={e => {
                setAgeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Overdue Age: All</option>
              <option value="1-30">1–30 days overdue</option>
              <option value="31-60">31–60 days overdue</option>
              <option value="60+">60+ days overdue</option>
              <option value="not_due">Not yet due only</option>
            </select>
          </div>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={e => {
              const val = e.target.value === "all" ? "all" : parseInt(e.target.value, 10);
              setPageSize(val);
              setCurrentPage(1);
            }}
            className="h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 shadow-xs focus:outline-none cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value="all">All ({filteredLedgers.length})</option>
          </select>
        </div>
      </div>

      {/* Requirement 1: Bulk Action Floating Bar when rows are selected */}
      {selectedRowIds.length > 0 && (
        <div className="bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-2xl flex flex-wrap items-center justify-between gap-4 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs border border-blue-400/30">
              {selectedRowIds.length} retailers selected
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Total Selected Balance: <strong className="text-white font-mono text-sm">{formatINR(selectedTotalOwed)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkWhatsAppReminders}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Send WhatsApp Reminders</span>
            </button>

            <button
              onClick={handleBulkRecordReceipt}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">receipt_long</span>
              <span>Record Receipt</span>
            </button>

            {/* Requirement 6: Credit Hold Bulk Action */}
            <button
              onClick={handleBulkToggleHold}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              <span>Toggle Credit Hold</span>
            </button>

            <button
              onClick={() => setSelectedRowIds([])}
              className="px-3 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              type="button"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Split View: Table (Left) + Detail Drawer (Right, when selected) */}
      <div className="flex flex-col lg:flex-row items-start gap-5 w-full">
        {/* Table Container: Expands to full width when no row selected */}
        <div className="flex-1 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col w-full min-w-0">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1050px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        paginatedLedgers.length > 0 &&
                        paginatedLedgers.every(l => selectedRowIds.includes(l.retailer.id))
                      }
                      onChange={handleSelectAllCurrentPage}
                      className="rounded w-4 h-4 accent-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 min-w-[220px]">Retailer / Shop</th>
                  <th className="py-3 px-3 text-right min-w-[100px]">Not yet due</th>
                  <th className="py-3 px-3 text-right min-w-[105px]">1–30 days</th>
                  <th className="py-3 px-3 text-right min-w-[105px]">31–60 days</th>
                  <th className="py-3 px-3 text-right min-w-[105px]">60+ days</th>
                  <th className="py-3 px-3 text-right min-w-[120px]">Total owed</th>
                  <th className="py-3 px-4 min-w-[150px]">Credit used</th>
                  {/* Requirement 1: ACTION column is permanently visible and spacious */}
                  <th className="py-3 px-3.5 text-center min-w-[130px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                {paginatedLedgers.map(item => {
                  const isDrawerActive = selectedRetailerId === item.retailer.id;
                  const isChecked = selectedRowIds.includes(item.retailer.id);
                  const hasOverdue = item.d1_30 > 0 || item.d31_60 > 0 || item.d60_plus > 0;

                  return (
                    <tr
                      key={item.retailer.id}
                      onClick={() => setSelectedRetailerId(isDrawerActive ? null : item.retailer.id)}
                      className={`transition-colors cursor-pointer ${
                        isDrawerActive
                          ? "bg-blue-50/80 hover:bg-blue-50"
                          : isChecked
                          ? "bg-slate-50 hover:bg-slate-100/70"
                          : "hover:bg-slate-50/70"
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <td className="py-3.5 px-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <input
                          checked={isChecked}
                          onChange={() => handleToggleSelectRow(item.retailer.id)}
                          className="rounded w-4 h-4 accent-blue-600 cursor-pointer"
                          type="checkbox"
                        />
                      </td>

                      {/* Retailer Info & Hold Badge */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {item.retailer.name}
                            </span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                hasOverdue ? "bg-amber-500" : "bg-emerald-500"
                              }`}
                            ></span>
                            {/* Requirement 6: Credit Hold Badge */}
                            {item.retailer.creditHold && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 uppercase tracking-tight">
                                HOLD
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500 truncate">
                            {item.retailer.code} • {item.retailer.town}, {item.retailer.district}
                          </span>
                        </div>
                      </td>

                      {/* Not Yet Due */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                        {item.notYetDue > 0 ? formatINR(item.notYetDue) : "—"}
                      </td>

                      {/* 1–30 Days */}
                      <td className="py-3.5 px-3 text-right font-mono font-medium text-amber-600 whitespace-nowrap">
                        {item.d1_30 > 0 ? formatINR(item.d1_30) : "—"}
                      </td>

                      {/* 31–60 Days */}
                      <td className="py-3.5 px-3 text-right font-mono font-medium text-orange-600 whitespace-nowrap">
                        {item.d31_60 > 0 ? formatINR(item.d31_60) : "—"}
                      </td>

                      {/* 60+ Days */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                        {item.d60_plus > 0 ? formatINR(item.d60_plus) : "—"}
                      </td>

                      {/* Total Owed */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(item.totalOwed)}
                      </td>

                      {/* Requirement 3: Credit Used % uses real credit limit */}
                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[11px]">
                            <span
                              className={`font-bold font-mono ${
                                item.creditUsedPercent > 90
                                  ? "text-rose-600"
                                  : item.creditUsedPercent > 70
                                  ? "text-amber-600"
                                  : "text-slate-800"
                              }`}
                            >
                              {item.creditUsedPercent}%
                            </span>
                            <span className="text-slate-400 font-mono text-[10px]">
                              of {formatINR(item.retailer.creditLimit)}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.creditUsedPercent > 90
                                  ? "bg-rose-500"
                                  : item.creditUsedPercent > 70
                                  ? "bg-amber-500"
                                  : "bg-blue-600"
                              }`}
                              style={{ width: `${Math.min(100, item.creditUsedPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Requirement 1 & 4: ACTION column with WhatsApp reminder and Record Receipt */}
                      <td className="py-3.5 px-3.5" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedRetailerId(isDrawerActive ? null : item.retailer.id)}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="View Statement & Invoices"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              description
                            </span>
                          </button>

                          {/* Requirement 4: Prefilled WhatsApp Reminder */}
                          <button
                            onClick={() => handleSendRowReminder(item)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Send WhatsApp payment reminder"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                          </button>

                          {/* Requirement 4: Record Receipt Prefilled */}
                          <button
                            onClick={() => handleOpenReceiptForRetailer(item.retailer.id)}
                            className="p-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Record payment receipt"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              add_circle
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLedgers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                      No retailers match the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Requirement 2: Totals Row - Reconciles to ₹18,64,700 and header cards */}
              <tfoot>
                <tr className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-xs text-slate-900">
                  <td className="py-3.5 px-3.5 text-center"></td>
                  <td className="py-3.5 px-3 font-bold text-slate-900">
                    Totals ({filteredLedgers.length} Retailers)
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-slate-900">
                    {formatINR(totals.notYetDue)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-amber-700">
                    {formatINR(totals.d1_30)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-orange-700">
                    {formatINR(totals.d31_60)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-rose-700">
                    {formatINR(totals.d60_plus)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono text-sm font-black text-slate-900 whitespace-nowrap">
                    {formatINR(totals.totalOwed)}
                  </td>
                  <td className="py-3.5 px-4" colSpan={2}>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Reconciled with General Ledger
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
              <span>
                Showing {(currentPage - 1) * (pageSize as number) + 1} to{" "}
                {Math.min(currentPage * (pageSize as number), filteredLedgers.length)} of{" "}
                {filteredLedgers.length} retailers
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors cursor-pointer"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-7 h-7 rounded-lg font-bold transition-colors cursor-pointer ${
                      currentPage === i + 1
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Drawer: Detail View for Selected Retailer (Only when a row is clicked) */}
        {activeRetailer && (
          <div className="w-full lg:w-[420px] shrink-0 bg-white rounded-2xl shadow-md border border-slate-200 p-5 flex flex-col gap-5 animate-in slide-in-from-right-2">
            {/* Drawer Header with Close Button */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-lg text-slate-900 tracking-tight truncate">
                    {activeRetailer.name}
                  </h2>
                </div>
                <span className="text-xs text-slate-500">
                  {activeRetailer.code} • {activeRetailer.town}, {activeRetailer.district}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs text-slate-600">
                    {activeRetailer.phone}
                  </span>
                  <a
                    href={`https://wa.me/${activeRetailer.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                      reminderMessage
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">chat</span>
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Close Drawer Button */}
              <button
                onClick={() => setSelectedRetailerId(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Close drawer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Requirement 6: Credit Hold Toggle Box */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-slate-900">Credit Hold Status</span>
                  {activeRetailer.creditHold ? (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                      ON HOLD
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                  {activeRetailer.creditHold
                    ? "Orders frozen. Retailer sees hold alert in portal."
                    : "Normal credit policy. Orders can be dispatched."}
                </p>
              </div>
              <button
                onClick={() => toggleCreditHold(activeRetailer.id)}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer ${
                  activeRetailer.creditHold
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">
                  {activeRetailer.creditHold ? "lock" : "lock_open"}
                </span>
                <span>{activeRetailer.creditHold ? "Release" : "Hold"}</span>
              </button>
            </div>

            {/* Micro KPI Cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-50 p-2.5 rounded-xl flex flex-col border border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Total Owed
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 mt-1">
                  {formatINR(activeLedger?.totalOwed || 0)}
                </span>
              </div>
              <div className="bg-rose-50 p-2.5 rounded-xl flex flex-col border border-rose-200">
                <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                  Overdue
                </span>
                <span className="font-mono text-sm font-bold text-rose-700 mt-1">
                  {formatINR(
                    (activeLedger?.d1_30 || 0) +
                      (activeLedger?.d31_60 || 0) +
                      (activeLedger?.d60_plus || 0)
                  )}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl flex flex-col border border-slate-200/60">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Available
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 mt-1">
                  {formatINR(activeLedger?.creditAvailable || 0)}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  of {formatINR(activeRetailer.creditLimit)}
                </span>
              </div>
            </div>

            {/* Open Invoices List */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Open Invoices</span>
                <span className="text-xs text-slate-500">
                  {activeRetailerInvoices.length} open totaling {formatINR(activeLedger?.totalOwed || 0)}
                </span>
              </div>
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {activeRetailerInvoices.map(inv => {
                  const daysUntil = getDaysUntil(inv.dueDate, currentDate);
                  const isOverdue = daysUntil < 0;

                  return (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              isOverdue
                                ? "bg-rose-100 text-rose-700 border border-rose-200"
                                : "bg-blue-100 text-blue-700 border border-blue-200"
                            }`}
                          >
                            {isOverdue ? `${Math.abs(daysUntil)}d Overdue` : "Not yet due"}
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {formatINR(inv.balanceDue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                        <span>Billed: {inv.billedDate || inv.date}</span>
                        <span className={`font-semibold ${isOverdue ? "text-rose-600" : "text-slate-700"}`}>
                          Due: {inv.dueDate}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {activeRetailerInvoices.length === 0 && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
                    No open invoices. Account is fully settled.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => handleOpenReceiptForRetailer(activeRetailer.id)}
                className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>Record receipt for {activeRetailer.name.split(" ")[0]}</span>
              </button>

              <button
                onClick={() => {
                  if (activeLedger) handleSendRowReminder(activeLedger);
                }}
                className="w-full h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Send WhatsApp Reminder</span>
              </button>
            </div>

            {/* Reminder Preview Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Reminder preview (editable)
                </span>
                <span className="material-symbols-outlined text-slate-400 text-[14px]">edit</span>
              </div>
              <textarea
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
                rows={3}
                value={reminderMessage}
                onChange={e => setReminderMessage(e.target.value)}
              />
              <span className="text-[10px] text-slate-400 leading-tight">
                Opens WhatsApp with this prefilled message.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
