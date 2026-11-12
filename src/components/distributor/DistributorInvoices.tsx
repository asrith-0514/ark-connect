"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  Invoice,
  formatINR,
  getDaysUntil,
  downloadInvoicePDF,
} from "@/lib/mock";

type SortField = "invoiceNumber" | "date" | "dueDate" | "retailerName" | "grandTotal" | "balanceDue" | "status";
type SortOrder = "asc" | "desc";

// Helper to derive true invoice status dynamically from data per Requirement 1
export function deriveInvoiceStatus(
  inv: Invoice,
  today: Date
): "Draft" | "Paid" | "Partly Paid" | "Overdue" | "Issued" {
  if (inv.status === "Draft") return "Draft";
  if (inv.balanceDue === 0) return "Paid";
  if (inv.balanceDue > 0 && inv.balanceDue < inv.grandTotal) {
    const isPastDue = getDaysUntil(inv.dueDate, today) < 0;
    return isPastDue ? "Overdue" : "Partly Paid";
  }
  const isPastDue = getDaysUntil(inv.dueDate, today) < 0;
  return isPastDue ? "Overdue" : "Issued";
}

export const DistributorInvoices: React.FC = () => {
  const {
    invoices,
    retailers,
    orders,
    setViewingInvoice,
    addInvoice,
    currentDate,
  } = useApp();

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");

  // Sorting: Default sort OVERDUE FIRST per Requirement 1
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [isOverdueFirst, setIsOverdueFirst] = useState(true);

  // Selection state
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());

  // Create Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>("ret-1");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [invoiceDueDays, setInvoiceDueDays] = useState<number>(30);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0);
  const [isDraftMode, setIsDraftMode] = useState<boolean>(true);

  // Quick feedback toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Derive status for all invoices
  const invoicesWithStatus = useMemo(() => {
    return invoices.map(inv => ({
      ...inv,
      derivedStatus: deriveInvoiceStatus(inv, currentDate),
    }));
  }, [invoices, currentDate]);

  // Counts for KPI tabs
  const overdueCount = useMemo(
    () => invoicesWithStatus.filter(i => i.derivedStatus === "Overdue").length,
    [invoicesWithStatus]
  );
  const openCount = useMemo(
    () => invoicesWithStatus.filter(i => i.derivedStatus !== "Paid" && i.derivedStatus !== "Draft").length,
    [invoicesWithStatus]
  );
  const draftCount = useMemo(
    () => invoicesWithStatus.filter(i => i.derivedStatus === "Draft").length,
    [invoicesWithStatus]
  );

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoicesWithStatus.filter(inv => {
      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter === "open" && (inv.derivedStatus === "Paid" || inv.derivedStatus === "Draft")) {
          return false;
        } else if (statusFilter !== "open" && inv.derivedStatus.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.orderNumber.toLowerCase().includes(q) ||
          inv.retailerName.toLowerCase().includes(q) ||
          inv.retailerTown.toLowerCase().includes(q) ||
          (inv.retailerGstin && inv.retailerGstin.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Date range filter
      if (dateRange !== "all") {
        const invDate = new Date(inv.billedDate || inv.date);
        const diffDays = Math.floor((currentDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
        if (dateRange === "30" && diffDays > 30) return false;
        if (dateRange === "90" && diffDays > 90) return false;
      }

      return true;
    });
  }, [invoicesWithStatus, statusFilter, searchQuery, dateRange, currentDate]);

  // Sorted Invoices: OVERDUE FIRST by default per Requirement 1
  const sortedInvoices = useMemo(() => {
    const list = [...filteredInvoices];

    list.sort((a, b) => {
      // Overdue first logic
      if (isOverdueFirst) {
        const aOverdue = a.derivedStatus === "Overdue";
        const bOverdue = b.derivedStatus === "Overdue";
        if (aOverdue && !bOverdue) return -1;
        if (!aOverdue && bOverdue) return 1;

        // Open/Unpaid next
        const aOpen = a.balanceDue > 0 && a.derivedStatus !== "Draft";
        const bOpen = b.balanceDue > 0 && b.derivedStatus !== "Draft";
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
      }

      let valA: any = a[sortField] ?? "";
      let valB: any = b[sortField] ?? "";

      if (sortField === "grandTotal" || sortField === "balanceDue") {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortField === "date" || sortField === "dueDate") {
        valA = new Date(valA).getTime() || 0;
        valB = new Date(valB).getTime() || 0;
      } else if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = (valB as string).toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredInvoices, isOverdueFirst, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.size === sortedInvoices.length) {
      setSelectedInvoiceIds(new Set());
    } else {
      setSelectedInvoiceIds(new Set(sortedInvoices.map(i => i.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedInvoiceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Create new invoice handler
  const handleCreateInvoice = () => {
    const retailer = retailers.find(r => r.id === selectedRetailerId) || retailers[0];
    const nextNum = Math.floor(100 + invoices.length + 1);
    const invoiceNumber = `INV-0${nextNum}`;
    const orderNumber = selectedOrderId || `ARK-${8800 + invoices.length}`;

    const billedDateStr = currentDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const dueDateObj = new Date(currentDate);
    dueDateObj.setDate(dueDateObj.getDate() + invoiceDueDays);
    const dueDateStr = dueDateObj.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const isIntraState = !retailer.gstin || retailer.gstin.startsWith("36");
    const subtotal = 25000;
    const taxableValue = Math.max(0, subtotal - invoiceDiscount);
    const cgst = isIntraState ? Math.round(taxableValue * 0.025 * 100) / 100 : 0;
    const sgst = isIntraState ? Math.round(taxableValue * 0.025 * 100) / 100 : 0;
    const igst = !isIntraState ? Math.round(taxableValue * 0.05 * 100) / 100 : 0;
    const grandTotal = taxableValue + cgst + sgst + igst;

    const newInv: Invoice = {
      id: `inv-new-${Date.now()}`,
      invoiceNumber,
      orderNumber,
      retailerId: retailer.id,
      retailerName: retailer.name,
      retailerTown: retailer.town,
      retailerGstin: retailer.gstin,
      billedDate: billedDateStr,
      date: billedDateStr,
      dueDate: dueDateStr,
      creditDays: invoiceDueDays,
      status: isDraftMode ? "Draft" : "Issued",
      subtotal,
      discount: invoiceDiscount,
      taxableValue,
      taxRatePercent: 5,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      roundOff: 0,
      grandTotal,
      total: grandTotal,
      paid: 0,
      balanceDue: grandTotal,
      items: [
        {
          description: "Combed Cotton Rib Vest RN75",
          variant: "Classic White / Pack of 10",
          brand: "Flybirds",
          hsn: "61091000",
          boxes: 40,
          rate: 350,
          amount: 14000,
        },
        {
          description: "Cotton Boxer Briefs",
          variant: "Ink Navy / Pack of 6",
          brand: "Flybirds",
          hsn: "61071100",
          boxes: 30,
          rate: 366.67,
          amount: 11000,
        },
      ],
    };

    addInvoice(newInv);
    setIsCreateModalOpen(false);
    showToast(
      isDraftMode
        ? `Created Draft Invoice ${invoiceNumber} (Editable, invisible to retailers)`
        : `Issued Tax Invoice ${invoiceNumber} for ${retailer.name}`
    );
  };

  return (
    <div className="w-full flex flex-col gap-5 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      {/* Top Breadcrumb Context */}
      <div className="flex items-center justify-between py-0.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="hover:text-slate-800 transition-colors cursor-pointer">Finance</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-slate-900 font-bold">Tax Invoices</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsOverdueFirst(!isOverdueFirst)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isOverdueFirst
                ? "bg-rose-50 text-rose-700 border border-rose-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {isOverdueFirst ? "priority_high" : "sort"}
            </span>
            <span>Overdue First: {isOverdueFirst ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tax Invoices</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {invoices.length} Invoices
            </span>
            {overdueCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {overdueCount} Overdue
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Generated B2B GST tax invoices for wholesale dispatches across Telangana &amp; Andhra Pradesh.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Create invoice
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap lg:flex-nowrap items-center gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[240px] relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
            search
          </span>
          <input
            className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            placeholder="Search invoice #, PO #, retailer name, town, GSTIN..."
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="overdue">Overdue ({overdueCount})</option>
            <option value="open">Open / Unpaid ({openCount})</option>
            <option value="partly paid">Partly Paid</option>
            <option value="issued">Issued / Due Soon</option>
            <option value="paid">Paid</option>
            <option value="draft">Drafts ({draftCount})</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="h-10 px-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="all">Date: All Time</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>

          {(searchQuery || statusFilter !== "all" || dateRange !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setDateRange("all");
              }}
              className="h-10 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              type="button"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* INVOICES TABLE (Requirement 1: Due date & Balance columns, nowrap dates) */}
      <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {sortedInvoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No tax invoices found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider select-none">
                  <th className="py-3.5 pl-4 pr-2 w-10">
                    <input
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                      type="checkbox"
                      checked={selectedInvoiceIds.size > 0 && selectedInvoiceIds.size === sortedInvoices.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th
                    className="py-3.5 px-3 whitespace-nowrap cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("invoiceNumber")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Invoice #</span>
                      {sortField === "invoiceNumber" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-3 whitespace-nowrap">PO Ref #</th>
                  <th
                    className="py-3.5 px-4 whitespace-nowrap cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("retailerName")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Retailer / Shop</span>
                      {sortField === "retailerName" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 whitespace-nowrap cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("date")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Billed Date</span>
                      {sortField === "date" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  {/* Due Date Column Requirement 1 */}
                  <th
                    className="py-3.5 px-3 whitespace-nowrap cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("dueDate")}
                  >
                    <div className="flex items-center gap-1">
                      <span>Due Date</span>
                      {sortField === "dueDate" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 whitespace-nowrap text-right cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("grandTotal")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Grand Total</span>
                      {sortField === "grandTotal" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  {/* Balance Column Requirement 1 */}
                  <th
                    className="py-3.5 px-3 whitespace-nowrap text-right cursor-pointer hover:text-slate-900"
                    onClick={() => handleSort("balanceDue")}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Balance Due</span>
                      {sortField === "balanceDue" && (
                        <span className="material-symbols-outlined text-[14px]">
                          {sortOrder === "asc" ? "arrow_upward" : "arrow_downward"}
                        </span>
                      )}
                    </div>
                  </th>
                  {/* Status Derived From Data Requirement 1 */}
                  <th className="py-3.5 px-3 whitespace-nowrap">Status</th>
                  <th className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                {sortedInvoices.map(inv => {
                  const status = inv.derivedStatus;
                  const isOverdue = status === "Overdue";
                  const isPaid = status === "Paid";
                  const isDraft = status === "Draft";
                  const isSelected = selectedInvoiceIds.has(inv.id);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => setViewingInvoice(inv)}
                      className={`transition-colors cursor-pointer group ${
                        isOverdue
                          ? "bg-rose-50/40 hover:bg-rose-50/70"
                          : isSelected
                          ? "bg-blue-50/60"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      <td className="py-3.5 pl-4 pr-2" onClick={e => e.stopPropagation()}>
                        <input
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(inv.id)}
                        />
                      </td>

                      {/* Invoice # */}
                      <td className="py-3.5 px-3 font-mono text-xs font-bold text-blue-700 whitespace-nowrap">
                        {inv.invoiceNumber}
                      </td>

                      {/* PO Ref */}
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                        #{inv.orderNumber}
                      </td>

                      {/* Retailer */}
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {inv.retailerName}
                          </span>
                          <span className="text-xs text-slate-400">
                            {inv.retailerTown} · <span className="font-mono">{inv.retailerGstin}</span>
                          </span>
                        </div>
                      </td>

                      {/* Billed Date (Nowrap) */}
                      <td className="py-3.5 px-3 font-mono text-xs text-slate-600 whitespace-nowrap">
                        {inv.billedDate || inv.date}
                      </td>

                      {/* Due Date (Nowrap, highlighted red if overdue) */}
                      <td className="py-3.5 px-3 font-mono text-xs whitespace-nowrap">
                        {isOverdue ? (
                          <div className="flex items-center gap-1 text-rose-700 font-bold">
                            <span className="material-symbols-outlined text-[15px]">warning</span>
                            <span>{inv.dueDate}</span>
                          </div>
                        ) : isPaid ? (
                          <span className="text-slate-400 line-through">{inv.dueDate}</span>
                        ) : (
                          <span className="text-slate-700 font-medium">{inv.dueDate}</span>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {formatINR(inv.grandTotal || inv.total)}
                      </td>

                      {/* Balance Due (Requirement 1) */}
                      <td className="py-3.5 px-3 text-right font-mono whitespace-nowrap">
                        {isPaid ? (
                          <span className="text-slate-400 font-medium">₹0</span>
                        ) : isOverdue ? (
                          <span className="text-rose-700 font-bold text-sm">
                            {formatINR(inv.balanceDue)}
                          </span>
                        ) : (
                          <span className="text-blue-700 font-bold">
                            {formatINR(inv.balanceDue)}
                          </span>
                        )}
                      </td>

                      {/* Status Badge (Derived from data) */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : isOverdue
                              ? "bg-rose-100 text-rose-900 border border-rose-300 font-black animate-pulse"
                              : status === "Partly Paid"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : isDraft
                              ? "bg-slate-200 text-slate-700 border border-slate-300"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {status}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 pr-4 pl-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => downloadInvoicePDF(inv)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Download PDF"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </button>
                          <button
                            onClick={() => setViewingInvoice(inv)}
                            className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                            type="button"
                          >
                            {isDraft ? "Edit Draft" : "View"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE INVOICE MODAL (Requirement 1 & 2) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create Tax Invoice</h3>
                <p className="text-xs text-slate-500">
                  Generate a wholesale GST tax invoice or draft for order fulfillment.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Select Retailer */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Retailer Partner *</label>
                <select
                  value={selectedRetailerId}
                  onChange={e => setSelectedRetailerId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {retailers
                    .filter(r => r.status === "Active")
                    .map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.code}) · {r.town}
                      </option>
                    ))}
                </select>
              </div>

              {/* Order Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">PO Reference #</label>
                  <select
                    value={selectedOrderId}
                    onChange={e => setSelectedOrderId(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Manual / No PO</option>
                    {orders
                      .filter(o => o.status !== "Cancelled")
                      .map(o => (
                        <option key={o.id} value={o.orderNumber}>
                          #{o.orderNumber} ({o.retailerName})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Payment Credit Terms</label>
                  <select
                    value={invoiceDueDays}
                    onChange={e => setInvoiceDueDays(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={15}>15 Days Net</option>
                    <option value={30}>30 Days Net (Standard)</option>
                    <option value={45}>45 Days Net</option>
                    <option value={60}>60 Days Net</option>
                  </select>
                </div>
              </div>

              {/* Trade Discount */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Trade Discount (₹)</label>
                <input
                  type="number"
                  value={invoiceDiscount}
                  onChange={e => setInvoiceDiscount(Number(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="0"
                />
              </div>

              {/* Mode Selection per Requirement 2: Draft invoices are editable & invisible to retailers */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-500 block">
                  Invoice Status Option
                </span>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invMode"
                      checked={isDraftMode}
                      onChange={() => setIsDraftMode(true)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Save as Draft (Editable · Invisible to retailer)
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invMode"
                      checked={!isDraftMode}
                      onChange={() => setIsDraftMode(false)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Issue Immediately (Posts to retailer ledger)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateInvoice}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{isDraftMode ? "Save Draft Invoice" : "Issue Tax Invoice"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DistributorInvoices;

