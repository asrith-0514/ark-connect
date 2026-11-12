"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { PurchaseBill } from "@/data/mockData";

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
  const totalUnpaid = purchaseBills.filter(b => b.status === "Unpaid").reduce((sum, b) => sum + b.balanceDue, 0);
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
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Purchase Bills
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              {purchaseBills.length} Total Bills
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Raw hosiery, fabric, and finished goods inbound bills sourced from Tiruppur manufacturing mills
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={exportBillsCSV}
            className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500">download</span>
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => setIsRecordModalOpen(true)}
            className="h-10 px-4 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Record Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Total Sourced Invoices
          </span>
          <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
            ₹{totalBillAmount.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Lifetime Mill Purchases</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Outstanding Due (Payables)
          </span>
          <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
            ₹{totalUnpaid.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 block">
            Feeds Supplier Ledger
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Settled via RTGS/NEFT
          </span>
          <span className="text-2xl font-bold text-emerald-700 font-sans tabular-nums mt-1 block">
            ₹{totalPaid.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Cleared Payments</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Average Credit Terms
          </span>
          <span className="text-2xl font-bold text-[#0047d3] font-sans tabular-nums mt-1 block">
            30 Days Net
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Tiruppur Mill Terms</span>
        </div>
      </div>

      {/* Success banner */}
      {formSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span>{formSuccess}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-2.5">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by bill #, supplier, or material..."
              className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3]/20 focus:border-[#0047d3] transition-all"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("unpaid")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "unpaid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Unpaid
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("paid")}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === "paid" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Paid
            </button>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          Showing {filteredBills.length} of {purchaseBills.length} bills
        </span>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
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
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredBills.map(b => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-primary">
                    {b.billNumber}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-slate-900">
                    {b.supplierName}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                    {b.date}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                    {b.dueDate}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate" title={b.category}>
                    {b.category}
                  </td>
                  <td className="py-3.5 px-3 text-right font-bold font-sans tabular-nums text-slate-900 text-sm">
                    ₹{b.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="py-3.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.status === "Paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.status === "Overdue"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                    {b.lrNumber || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Bill Modal Form */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0047d3] flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">request_quote</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Inbound Purchase Bill</h3>
                  <p className="text-xs text-slate-400">Creates purchase bill and automatically updates mill payables</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 pt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Supplier Mill</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3]/20 font-medium text-slate-800"
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
                  <label className="font-semibold text-slate-700 block mb-1">Bill Number</label>
                  <input
                    type="text"
                    value={billNumber}
                    onChange={e => setBillNumber(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Total Bill Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-sans font-bold"
                    required
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Bill Date</label>
                  <input
                    type="text"
                    value={billDate}
                    onChange={e => setBillDate(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Due Date (30 Days)</label>
                  <input
                    type="text"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Category / Material Description</label>
                <input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. 100% Combed Cotton Single Jersey 30s yarn"
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Transport / LR #</label>
                  <input
                    type="text"
                    value={lrNumber}
                    onChange={e => setLrNumber(e.target.value)}
                    placeholder="e.g. NRT-88210-TPR"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notes / Batch Allocation</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Batch for Flybirds production"
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white font-bold shadow-sm cursor-pointer"
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

