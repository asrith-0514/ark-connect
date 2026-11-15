"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Supplier } from "@/data/mockData";
import { EmptyState , Icon } from "@/components/ui";

export const DistributorSuppliers: React.FC = () => {
  const { suppliers, purchaseBills } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(suppliers[0]?.id || null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Derived strictly from open / unpaid purchase bills (Requirement 1: ₹38,60,000 across 4 open bills)
  const openBills = purchaseBills.filter(b => b.status !== "Paid" && b.balanceDue > 0);
  const totalPayables = openBills.reduce((sum, b) => sum + b.balanceDue, 0);
  const openBillsCount = openBills.length;

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
    <div className="w-full space-y-6 pb-24 text-ink">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight font-page-title">
              Tiruppur Mill Suppliers
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-surface-raised text-ink text-xs font-bold border border-border">
              {suppliers.length} Sourcing Mills
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-muted mt-1">
            Manufacturing mills, yarn spinning units, and raw fabric suppliers in Tiruppur textile cluster
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={exportSuppliersCSV}
            className="h-10 px-4 rounded-md bg-surface hover:bg-surface-raised text-ink font-semibold text-xs flex items-center gap-2 border border-border shadow-soft-sm transition-colors cursor-pointer"
          >
            <Icon name="download" size={18} className="text-ink-muted" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Matches Dashboard "You Owe" ₹38,60,000) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-md bg-surface border border-border shadow-soft-sm">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
            Total Sourced Payables
          </span>
          <span className="text-2xl font-bold text-ink font-sans tabular-nums num mt-1 block">
            ₹{totalPayables.toLocaleString("en-IN")}
          </span>
          <span className="text-[11px] text-success mt-0.5 block font-semibold">
            Matches Dashboard "You Owe"
          </span>
        </div>
        <div className="p-5 rounded-md bg-surface border border-border shadow-soft-sm">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
            Active Tiruppur Mills
          </span>
          <span className="text-2xl font-bold text-ink font-sans tabular-nums num mt-1 block">
            {suppliers.length} Mills
          </span>
          <span className="text-[11px] text-ink-muted mt-0.5 block">100% Sourced Cluster</span>
        </div>
        <div className="p-5 rounded-md bg-surface border border-border shadow-soft-sm">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
            Open Purchase Bills
          </span>
          <span className="text-2xl font-bold text-ink font-sans tabular-nums num mt-1 block">
            {openBillsCount} Open Bills
          </span>
          <span className="text-[11px] text-ink-muted mt-0.5 block">Under 30-day terms</span>
        </div>
        <div className="p-5 rounded-md bg-surface border border-border shadow-soft-sm">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
            Payment Method
          </span>
          <span className="text-2xl font-bold text-primary font-sans tabular-nums num mt-1 block">
            RTGS / NEFT
          </span>
          <span className="text-[11px] text-ink-muted mt-0.5 block">Direct Mill Accounts</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-md bg-surface border border-border shadow-soft-sm flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Icon name="search" size={18} className="text-ink-muted absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search mills by name, GSTIN, or contact person..."
            className="w-full h-10 pl-9 pr-3 text-xs bg-surface-raised border border-border rounded-md text-ink placeholder:text-ink-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <span className="text-xs text-ink-muted">
          Showing {filteredSuppliers.length} suppliers
        </span>
      </div>

      {/* Main Grid: Suppliers Table + Side Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Table: 2 cols on lg */}
        <div className={`${isDrawerOpen ? "lg:col-span-2" : "lg:col-span-3"} bg-surface rounded-md shadow-soft-sm border border-border overflow-hidden transition-all`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-surface-raised text-ink-muted text-[11px] uppercase tracking-wider border-b border-border font-bold">
                  <th className="py-3 px-4">Mill Name &amp; Location</th>
                  <th className="py-3 px-3">GSTIN</th>
                  <th className="py-3 px-3">Contact</th>
                  <th className="py-3 px-3">Brands Supplied</th>
                  <th className="py-3 px-3 text-right">Payable (INR)</th>
                  <th className="py-3 px-3">Last Purchase</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <EmptyState
                        icon={<Icon name="domain_disabled" size={28} />}
                        title="No suppliers found"
                        description="Try adjusting your search query or clear the filter."
                        actionLabel="Clear Filter"
                        onAction={() => setSearchQuery("")}
                      />
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map(sup => {
                  const isSelected = isDrawerOpen && selectedSupplier?.id === sup.id;

                  return (
                    <tr
                      key={sup.id}
                      onClick={() => openDrawer(sup)}
                      className={`hover:bg-primary/5 transition-colors cursor-pointer ${
                        isSelected ? "bg-primary/10" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-ink text-xs">
                            {sup.name}
                          </span>
                          <span className="text-[11px] text-ink-muted">
                            {sup.location}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono num text-[11px] text-ink font-semibold px-2 py-0.5 rounded-sm bg-surface-raised border border-border">
                          {sup.gstin}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="text-ink font-medium">{sup.contactPerson}</span>
                          <span className="text-[11px] text-ink-muted font-mono num">{sup.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap gap-1">
                          {(sup.brandsSupplied || []).map((b: string) => (
                            <span
                              key={b}
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised border border-border text-ink whitespace-nowrap"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold font-mono num text-ink text-sm">
                        ₹{sup.payable.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 text-ink-muted font-mono num whitespace-nowrap">
                        {sup.lastPurchaseDate}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            openDrawer(sup);
                          }}
                          className="px-3 py-1.5 rounded-sm bg-surface-raised hover:bg-surface text-ink font-semibold text-xs transition-colors border border-border cursor-pointer"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Drawer: 1 col on lg */}
        {isDrawerOpen && selectedSupplier && (
          <div className="lg:col-span-1 bg-surface rounded-md shadow-soft-sm border border-border p-5 space-y-5 animate-in slide-in-from-right-2 text-ink">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
                  Supplier Profile
                </span>
                <h3 className="text-lg font-bold text-ink mt-0.5">
                  {selectedSupplier.name}
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 text-[11px] font-semibold mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  Verified Sourcing Mill
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 rounded-sm text-ink-muted hover:text-ink hover:bg-surface-raised flex items-center justify-center border border-border cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Payable Card */}
            <div className="p-4 rounded-md bg-surface-raised border border-border">
              <span className="text-[11px] text-ink-muted block">Total Outstanding Payable</span>
              <span className="text-2xl font-bold font-mono num text-ink block mt-1">
                ₹{selectedSupplier.payable.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5">
                Last Purchase: {selectedSupplier.lastPurchaseDate}
              </span>
            </div>

            {/* Mill Details */}
            <div className="space-y-3 text-xs border-t border-border pt-3">
              <div>
                <span className="text-ink-muted block text-[11px]">Factory Address</span>
                <span className="font-medium text-ink">{selectedSupplier.address}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-ink-muted block text-[11px]">GSTIN</span>
                  <span className="font-mono num font-bold text-ink">{selectedSupplier.gstin}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Contact Person</span>
                  <span className="font-medium text-ink">{selectedSupplier.contactPerson}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-ink-muted block text-[11px]">Phone</span>
                  <span className="font-medium text-ink font-mono num">{selectedSupplier.phone}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Email</span>
                  <span className="font-medium text-ink truncate block">{selectedSupplier.email}</span>
                </div>
              </div>
            </div>

            {/* Bank Details for Settlement */}
            {selectedSupplier.bankDetails && (
              <div className="p-3 rounded-md bg-primary/10 border border-primary/20 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-primary">
                  <Icon name="account_balance" size={16} />
                  <span>NEFT / RTGS Settlement Account</span>
                </div>
                <div className="text-ink space-y-0.5 pt-1">
                  <div><span className="text-ink-muted">A/C:</span> <span className="font-mono num font-semibold">{selectedSupplier.bankDetails.accountNumber}</span></div>
                  <div><span className="text-ink-muted">IFSC:</span> <span className="font-mono num font-semibold">{selectedSupplier.bankDetails.ifsc}</span></div>
                  <div><span className="text-ink-muted">Bank:</span> {selectedSupplier.bankDetails.bankName} ({selectedSupplier.bankDetails.branch})</div>
                </div>
              </div>
            )}

            {/* Open Purchase Bills for this mill */}
            <div className="space-y-2 border-t border-border pt-3">
              <span className="text-xs font-bold text-ink block">
                Purchase Bills ({supplierBills.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {supplierBills.map(b => (
                  <div
                    key={b.id}
                    className="p-2.5 rounded-sm border border-border bg-surface-raised flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono num font-bold text-ink block">{b.billNumber}</span>
                      <span className="text-[10px] text-ink-muted font-mono num">{b.date} • Due {b.dueDate}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono num font-bold text-ink block">
                        ₹{b.amount.toLocaleString("en-IN")}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          b.status === "Paid"
                            ? "bg-success/15 text-success border border-success/30"
                            : "bg-warning/15 text-warning border border-warning/30"
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

