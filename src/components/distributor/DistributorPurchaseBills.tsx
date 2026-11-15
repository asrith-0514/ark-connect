"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PurchaseBill } from "@/data/mockData";
import { EmptyState } from "@/components/ui";

export const DistributorPurchaseBills: React.FC = () => {
  const { purchaseBills, suppliers, addPurchaseBill, currentDate } = useApp();

  const defaultDateStr = currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const defaultDueStr = new Date(currentDate.getTime() + 30 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Form states for new purchase bill
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || "sup-1");
  const [billNumber, setBillNumber] = useState(`PB-2026-${Math.floor(892 + Math.random() * 90)}`);
  const [billDate, setBillDate] = useState(defaultDateStr);
  const [dueDate, setDueDate] = useState(defaultDueStr);
  const [amount, setAmount] = useState<number>(350000);
  const [category, setCategory] = useState("Combed Cotton Hosiery Yarn 30s");
  const [lrNumber, setLrNumber] = useState("NRT-88210-TPR");
  const [notes, setNotes] = useState("Tiruppur mill batch delivery");
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const totalBillAmount = purchaseBills.reduce((sum, b) => sum + b.amount, 0);
  // Derived strictly from unpaid purchase bills (Requirement 1: ₹38,60,000 across 4 open bills)
  const openBills = purchaseBills.filter(b => b.status !== "Paid" && b.balanceDue > 0);
  const totalUnpaid = openBills.reduce((sum, b) => sum + b.balanceDue, 0);
  const openBillsCount = openBills.length;
  const totalPaid = purchaseBills.reduce((sum, b) => sum + (b.paidAmount || (b.amount - b.balanceDue)), 0);

  const filteredBills = purchaseBills.filter(b => {
    if (statusFilter !== "all" && b.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        b.billNumber.toLowerCase().includes(q) ||
        b.supplierName.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.lrNumber && b.lrNumber.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];

    addPurchaseBill({
      billNumber,
      supplierId: sup.id,
      supplierName: sup.name,
      date: billDate,
      dueDate,
      amount,
      paidAmount: 0,
      balanceDue: amount,
      status: "Unpaid",
      category,
      lrNumber,
      notes
    });

    setFormSuccess(`Recorded purchase bill ${billNumber} for ₹${amount.toLocaleString("en-IN")}. Supplier payable updated.`);
    setIsRecordModalOpen(false);

    // Reset next bill number
    setBillNumber(`PB-2026-${Math.floor(900 + Math.random() * 90)}`);
    setTimeout(() => setFormSuccess(null), 4000);
  };

  const exportBillsCSV = () => {
    const headers = [
      "Bill Number",
      "Supplier",
      "Bill Date",
      "Due Date",
      "Total Amount (INR)",
      "Paid Amount (INR)",
      "Balance Due (INR)",
      "Status",
      "Category / Material",
      "Transport / LR #"
    ];

    const rows = purchaseBills.map(b => [
      b.billNumber,
      `"${b.supplierName}"`,
      b.date,
      b.dueDate,
      b.amount,
      b.paidAmount,
      b.balanceDue,
      b.status,
      `"${b.category}"`,
      b.lrNumber || "-"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ARK_Purchase_Bills_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 pb-24 text-ink">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight font-page-title">
              Purchase Bills
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-raised text-ink text-xs font-bold border border-border">
              {purchaseBills.length} Total Bills
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Raw hosiery, fabric, and finished goods inbound bills sourced from Tiruppur manufacturing mills
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={exportBillsCSV}
            className="h-10 px-4 rounded-md bg-surface hover:bg-surface-raised text-ink font-semibold text-xs flex items-center gap-2 border border-border shadow-soft-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-ink-muted">download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="h-10 px-4 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center gap-2 shadow-soft-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Record Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-md bg-surface border border-border shadow-soft-sm">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
            Total Sourced Invoices
          </span>
          <span className="text-2xl font-bold text-ink font-sans tabular-nums num mt-1 block">
            ₹{totalBillAmount.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-ink-muted mt-0.5 block">Lifetime Mill Purchases</span>
        </div>
        <div className="p-5 rounded-md bg-surface border border-border shadow-soft-sm">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
            Outstanding Due (You Owe)
          </span>
          <span className="text-2xl font-bold text-ink font-sans tabular-nums num mt-1 block">
            ₹{totalUnpaid.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-success font-semibold mt-0.5 block">
            {openBillsCount} Open Bills • Matches Dashboard
          </span>
        </div>
        <div className="p-5 rounded-md bg-surface border border-border shadow-soft-sm">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
            Settled via RTGS/NEFT
          </span>
          <span className="text-2xl font-bold text-success font-sans tabular-nums num mt-1 block">
            ₹{totalPaid.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-ink-muted mt-0.5 block">Cleared Payments</span>
        </div>
        <div className="p-5 rounded-md bg-surface border border-border shadow-soft-sm">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
            Average Credit Terms
          </span>
          <span className="text-2xl font-bold text-primary font-sans tabular-nums num mt-1 block">
            30 Days Net
          </span>
          <span className="text-[11px] text-ink-muted mt-0.5 block">Tiruppur Mill Terms</span>
        </div>
      </div>

      {/* Success banner */}
      {formSuccess && (
        <div className="p-3.5 rounded-md bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 rounded-md bg-surface border border-border shadow-soft-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined text-[18px] text-ink-muted absolute left-3 top-2.5">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by bill #, supplier, or material..."
              className="w-full h-10 pl-9 pr-3 text-xs bg-surface-raised border border-border rounded-md text-ink placeholder:text-ink-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          <div className="flex items-center p-1 rounded-md bg-surface-raised border border-border text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-sm transition-all cursor-pointer ${
                statusFilter === "all" ? "bg-surface text-ink shadow-soft-sm border border-border" : "text-ink-muted hover:text-ink"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unpaid")}
              className={`px-3 py-1 rounded-sm transition-all cursor-pointer ${
                statusFilter === "unpaid" ? "bg-surface text-ink shadow-soft-sm border border-border" : "text-ink-muted hover:text-ink"
              }`}
            >
              Unpaid
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("paid")}
              className={`px-3 py-1 rounded-sm transition-all cursor-pointer ${
                statusFilter === "paid" ? "bg-surface text-ink shadow-soft-sm border border-border" : "text-ink-muted hover:text-ink"
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        <span className="text-xs text-ink-muted">
          Showing {filteredBills.length} of {purchaseBills.length} bills
        </span>
      </div>

      {/* Bills Table */}
      <div className="bg-surface rounded-md shadow-soft-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-raised text-ink-muted text-[11px] uppercase tracking-wider border-b border-border font-bold">
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-3">Supplier (Mill)</th>
                <th className="py-3 px-3">Bill Date</th>
                <th className="py-3 px-3">Due Date</th>
                <th className="py-3 px-3">Category / Material</th>
                <th className="py-3 px-3 text-right">Amount (INR)</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">LR / Transport</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <EmptyState
                      icon={<span className="material-symbols-outlined text-[28px]">receipt_long</span>}
                      title="No purchase bills found"
                      description="Try adjusting your status filter or search keyword."
                      actionLabel="Reset Filters"
                      onAction={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                      }}
                    />
                  </td>
                </tr>
              ) : (
                filteredBills.map(b => (
                  <tr key={b.id} className="hover:bg-primary/5 transition-colors">
                    <td className="py-3.5 px-4 font-mono num font-bold text-primary">
                      {b.billNumber}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-ink">
                      {b.supplierName}
                    </td>
                    <td className="py-3.5 px-3 text-ink-muted font-mono num whitespace-nowrap">
                      {b.date}
                    </td>
                    <td className="py-3.5 px-3 text-ink-muted font-mono num whitespace-nowrap">
                      {b.dueDate}
                    </td>
                    <td className="py-3.5 px-3 text-ink-muted max-w-xs truncate" title={b.category}>
                      {b.category}
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold font-mono num text-ink text-sm">
                      ₹{b.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          b.status === "Paid"
                            ? "bg-success/10 text-success border-success/20"
                            : b.status === "Overdue"
                            ? "bg-danger/10 text-danger border-danger/20"
                            : "bg-warning/10 text-warning border-warning/20"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-ink-muted font-mono num text-[11px]">
                      {b.lrNumber || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Bill Modal Form */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg shadow-soft-xl max-w-xl w-full p-6 border border-border animate-in zoom-in-95 text-ink">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">request_quote</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink">Record Inbound Purchase Bill</h3>
                  <p className="text-xs text-ink-muted">Creates purchase bill and automatically updates mill payables</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="w-8 h-8 rounded-sm text-ink-muted hover:text-ink hover:bg-surface-raised flex items-center justify-center border border-border cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-ink block mb-1">Select Supplier Mill</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium text-ink"
                  required
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.location}) • Current Payable: ₹{s.payable.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Bill Number</label>
                  <input
                    type="text"
                    value={billNumber}
                    onChange={e => setBillNumber(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md focus:bg-surface font-mono num font-bold text-ink"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-ink block mb-1">Total Bill Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md focus:bg-surface font-mono num font-bold text-ink"
                    required
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Bill Date</label>
                  <input
                    type="text"
                    value={billDate}
                    onChange={e => setBillDate(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md focus:bg-surface font-mono num text-ink"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-ink block mb-1">Due Date (30 Days)</label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md focus:bg-surface font-mono num text-ink"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink block mb-1">Category / Material Description</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. 100% Combed Cotton Single Jersey 30s yarn"
                  className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md focus:bg-surface text-ink placeholder:text-ink-muted"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-ink block mb-1">Transport / LR #</label>
                  <input
                    type="text"
                    value={lrNumber}
                    onChange={e => setLrNumber(e.target.value)}
                    placeholder="e.g. NRT-88210-TPR"
                    className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md focus:bg-surface font-mono num text-ink"
                  />
                </div>
                <div>
                  <label className="font-semibold text-ink block mb-1">Notes / Batch Allocation</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Batch for Flybirds production"
                    className="w-full h-10 px-3 bg-surface-raised border border-border rounded-md focus:bg-surface text-ink placeholder:text-ink-muted"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2.5 rounded-md bg-surface-raised hover:bg-surface text-ink font-semibold border border-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-soft-sm cursor-pointer"
                >
                  Record Bill &amp; Update Payables
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

