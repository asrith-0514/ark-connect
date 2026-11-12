"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { DISTRIBUTOR_GSTIN } from "@/lib/mock";

export default function DistributorSidebar() {
  const { distributorNav, setDistributorNav, orders, retailers } = useApp();

  const visibleOrders = orders.filter(o => o.status !== "Draft");
  const pendingApprovals = retailers.filter(r => r.status === "Needs Approval").length;
  const activeOrdersCount = visibleOrders.length;
  const submittedOrdersCount = visibleOrders.filter(o => o.status === "Submitted").length;

  const navItem = (id: string, label: string, icon: string, badge?: React.ReactNode) => {
    const isActive = distributorNav === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setDistributorNav(id)}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all group ${
          isActive
            ? "bg-[#0047d3] text-white shadow-xs font-semibold"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-105 ${
              isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700"
            }`}
          >
            {icon}
          </span>
          <span>{label}</span>
        </div>
        {badge}
      </button>
    );
  };

  return (
    <aside className="w-72 shrink-0 sticky top-0 h-screen bg-white border-r border-slate-200 flex flex-col justify-between select-none z-30">
      {/* Top brand header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#0047d3] text-white flex items-center justify-center font-bold text-base shadow-sm shadow-blue-500/20 shrink-0">
          A
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <span className="font-bold text-slate-900 text-sm tracking-tight leading-tight block truncate">
            ARK DISTRIBUTORS
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold leading-tight truncate">
            Wholesale Hub
          </span>
        </div>
      </div>

      {/* Navigation Sections (scrolls internally on short screens) */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar p-4 space-y-6">
        {/* Operations */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Operations
          </span>
          <div className="space-y-0.5 pt-1">
            {navItem("dashboard", "Dashboard", "dashboard")}
            {navItem(
              "orders",
              "Orders",
              "inventory_2",
              submittedOrdersCount > 0 ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    distributorNav === "orders"
                      ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                      : "bg-amber-100 text-amber-900 animate-pulse"
                  }`}
                >
                  {submittedOrdersCount} action
                </span>
              ) : (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                    distributorNav === "orders"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {activeOrdersCount}
                </span>
              )
            )}
            {navItem(
              "retailers",
              "Retailers",
              "storefront",
              pendingApprovals > 0 ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    distributorNav === "retailers"
                      ? "bg-rose-400 text-slate-950 font-black shadow-xs"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {pendingApprovals}
                </span>
              ) : (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono ${
                    distributorNav === "retailers"
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {retailers.length}
                </span>
              )
            )}
            {navItem("products-pricing", "Products & Pricing", "loyalty")}
          </div>
        </div>

        {/* Finance */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Finance
          </span>
          <div className="space-y-0.5 pt-1">
            {navItem("invoices", "Invoices", "receipt_long")}
            {navItem("receipts", "Receipts", "payments")}
            {navItem("receivables", "Receivables", "account_balance_wallet")}
          </div>
        </div>

        {/* Supply Chain */}
        <div className="space-y-1">
          <span className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Supply Chain
          </span>
          <div className="space-y-0.5 pt-1">
            {navItem("suppliers", "Suppliers", "factory")}
            {navItem("purchase-bills", "Purchase Bills", "request_quote")}
            {navItem("reports", "Reports & Analytics", "query_stats")}
          </div>
        </div>
      </div>

      {/* User profile & GST status in bottom bar pinned at bottom */}
      <div className="shrink-0 p-4 border-t border-slate-200 bg-slate-50 space-y-2">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              GSTIN Active (TG)
            </span>
            <span className="font-mono text-slate-800 font-semibold">{DISTRIBUTOR_GSTIN}</span>
          </div>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
            Live
          </span>
        </div>

        <div className="flex items-center gap-3 p-1">
          <div className="w-9 h-9 rounded-full bg-[#0047d3] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            T
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-slate-900 block truncate leading-tight">
              Thatavarthi
            </span>
            <span className="text-[11px] text-slate-400 block truncate">Owner / Super Admin</span>
          </div>
          <span className="material-symbols-outlined text-[18px] text-emerald-600">
            verified_user
          </span>
        </div>
      </div>
    </aside>
  );
}
