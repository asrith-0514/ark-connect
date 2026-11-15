"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
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
    <div className="w-full flex flex-col gap-5 pb-16 text-ink">
      {/* Top Action Breadcrumb Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <button
              onClick={() => {
                if (onClose) onClose();
                else setIsReceiptModalOpen(false);
                setReceiptPrefillRetailerId(null);
              }}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Finance
            </button>
            <Icon name="chevron_right" size={14} />
            <span className="text-ink font-bold">Record Receipt</span>
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight font-page-title">Record Receipt</h1>
          <p className="text-xs text-ink-muted">
            Post verified customer payment vouchers against open wholesale invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Requirement 4: Demo Values behind Demo Flag */}
          {isDemo && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadDemoValues}
                className="h-10 px-3.5 rounded-md bg-accent/10 hover:bg-accent/20 text-accent border border-accent/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                type="button"
                title={`Populate demo values for ${activeRetailer?.name || "retailer"}`}
              >
                <Icon name="science" size={16} />
                <span>Load Demo ({activeRetailer?.code || "RET-0001"})</span>
              </button>

              <button
                onClick={() => setSimulateError(!simulateError)}
                className="h-10 px-3 rounded-md bg-surface-raised hover:bg-surface text-ink text-xs font-semibold flex items-center gap-1 transition-colors border border-border cursor-pointer"
                type="button"
              >
                <Icon name={simulateError ? "toggle_on" : "toggle_off"} size={16} />
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
            className="h-10 px-4 rounded-md bg-surface border border-border hover:bg-surface-raised text-ink font-semibold text-xs transition-colors cursor-pointer shadow-soft-sm"
            type="button"
          >
            Cancel
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isOverApplied || hasInvoiceOverAllocation || isFutureDate || amountReceived <= 0}
            className={`h-10 px-5 rounded-md font-bold text-xs flex items-center gap-1.5 shadow-soft-sm transition-all cursor-pointer ${
              isOverApplied || hasInvoiceOverAllocation || isFutureDate || amountReceived <= 0
                ? "bg-surface-raised text-ink-muted opacity-50 cursor-not-allowed shadow-none"
                : "bg-primary hover:bg-primary/90 text-primary-foreground active:scale-98"
            }`}
            type="button"
          >
            <Icon name="save" size={18} />
            <span>Save Receipt</span>
          </button>
        </div>
      </div>

      {/* Validation Alert Banners (Requirement 7) */}
      {isFutureDate && (
        <div className="flex items-center gap-2 p-3.5 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
          <Icon name="error" size={18} className="text-danger" />
          <span>
            Receipt date cannot be in the future. (Current application clock:{" "}
            {currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })})
          </span>
        </div>
      )}

      {isOverApplied && (
        <div className="flex items-center gap-2 p-3.5 rounded-md bg-danger/10 border border-danger/20 text-danger text-xs font-semibold">
          <Icon name="error" size={18} className="text-danger" />
          <span>
            Total allocated amount ({formatINR(effectiveApplied)}) exceeds amount received ({formatINR(amountReceived)}). Reduce allocated amounts.
          </span>
        </div>
      )}

      {hasInvoiceOverAllocation && (
        <div className="flex items-center gap-2 p-3.5 rounded-md bg-warning/10 border border-warning/20 text-warning text-xs font-semibold">
          <Icon name="warning" size={18} className="text-warning" />
          <span>
            One or more invoices have applied amounts exceeding their balance due. Cap allocation to the invoice balance.
          </span>
        </div>
      )}

      {/* Advance Notice (Requirement 7) */}
      {amountReceived > 0 && advanceAmount > 0 && !isOverApplied && !hasInvoiceOverAllocation && (
        <div className="flex items-center justify-between p-3.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <div className="flex items-center gap-2">
            <Icon name="account_balance_wallet" size={18} className="text-primary" />
            <span>
              Unapplied Advance: {formatINR(advanceAmount)} will remain as advance credit on {activeRetailer.name}&apos;s ledger.
            </span>
          </div>
          <span className="font-mono num text-[11px] font-bold bg-surface px-2 py-0.5 rounded border border-primary/20">
            Applied: {formatINR(effectiveApplied)} of {formatINR(amountReceived)}
          </span>
        </div>
      )}

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Receipt Entry & Invoices Allocation */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* CARD 1: Receipt Details */}
          <div className="p-5 rounded-lg bg-surface border border-border shadow-soft-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Icon name="receipt" size={18} />
                </span>
                <h2 className="text-sm font-bold text-ink">Receipt Details</h2>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-surface-raised text-ink-muted font-mono num border border-border">
                Direct Voucher
              </span>
            </div>

            {/* Retailer Selector Field */}
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">
                Retail Partner *
              </label>
              <select
                value={selectedRetailerId}
                onChange={e => setSelectedRetailerId(e.target.value)}
                className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                  <label className="text-xs font-semibold text-ink">Amount Received (₹) *</label>
                  {amountReceived > 0 && (
                    <span className="font-mono num text-xs font-bold text-primary">
                      {formatINR(amountReceived)}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono num font-bold text-ink-muted text-sm">
                    ₹
                  </span>
                  <input
                    className="w-full h-10 pl-8 pr-3 rounded-md bg-surface-raised border border-border font-mono num font-bold text-sm text-ink focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20"
                    type="number"
                    placeholder="Enter amount..."
                    value={amountReceived === 0 ? "" : amountReceived}
                    onChange={e => setAmountReceived(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
              </div>

              {/* Received On Date */}
              <div>
                <label className="text-xs font-semibold text-ink block mb-1">Received On *</label>
                <div className="relative flex items-center">
                  <Icon name="calendar_today" size={18} className="absolute left-3 text-ink-muted" />
                  <input
                    className="w-full h-10 pl-9 pr-3 rounded-md bg-surface-raised border border-border font-mono num text-xs text-ink focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20"
                    type="text"
                    value={receivedDate}
                    onChange={e => setReceivedDate(e.target.value)}
                  />
                </div>
                <span className="text-[10px] text-ink-muted mt-1 block">
                  App clock: {currentDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-xs font-semibold text-ink block mb-1">Payment Method</label>
              <div className="grid grid-cols-4 p-1 rounded-md bg-surface-raised border border-border gap-1 text-xs">
                {(["UPI", "Bank transfer", "Cash", "Cheque"] as const).map(method => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`h-9 rounded-sm font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                      paymentMethod === method
                        ? "bg-surface text-primary font-bold shadow-soft-sm border border-border"
                        : "text-ink-muted hover:text-ink"
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
                <label className="text-xs font-semibold text-ink block mb-1">
                  Reference / UTR Number
                </label>
                <input
                  className="w-full h-10 px-3 rounded-md bg-surface-raised border border-border font-mono num text-xs text-ink focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. UPI-512208 or NEFT ref"
                  type="text"
                  value={referenceNumber}
                  onChange={e => setReferenceNumber(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-ink block mb-1">
                  Staff Notes (Optional)
                </label>
                <input
                  className="w-full h-10 px-3 rounded-md bg-surface-raised border border-border text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. Paid via PhonePe QR at counter"
                  type="text"
                  value={staffNotes}
                  onChange={e => setStaffNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* CARD 2: Apply to Open Invoices (Requirement 6: Table nowrap & wider columns) */}
          <div className="p-5 rounded-lg bg-surface border border-border shadow-soft-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-ink">Apply to Open Invoices</h2>
                <p className="text-xs text-ink-muted">
                  Allocates received amount against unpaid and overdue tax invoices.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={applyOldestFirst}
                  disabled={amountReceived <= 0}
                  className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    amountReceived <= 0
                      ? "bg-surface-raised text-ink-muted opacity-50 cursor-not-allowed"
                      : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 cursor-pointer"
                  }`}
                  type="button"
                >
                  <Icon name="auto_fix_high" size={15} />
                  <span>Apply Oldest First</span>
                </button>
                <button
                  onClick={clearAllAllocations}
                  className="h-8 px-2.5 rounded-md text-xs font-semibold text-ink-muted hover:text-ink hover:bg-surface-raised transition-colors cursor-pointer border border-border"
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
                  <tr className="bg-surface-raised border-b border-border text-ink-muted font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap">Invoice #</th>
                    <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">Billed Date</th>
                    <th className="py-2.5 px-3 min-w-[110px] whitespace-nowrap">Due Date</th>
                    <th className="py-2.5 px-3 min-w-[100px] whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 min-w-[120px] whitespace-nowrap text-right">Balance Due</th>
                    <th className="py-2.5 px-3 min-w-[140px] whitespace-nowrap text-right">Apply Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeRetailerInvoices.map(inv => {
                    const daysUntil = getDaysUntil(inv.dueDate, currentDate);
                    const isOverdue = daysUntil < 0;
                    const allocated = allocations[inv.id] || 0;
                    const isOverAllocated = allocated > inv.balanceDue;

                    return (
                      <tr key={inv.id} className="hover:bg-primary/5 transition-colors">
                        <td className="py-3 px-3 font-mono num font-bold text-primary whitespace-nowrap">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 px-3 font-mono num text-ink-muted whitespace-nowrap">
                          {inv.date || inv.billedDate}
                        </td>
                        <td className="py-3 px-3 font-mono num whitespace-nowrap">
                          {isOverdue ? (
                            <span className="text-danger font-bold flex items-center gap-1">
                              <Icon name="warning" size={14} />
                              <span>{inv.dueDate}</span>
                            </span>
                          ) : (
                            <span className="text-ink">{inv.dueDate}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isOverdue
                                ? "bg-danger/10 text-danger border border-danger/20"
                                : "bg-surface-raised text-ink-muted border border-border"
                            }`}
                          >
                            {isOverdue ? `Overdue (${Math.abs(daysUntil)}d)` : "Not yet due"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono num font-bold text-ink whitespace-nowrap">
                          {formatINR(inv.balanceDue)}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="relative inline-flex items-center w-full max-w-[130px]">
                            <span className="absolute left-2.5 text-ink-muted font-mono num text-xs">₹</span>
                            <input
                              className={`w-full h-8 pl-6 pr-2 rounded-sm text-right font-mono num text-xs font-bold transition-all focus:outline-none ${
                                isOverAllocated
                                  ? "bg-danger/10 border border-danger text-danger focus:ring-2 focus:ring-danger/20"
                                  : "bg-surface-raised border border-border text-ink focus:bg-surface focus:ring-2 focus:ring-primary/20"
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
                      <td colSpan={6} className="py-8 text-center text-ink-muted font-medium">
                        No open issued invoices for this retailer. Account is settled.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Breakdown & Totals Footer (Requirement 8) */}
            <div className="p-3.5 rounded-md bg-surface-raised border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">Total Open Invoices:</span>
                <span className="font-mono num font-bold text-ink">
                  {formatINR(totalOpenBalance)}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-ink-muted">Applied:</span>
                  <span className="font-mono num font-bold text-primary">
                    {formatINR(effectiveApplied)}
                  </span>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm border ${
                    leftToApply < 0
                      ? "bg-danger/10 border-danger/20 text-danger font-bold"
                      : "bg-surface border-border text-ink"
                  }`}
                >
                  <span>Unapplied:</span>
                  <span className="font-mono num font-bold">
                    {leftToApply < 0 ? `- ${formatINR(Math.abs(leftToApply))}` : formatINR(leftToApply)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Real-Time Projection Impact (Requirement 9) */}
        <div className="lg:col-span-4 flex flex-col gap-5 lg:sticky lg:top-20">
          <div className="p-5 rounded-lg bg-surface border border-border shadow-soft-sm flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-sm font-bold text-ink">Impact After Receipt</h3>
              <span className="text-[10px] font-bold text-success bg-success/10 border border-success/20 px-2 py-0.5 rounded-full">
                Real-time
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Total Outstanding */}
              <div className="p-3 rounded-md bg-surface-raised border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-ink-muted block tracking-wider">
                  Total Outstanding
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono num text-ink-muted line-through">
                    {formatINR(currentOutstanding)}
                  </span>
                  <Icon name="arrow_forward" size={16} className="text-ink-muted" />
                  <span className="font-mono num font-bold text-sm text-ink">
                    {formatINR(projectedOutstanding)}
                  </span>
                </div>
                <span className="text-[11px] text-success font-semibold flex items-center gap-1">
                  <Icon name="trending_down" size={14} />
                  <span>Reduced by {formatINR(effectiveApplied)}</span>
                </span>
              </div>

              {/* Overdue Balance */}
              <div className="p-3 rounded-md bg-surface-raised border border-border space-y-1">
                <span className="text-[10px] uppercase font-bold text-ink-muted block tracking-wider">
                  Overdue Balance
                </span>
                <div className="flex items-center justify-between">
                  <span className="font-mono num text-danger line-through">
                    {formatINR(currentOverdue)}
                  </span>
                  <Icon name="arrow_forward" size={16} className="text-ink-muted" />
                  <span className="font-mono num font-bold text-sm text-success">
                    {formatINR(projectedOverdue)}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-ink-muted">
                  {projectedOverdue <= 0
                    ? "✓ All overdue cleared (Red banner disappears)"
                    : `${formatINR(projectedOverdue)} remaining overdue`}
                </span>
              </div>

              {/* Available Credit */}
              <div className="p-3 rounded-md bg-surface-raised border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                    Available Credit
                  </span>
                  <span className="text-[10px] text-ink-muted font-mono num">
                    Limit: {formatINR(creditLimit)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono num text-ink-muted">
                    {formatINR(currentAvailable)}
                  </span>
                  <Icon name="arrow_forward" size={16} className="text-ink-muted" />
                  <span className="font-mono num font-bold text-sm text-primary">
                    {formatINR(projectedAvailable)}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-surface-raised h-2 rounded-full overflow-hidden mt-1.5 border border-border">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface max-w-md w-full rounded-lg shadow-soft-xl p-6 flex flex-col gap-4 border border-border animate-in fade-in zoom-in-95 duration-150 text-ink">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-md bg-success/10 text-success border border-success/20 flex items-center justify-center flex-shrink-0">
                <Icon name="check_circle" size={20} />
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-ink">
                  Save Receipt of {formatINR(amountReceived)}?
                </h3>
                <span className="text-xs text-ink-muted mt-0.5">
                  Voucher date: {receivedDate} · {paymentMethod}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-md bg-surface-raised border border-border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Retailer:</span>
                <span className="font-semibold text-ink">{activeRetailer.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Reference:</span>
                <span className="font-mono num font-bold text-ink">{referenceNumber || "Direct Receipt"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Total Applied:</span>
                <span className="font-mono num font-bold text-primary">{formatINR(effectiveApplied)}</span>
              </div>
              {advanceAmount > 0 && (
                <div className="flex items-center justify-between text-success">
                  <span>Advance Balance:</span>
                  <span className="font-mono num font-bold">+{formatINR(advanceAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="h-10 px-4 rounded-md bg-surface-raised hover:bg-surface text-ink font-semibold text-xs transition-colors border border-border cursor-pointer"
                type="button"
              >
                Go Back &amp; Edit
              </button>
              <button
                onClick={handleSaveReceipt}
                className="h-10 px-5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-soft-sm transition-all cursor-pointer"
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
