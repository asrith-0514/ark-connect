"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Supplier } from "@/data/mockData";

export const DistributorSuppliers: React.FC = () => {
  const { suppliers, purchaseBills } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(suppliers[0]?.id || null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const totalPayables = suppliers.reduce((sum, s) => sum + s.payable, 0);

  const filteredSuppliers = suppliers.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.gstin.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.location.toLowerCase().includes(q)
    );
  });

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId) || suppliers[0];
  const supplierBills = purchaseBills.filter(
    b => b.supplierId === selectedSupplier?.id || b.supplierName === selectedSupplier?.name
  );

  const openDrawer = (sup: Supplier) => {
    setSelectedSupplierId(sup.id);
    setIsDrawerOpen(true);
  };

  const exportSuppliersCSV = () => {
    const headers = [
      "Supplier Mill Name",
      "GSTIN",
      "Location",
      "Contact Person",
      "Phone",
      "Email",
      "Total Payable (INR)",
      "Last Purchase Date",
      "Brands Supplied"
    ];

    const rows = suppliers.map(s => [
      `"${s.name}"`,
      s.gstin,
      `"${s.location}"`,
      `"${s.contactPerson}"`,
      s.phone,
      s.email,
      s.payable,
      s.lastPurchaseDate,
      `"${(s.brandsSupplied || []).join(", ")}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ARK_Tiruppur_Suppliers_${new Date().toISOString().split("T")[0]}.csv`);
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
              Tiruppur Mill Suppliers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
              {suppliers.length} Sourcing Mills
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manufacturing mills, yarn spinning units, and raw fabric suppliers in Tiruppur textile cluster
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={exportSuppliersCSV}
            className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500">download</span>
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Matches Dashboard "You Owe" ₹38,60,000) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Total Sourced Payables
          </span>
          <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
            ₹{totalPayables.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block font-semibold">
            Matches Dashboard "You Owe"
          </span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Active Tiruppur Mills
          </span>
          <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
            {suppliers.length} Mills
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">100% Sourced Cluster</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Open Purchase Bills
          </span>
          <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
            {purchaseBills.filter(b => b.status === "Unpaid").length} Open Bills
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Under 30-day grace</span>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Payment Method
          </span>
          <span className="text-2xl font-bold text-[#0047d3] font-sans tabular-nums mt-1 block">
            RTGS / NEFT
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Direct Mill Accounts</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-2.5">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mills by name, GSTIN, or contact person..."
            className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3]/20 focus:border-[#0047d3] transition-all"
          />
        </div>
        <span className="text-xs text-slate-500">
          Showing {filteredSuppliers.length} suppliers
        </span>
      </div>

      {/* Main Grid: Suppliers Table + Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table: 2 cols on lg */}
        <div className={`${isDrawerOpen ? "lg:col-span-2" : "lg:col-span-3"} bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden transition-all`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
                  <th className="py-3 px-4">Mill Name &amp; Location</th>
                  <th className="py-3 px-3">GSTIN</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Brands Supplied</th>
                  <th className="py-3 px-3 text-right">Payable (INR)</th>
                  <th className="py-3 px-3">Last Purchase</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredSuppliers.map(sup => {
                  const isSelected = isDrawerOpen && selectedSupplier?.id === sup.id;

                  return (
                    <tr
                      key={sup.id}
                      onClick={() => openDrawer(sup)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        isSelected ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-xs">
                            {sup.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {sup.location}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[11px] text-slate-700 font-semibold px-2 py-0.5 rounded bg-slate-100">
                          {sup.gstin}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="text-slate-800 font-medium">{sup.contactPerson}</span>
                          <span className="text-[11px] text-slate-400">{sup.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(sup.brandsSupplied || []).map((b: string) => (
                            <span
                              key={b}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold font-sans tabular-nums text-slate-900 text-sm">
                        ₹{sup.payable.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                        {sup.lastPurchaseDate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            openDrawer(sup);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Drawer: 1 col on lg */}
        {isDrawerOpen && selectedSupplier && (
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5 animate-in slide-in-from-right-2">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Supplier Profile
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedSupplier.name}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Verified Sourcing Mill
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Payable Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Total Outstanding Payable</span>
              <span className="text-2xl font-bold font-sans tabular-nums text-slate-900 block mt-1">
                ₹{selectedSupplier.payable.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Last Purchase: {selectedSupplier.lastPurchaseDate}
              </span>
            </div>

            {/* Mill Details */}
            <div className="space-y-3 text-xs border-t border-slate-100 pt-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Factory Address</span>
                <span className="font-medium text-slate-800">{selectedSupplier.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">GSTIN</span>
                  <span className="font-mono font-bold text-slate-800">{selectedSupplier.gstin}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Person</span>
                  <span className="font-medium text-slate-800">{selectedSupplier.contactPerson}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone</span>
                  <span className="font-medium text-slate-800">{selectedSupplier.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span className="font-medium text-slate-800 truncate block">{selectedSupplier.email}</span>
                </div>
              </div>
            </div>

            {/* Bank Details for Settlement */}
            {selectedSupplier.bankDetails && (
              <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#0047d3]">
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  <span>NEFT / RTGS Settlement Account</span>
                </div>
                <div className="text-slate-700 space-y-0.5 pt-1">
                  <div><span className="text-slate-500">A/C:</span> <span className="font-mono font-semibold">{selectedSupplier.bankDetails.accountNumber}</span></div>
                  <div><span className="text-slate-500">IFSC:</span> <span className="font-mono font-semibold">{selectedSupplier.bankDetails.ifsc}</span></div>
                  <div><span className="text-slate-500">Bank:</span> {selectedSupplier.bankDetails.bankName} ({selectedSupplier.bankDetails.branch})</div>
                </div>
              </div>
            )}

            {/* Open Purchase Bills for this mill */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-900 block">
                Purchase Bills ({supplierBills.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {supplierBills.map(b => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800 block">{b.billNumber}</span>
                      <span className="text-[10px] text-slate-400">{b.date} • Due {b.dueDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-sans font-bold tabular-nums text-slate-900 block">
                        ₹{b.amount.toLocaleString("en-IN")}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          b.status === "Paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

