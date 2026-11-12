"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { isDemoModeEnabled, formatINR, getDaysUntil } from "@/lib/mock";

interface DistributorReceiptModalProps {
  onClose?: () => void;
  initialRetailerId?: string;
}

export const DistributorReceiptModal: React.FC<DistributorReceiptModalProps> = ({
  onClose,
  initialRetailerId,
}) => {
  const {
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    recordReceipt,
    invoices,
    retailers,
    receiptPrefillRetailerId,
    setReceiptPrefillRetailerId,
    currentDate,
  } = useApp();

  // Selected Retailer (Prefilled from row if launched from a retailer row, else default or first active)
  const [selectedRetailerId, setSelectedRetailerId] = useState<string>(() => {
    return initialRetailerId || receiptPrefillRetailerId || "RET-0001";
  });

  // Requirement 4: A new receipt starts empty! Demo values go behind the demo flag.
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [receivedDate, setReceivedDate] = useState<string>(() =>
    currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  );
  const [paymentMethod, setPaymentMethod] = useState<"Bank transfer" | "UPI" | "Cash" | "Cheque">("UPI");
  const [referenceNumber, setReferenceNumber] = useState<string>("");
  const [staffNotes, setStaffNotes] = useState<string>("");

  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState<boolean>(false);

  // Invoices allocation state (starts empty)
  const [allocations, setAllocations] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    setIsDemo(isDemoModeEnabled());
  }, []);

  useEffect(() => {
    if (receiptPrefillRetailerId) {
      setSelectedRetailerId(receiptPrefillRetailerId);
    }
  }, [receiptPrefillRetailerId]);

  const activeRetailer = useMemo(() => {
    return (
      retailers.find(
        r =>
          r.id === selectedRetailerId ||
          r.code === selectedRetailerId ||
          r.name.toLowerCase().includes(selectedRetailerId.toLowerCase())
      ) || retailers[0]
    );
  }, [retailers, selectedRetailerId]);

  // Requirement 8: Totals count ISSUED invoices only (Draft invoices excluded)
  // Sorted oldest due date first
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

  // Total open balance for this retailer (Requirement 8: RET-0001 is exactly ₹54,200)
  const totalOpenBalance = useMemo(() => {
    return activeRetailerInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
  }, [activeRetailerInvoices]);

  // When retailer changes, reset allocations
  useEffect(() => {
    setAllocations({});
    setSimulateError(false);
  }, [selectedRetailerId]);

  // Calculate allocation totals
  const totalApplied = Object.values(allocations).reduce((sum, val) => sum + (val || 0), 0);
  const effectiveApplied = simulateError ? totalApplied + 2000 : totalApplied;
  const leftToApply = amountReceived - effectiveApplied;

  // Requirement 7: Reject over-application & future dates
  const isOverApplied = effectiveApplied > amountReceived;

  // Check if any invoice is individually over-allocated beyond its balance
  const hasInvoiceOverAllocation = useMemo(() => {
    return activeRetailerInvoices.some(inv => (allocations[inv.id] || 0) > inv.balanceDue);
  }, [activeRetailerInvoices, allocations]);

  // Requirement 7: App clock validation - reject future dates
  const isFutureDate = useMemo(() => {
    try {
      const parsed = new Date(receivedDate);
      if (isNaN(parsed.getTime())) return false;
      // Compare calendar date only
      const targetTime = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime();
      const nowTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
      return targetTime > nowTime;
    } catch {
      return false;
    }
  }, [receivedDate, currentDate]);

  // Requirement 7: Unapplied amount kept as advance
  const advanceAmount = Math.max(0, amountReceived - effectiveApplied);

  const handleAllocationChange = (invId: string, val: string) => {
    const num = Math.max(0, parseFloat(val) || 0);
    setAllocations(prev => ({
      ...prev,
      [invId]: num,
    }));
  };

  // Requirement 4: Behind the demo flag - Load demo values
  const handleLoadDemoValues = () => {
    setSelectedRetailerId("RET-0001");
    setAmountReceived(40000);
    setReferenceNumber("UPI-512208");
    setStaffNotes("Paid via PhonePe QR at counter");
    setPaymentMethod("UPI");
    setReceivedDate(
      currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    );

    // Auto-allocate oldest first for RET-0001
    // INV-0079 has ₹31,000 overdue -> gets ₹31,000
    // Remaining ₹9,000 applied to INV-0094 (has ₹23,200)
    let remaining = 40000;
    const demoAlloc: { [id: string]: number } = {};
    activeRetailerInvoices.forEach(inv => {
      if (remaining > 0) {
        const canPay = Math.min(remaining, inv.balanceDue);
        demoAlloc[inv.id] = canPay;
        remaining -= canPay;
      } else {
        demoAlloc[inv.id] = 0;
      }
    });
    setAllocations(demoAlloc);
  };

  const applyOldestFirst = () => {
    if (amountReceived <= 0) return;
    let remaining = amountReceived;
    const newAlloc: { [id: string]: number } = {};

    activeRetailerInvoices.forEach(inv => {
      if (remaining > 0) {
        const canPay = Math.min(remaining, inv.balanceDue);
        newAlloc[inv.id] = canPay;
        remaining -= canPay;
      } else {
        newAlloc[inv.id] = 0;
      }
    });

    setAllocations(newAlloc);
    setSimulateError(false);
  };

  const clearAllAllocations = () => {
    const cleared: { [id: string]: number } = {};
    activeRetailerInvoices.forEach(inv => {
      cleared[inv.id] = 0;
    });
    setAllocations(cleared);
    setSimulateError(false);
  };

  // Requirement 9: Save receipt and synchronize all state
  const handleSaveReceipt = () => {
    if (isOverApplied || hasInvoiceOverAllocation || isFutureDate || amountReceived <= 0) return;

    recordReceipt(
      activeRetailer.id,
      amountReceived,
      paymentMethod,
      referenceNumber || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
      allocations
    );

    setShowConfirmModal(false);
    if (onClose) onClose();
    else setIsReceiptModalOpen(false);
    setReceiptPrefillRetailerId(null);
  };

  // Projections
  const currentOverdue = useMemo(() => {
    return activeRetailerInvoices
      .filter(inv => getDaysUntil(inv.dueDate, currentDate) < 0)
      .reduce((sum, inv) => sum + inv.balanceDue, 0);
  }, [activeRetailerInvoices, currentDate]);

  const projectedOverdue = useMemo(() => {
    return activeRetailerInvoices
      .filter(inv => getDaysUntil(inv.dueDate, currentDate) < 0)
      .reduce((sum, inv) => {
        const applied = allocations[inv.id] || 0;
        return sum + Math.max(0, inv.balanceDue - applied);
      }, 0);
  }, [activeRetailerInvoices, allocations, currentDate]);

  const creditLimit = activeRetailer?.creditLimit || 150000;
  const currentOutstanding = totalOpenBalance;
  const currentAvailable = Math.max(0, creditLimit - currentOutstanding);
  const projectedOutstanding = Math.max(0, currentOutstanding - effectiveApplied);
  const projectedAvailable = Math.min(creditLimit, Math.max(0, creditLimit - projectedOutstanding));

  if (!isReceiptModalOpen && onClose === undefined) {
    return null;
  }

  return (
    <div className="w-full flex flex-col gap-5 pb-16">
      {/* Top Action Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button
              onClick={() => {
                if (onClose) onClose();
                else setIsReceiptModalOpen(false);
                setReceiptPrefillRetailerId(null);
              }}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Finance
            </button>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-slate-900 font-bold">Record Receipt</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Record Receipt</h1>
          <p className="text-xs text-slate-500">
            Post verified customer payment vouchers against open wholesale invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Requirement 4: Demo Values behind Demo Flag */}
          {isDemo && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadDemoValues}
                className="h-10 px-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                type="button"
                title="Populate demo values for Sri Laxmi Narasimha Textiles (RET-0001, ₹40k)"
              >
                <span className="material-symbols-outlined text-[16px]">science</span>
                <span>Load Demo (RET-0001 · ₹40,000)</span>
              </button>

              <button
                onClick={() => setSimulateError(!simulateError)}
                className="h-10 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {simulateError ? "toggle_on" : "toggle_off"}
                </span>
                <span>Simulate Error</span>
              </button>
            </div>
          )}

          <button
            onClick={() => {
              if (onClose) onClose();
              else setIsReceiptModalOpen(false);
              setReceiptPrefillRetailerId(null);
            }}
            className="h-10 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isOverApplied || hasInvoiceOverAllocation || isFutureDate || amountReceived <= 0}
            className={`h-10 px-5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              isOverApplied || hasInvoiceOverAllocation || isFutureDate || amountReceived <= 0
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-blue-600 hover:bg-blue-700 text-white active:scale-98"
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>Save Receipt</span>
          </button>
        </div>
      </div>

      {/* Validation Alert Banners (Requirement 7) */}
      {isFutureDate && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
          <span className="material-symbols-outlined text-rose-600 text-[18px]">error</span>
          <span>
            Receipt date cannot be in the future. (Current application clock:{" "}
            {currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})
          </span>
        </div>
      )}

      {isOverApplied && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold">
          <span className="material-symbols-outlined text-rose-600 text-[18px]">error</span>
          <span>
            Total allocated amount ({formatINR(effectiveApplied)}) exceeds amount received ({formatINR(amountReceived)}). Reduce allocated amounts.
          </span>
        </div>
      )}

      {hasInvoiceOverAllocation && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
          <span className="material-symbols-outlined text-amber-700 text-[18px]">warning</span>
          <span>
            One or more invoices have applied amounts exceeding their balance due. Cap allocation to the invoice balance.
          </span>
        </div>
      )}

      {/* Advance Notice (Requirement 7) */}
      {amountReceived > 0 && advanceAmount > 0 && !isOverApplied && !hasInvoiceOverAllocation && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[18px]">account_balance_wallet</span>
            <span>
              Unapplied Advance: {formatINR(advanceAmount)} will remain as advance credit on {activeRetailer.name}&apos;s ledger.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
            Applied: {formatINR(effectiveApplied)} of {formatINR(amountReceived)}
          </span>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Receipt Entry & Invoices Allocation */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* CARD 1: Receipt Details */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <span className="material-symbols-outlined text-[18px]">receipt</span>
                </span>
                <h2 className="text-sm font-bold text-slate-900">Receipt Details</h2>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                Direct Voucher
              </span>
            </div>

            {/* Retailer Selector Field */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Retail Partner *
              </label>
              <select
                value={selectedRetailerId}
                onChange={e => setSelectedRetailerId(e.target.value)}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {retailers
                  .filter(r => r.status === "Active")
                  .map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code}) · {r.town} · Outstanding: {formatINR(r.outstanding)}
                    </option>
                  ))}
              </select>
            </div>

            {/* Grid: Amount & Received Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Amount Input with Live formatINR Preview (Requirement 5) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Amount Received (₹) *</label>
                  {amountReceived > 0 && (
                    <span className="font-mono text-xs font-bold text-blue-700">
                      {formatINR(amountReceived)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">
                    ₹
                  </span>
                  <input
                    className="w-full h-10 pl-8 pr-3 rounded-xl bg-slate-50 border border-slate-200 font-mono font-bold text-sm text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                    type="number"
                    placeholder="Enter amount..."
                    value={amountReceived === 0 ? "" : amountReceived}
                    onChange={e => setAmountReceived(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>

              {/* Received On Date */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Received On *</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px]">
                    calendar_today
                  </span>
                  <input
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                    type="text"
                    value={receivedDate}
                    onChange={e => setReceivedDate(e.target.value)}
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  App clock: {currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
              <div className="grid grid-cols-4 p-1 rounded-xl bg-slate-100 gap-1 text-xs">
                {(["UPI", "Bank transfer", "Cash", "Cheque"] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`h-9 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === method
                        ? "bg-white text-blue-700 font-bold shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                    type="button"
                  >
                    <span>{method}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Number & Staff Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Reference / UTR Number
                </label>
                <input
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. UPI-512208 or NEFT ref"
                  type="text"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Staff Notes (Optional)
                </label>
                <input
                  className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="e.g. Paid via PhonePe QR at counter"
                  type="text"
                  value={staffNotes}
                  onChange={e => setStaffNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* CARD 2: Apply to Open Invoices (Requirement 6: Table nowrap & wider columns) */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Apply to Open Invoices</h2>
                <p className="text-xs text-slate-500">
                  Allocates received amount against unpaid and overdue tax invoices.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={applyOldestFirst}
                  disabled={amountReceived <= 0}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    amountReceived <= 0
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                  }`}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[15px]">auto_fix_high</span>
                  <span>Apply Oldest First</span>
                </button>
                <button
                  onClick={clearAllAllocations}
                  className="h-8 px-2.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  type="button"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Invoices Table with Requirement 6: Nowrap dates and invoice numbers */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">Invoice #</th>
                    <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">Billed Date</th>
                    <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">Due Date</th>
                    <th className="py-2.5 px-3 min-w-[100px] whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap text-right">Balance Due</th>
                    <th className="py-2.5 px-3 min-w-[140px] whitespace-nowrap text-right">Apply Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeRetailerInvoices.map(inv => {
                    const daysUntil = getDaysUntil(inv.dueDate, currentDate);
                    const isOverdue = daysUntil < 0;
                    const allocated = allocations[inv.id] || 0;
                    const isOverAllocated = allocated > inv.balanceDue;

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                          {inv.date || inv.billedDate}
                        </td>
                        <td className="py-3 px-3 font-mono whitespace-nowrap">
                          {isOverdue ? (
                            <span className="text-rose-700 font-bold flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">warning</span>
                              <span>{inv.dueDate}</span>
                            </span>
                          ) : (
                            <span className="text-slate-700">{inv.dueDate}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isOverdue
                                ? "bg-rose-100 text-rose-900 border border-rose-200"
                                : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {isOverdue ? `Overdue (${Math.abs(daysUntil)}d)` : "Not yet due"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatINR(inv.balanceDue)}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="relative inline-flex items-center w-full max-w-[130px]">
                            <span className="absolute left-2.5 text-slate-400 font-mono text-xs">₹</span>
                            <input
                              className={`w-full h-8 pl-6 pr-2 rounded-lg text-right font-mono text-xs font-bold transition-all focus:outline-none ${
                                isOverAllocated
                                  ? "bg-rose-50 border border-rose-300 text-rose-700 focus:ring-2 focus:ring-rose-500/20"
                                  : "bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                              }`}
                              type="number"
                              value={allocations[inv.id] || 0}
                              onChange={e => handleAllocationChange(inv.id, e.target.value)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {activeRetailerInvoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No open issued invoices for this retailer. Account is settled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Breakdown & Totals Footer (Requirement 8) */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Total Open Invoices:</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatINR(totalOpenBalance)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Applied:</span>
                  <span className="font-mono font-bold text-blue-700">
                    {formatINR(effectiveApplied)}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                    leftToApply < 0
                      ? "bg-rose-100 text-rose-900 font-bold"
                      : "bg-slate-200 text-slate-800"
                  }`}
                >
                  <span>Unapplied:</span>
                  <span className="font-mono font-bold">
                    {leftToApply < 0 ? `- ${formatINR(Math.abs(leftToApply))}` : formatINR(leftToApply)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Projection Impact (Requirement 9) */}
        <div className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-20">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Impact After Receipt</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Real-time
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Total Outstanding */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Total Outstanding
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400 line-through">
                    {formatINR(currentOutstanding)}
                  </span>
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">
                    arrow_forward
                  </span>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {formatINR(projectedOutstanding)}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">trending_down</span>
                  <span>Reduced by {formatINR(effectiveApplied)}</span>
                </span>
              </div>

              {/* Overdue Balance */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Overdue Balance
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-rose-600 line-through">
                    {formatINR(currentOverdue)}
                  </span>
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">
                    arrow_forward
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-700">
                    {formatINR(projectedOverdue)}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-600">
                  {projectedOverdue <= 0
                    ? "✓ All overdue cleared (Red banner disappears)"
                    : `${formatINR(projectedOverdue)} remaining overdue`}
                </span>
              </div>

              {/* Available Credit */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Available Credit
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Limit: {formatINR(creditLimit)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-500">
                    {formatINR(currentAvailable)}
                  </span>
                  <span className="material-symbols-outlined text-slate-400 text-[16px]">
                    arrow_forward
                  </span>
                  <span className="font-mono font-bold text-sm text-blue-700">
                    {formatINR(projectedAvailable)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((projectedAvailable / (creditLimit || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">check_circle</span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-900">
                  Save Receipt of {formatINR(amountReceived)}?
                </h3>
                <span className="text-xs text-slate-500 mt-0.5">
                  Voucher date: {receivedDate} · {paymentMethod}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Retailer:</span>
                <span className="font-semibold text-slate-900">{activeRetailer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Reference:</span>
                <span className="font-mono font-bold text-slate-800">{referenceNumber || "Direct Receipt"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Applied:</span>
                <span className="font-mono font-bold text-blue-700">{formatINR(effectiveApplied)}</span>
              </div>
              {advanceAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Advance Balance:</span>
                  <span className="font-mono font-bold">+{formatINR(advanceAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                type="button"
              >
                Go Back &amp; Edit
              </button>
              <button
                onClick={handleSaveReceipt}
                className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                type="button"
              >
                Confirm &amp; Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default DistributorReceiptModal;
