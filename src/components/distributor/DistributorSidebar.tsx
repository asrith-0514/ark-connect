"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { DISTRIBUTOR_GSTIN, getFollowUpsGrouped } from "@/lib/mock";
import { Icon } from "@/components/ui/Icon";
import { ArkMonogram, ArkWordmark } from "@/components/ui/ArkLogo";

export default function DistributorSidebar() {
  const {
    distributorNav,
    setDistributorNav,
    orders,
    retailers,
    tierArticles,
    invoices,
    followUps,
    currentDate,
    callTasks,
    setIsReceiptModalOpen,
  } = useApp();
  const { user, hasPermission, logout } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  // Grouped follow-ups & live badge
  const followUpGrouped = getFollowUpsGrouped(followUps, currentDate);
  const followUpBadge = followUpGrouped.counts.missed + followUpGrouped.counts.today;
  const proposedCallsCount = callTasks ? callTasks.filter((t) => t.status === "proposed").length : 0;

  // Derive counts
  const visibleOrders = orders.filter(o => o.status !== "Draft");
  const needsReviewCount = visibleOrders.filter(o => o.status === "Submitted").length;
  const activeOrdersCount = visibleOrders.length;
  const pendingApprovals = retailers.filter(r => r.status === "Needs Approval").length;
  const pricePendingCount = tierArticles.filter(a => a.pricePending).length;

  const overdueInvoicesCount = invoices.filter(
    i => i.status === "Overdue" || i.status === "Issued"
  ).length;

  // Permissions
  const canDashboard = hasPermission("canViewDashboard");
  const canOrders = hasPermission("canViewOrders");
  const canRetailers = hasPermission("canViewRetailers");
  const canProducts = hasPermission("canViewProducts");
  const canReceivables = hasPermission("canViewReceivables");
  const canInvoices = hasPermission("canViewInvoices");
  const canSuppliers = hasPermission("canViewSuppliers");
  const canPurchaseBills = hasPermission("canViewPurchaseBills");
  const canReports = hasPermission("canViewReports");
  const canReceipts = hasPermission("canRecordReceipts");

  const navItem = (
    id: string,
    label: string,
    icon: string,
    badge?: { count: number; alert?: boolean; label?: string }
  ) => {
    const isActive = distributorNav === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          setDistributorNav(id);
          setIsMobileMoreOpen(false);
        }}
        title={label}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 group cursor-pointer relative overflow-hidden ${
          isActive
            ? "bg-primary/10 text-primary font-bold border border-primary/25 pl-3.5 shadow-soft-xs"
            : "text-ink-muted hover:bg-surface-raised hover:text-ink font-medium border border-transparent"
        }`}
      >
        {isActive && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent rounded-r-full shadow-[0_0_8px_rgba(34,229,255,0.8)]" />
        )}
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            name={icon}
            size={18}
            className={`transition-transform group-hover:scale-105 shrink-0 ${
              isActive ? "text-primary" : "text-ink-muted group-hover:text-ink"
            }`}
          />
          {!isCollapsed && (
            <span className="truncate font-sans tracking-tight text-xs">
              {label}
            </span>
          )}
        </div>

        {badge && badge.count > 0 && (
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none shrink-0 ${
              isCollapsed ? "hidden" : "inline-flex"
            } ${
              badge.alert
                ? "bg-accent/15 text-accent border border-accent/25 animate-pulse"
                : "bg-surface-raised text-ink-muted border border-border"
            }`}
          >
            {badge.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* 1. Desktop & Laptop Collapsible Sidebar (>= 1024px: 240px expanded / 72px collapsed) */}
      <aside
        className={`hidden lg:flex flex-col border-r border-border bg-surface shrink-0 sticky top-0 h-screen transition-all duration-200 z-30 select-none ${
          isCollapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 border-b border-border flex items-center justify-between shrink-0">
          {!isCollapsed ? (
            <ArkWordmark product="Backoffice" size="sm" />
          ) : (
            <ArkMonogram size={24} variant="gradient" className="mx-auto" />
          )}

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-7 h-7 rounded-sm bg-surface-raised hover:bg-surface text-ink-muted hover:text-ink flex items-center justify-center transition-colors border border-border cursor-pointer"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Icon name={isCollapsed ? "chevron_right" : "chevron_left"} size={14} />
          </button>
        </div>

        {/* Grouped Nav Items */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4 no-scrollbar">
          {/* Section 1: OVERVIEW */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <span className="px-3 font-mono text-[9px] font-bold text-ink-muted/80 uppercase tracking-wider block mb-1">
                Overview
              </span>
            )}
            {canDashboard &&
              navItem("dashboard", "Today", "today", {
                count: needsReviewCount,
                alert: needsReviewCount > 0,
              })}
            {canOrders &&
              navItem("orders", "Orders & Packing", "inventory_2", {
                count: activeOrdersCount,
              })}
            {canInvoices && navItem("invoices", "Tax Invoices", "description")}
          </div>

          {/* Section 2: COLLECTIONS */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <span className="px-3 font-mono text-[9px] font-bold text-ink-muted/80 uppercase tracking-wider block mb-1">
                Collections
              </span>
            )}
            {canReceivables &&
              navItem("receivables", "Receivables", "account_balance_wallet")}
            {canReceipts &&
              navItem("receipts", "Record Receipt", "payments")}
          </div>

          {/* Section 3: INVENTORY & MILL */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <span className="px-3 font-mono text-[9px] font-bold text-ink-muted/80 uppercase tracking-wider block mb-1">
                Inventory &amp; Mill
              </span>
            )}
            {canProducts &&
              navItem("products-pricing", "Products & Pricing", "sell", {
                count: pricePendingCount,
                alert: pricePendingCount > 0,
              })}
            {canSuppliers && navItem("suppliers", "Mill Suppliers", "factory")}
            {canPurchaseBills &&
              navItem("purchase-bills", "Purchase Bills", "receipt_long")}
          </div>

          {/* Section 4: NETWORK & CRM */}
          <div className="space-y-0.5">
            {!isCollapsed && (
              <span className="px-3 font-mono text-[9px] font-bold text-ink-muted/80 uppercase tracking-wider block mb-1">
                Network &amp; CRM
              </span>
            )}
            {canRetailers &&
              navItem("retailers", "Retailer Directory", "storefront", {
                count: pendingApprovals,
                alert: pendingApprovals > 0,
              })}
            {canRetailers &&
              navItem("follow-ups", "Follow-ups", "event_repeat", {
                count: followUpBadge,
                alert: followUpGrouped.counts.missed > 0,
              })}
            {canRetailers &&
              navItem("segments", "Segmentation", "pie_chart")}
            {canRetailers &&
              navItem("voice-agent", "Voice Calling", "phone_in_talk", {
                count: proposedCallsCount,
                alert: proposedCallsCount > 0,
              })}
            {canRetailers &&
              navItem("insights", "Actionable Insights", "auto_awesome")}
            {canReports && navItem("reports", "Reports & P&L", "analytics")}
          </div>
        </div>

        {/* Pinned Bottom Footer (GSTIN & User Account) */}
        <div className="p-2.5 border-t border-border bg-surface shrink-0 space-y-2">
          {!isCollapsed && (
            <div className="p-2 rounded-xl bg-surface-raised border border-border">
              <div className="flex items-center justify-between text-[10px] text-ink-muted font-bold uppercase tracking-wider">
                <span>GSTIN</span>
                <span className="text-success font-semibold">Tally Prime</span>
              </div>
              <div className="text-[11px] font-mono font-bold text-ink mt-0.5 truncate">
                {DISTRIBUTOR_GSTIN}
              </div>
            </div>
          )}

          {/* User Account Strip */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-surface-raised transition-colors">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0 border border-primary/20">
                {user?.name.substring(0, 2).toUpperCase() || "AD"}
              </div>
              {!isCollapsed && (
                <div className="min-w-0">
                  <span className="text-xs font-bold text-ink block truncate leading-tight">
                    {user?.name || "Admin"}
                  </span>
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">
                    {user?.distributorRole || "Owner"}
                  </span>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <button
                type="button"
                onClick={logout}
                className="w-7 h-7 rounded-sm hover:bg-danger/10 text-ink-muted hover:text-danger flex items-center justify-center transition-colors cursor-pointer"
                title="Log out session"
              >
                <Icon name="logout" size={15} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 2. Tablet & Mobile Fixed Bottom Bar (< 1024px) for the Owner on his phone */}
      {/* Restyled to match the Retailer floating glass pill with cyan active indicator */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-3 max-w-lg mx-auto">
        <nav
          aria-label="Distributor Mobile Navigation"
          className="pointer-events-auto w-full bg-surface/85 backdrop-blur-xl text-ink rounded-full p-1.5 border border-border/80 shadow-[0_8px_32px_rgba(0,0,0,0.36)] flex items-center justify-around select-none ring-1 ring-white/5"
        >
          {/* 1. Today */}
          <button
            type="button"
            onClick={() => setDistributorNav("dashboard")}
            className={`min-h-[48px] py-1 px-2.5 rounded-full relative flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
              distributorNav === "dashboard"
                ? "text-primary font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon name="today" size={20} className={distributorNav === "dashboard" ? "text-primary" : "text-ink-muted"} />
            <span className="text-[10px] font-sans mt-0.5 leading-none">Today</span>
            {distributorNav === "dashboard" && (
              <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,229,255,0.8)]" />
            )}
          </button>

          {/* 2. Orders */}
          <button
            type="button"
            onClick={() => setDistributorNav("orders")}
            className={`min-h-[48px] py-1 px-2.5 rounded-full relative flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
              distributorNav === "orders"
                ? "text-primary font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <div className="relative">
              <Icon name="inventory_2" size={20} className={distributorNav === "orders" ? "text-primary" : "text-ink-muted"} />
              {activeOrdersCount > 0 && (
                <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-primary text-white text-[9px] font-mono font-bold leading-tight">
                  {activeOrdersCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-sans mt-0.5 leading-none">Orders</span>
            {distributorNav === "orders" && (
              <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,229,255,0.8)]" />
            )}
          </button>

          {/* 3. Receivables */}
          <button
            type="button"
            onClick={() => setDistributorNav("receivables")}
            className={`min-h-[48px] py-1 px-2.5 rounded-full relative flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
              distributorNav === "receivables"
                ? "text-primary font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon name="account_balance_wallet" size={20} className={distributorNav === "receivables" ? "text-primary" : "text-ink-muted"} />
            <span className="text-[10px] font-sans mt-0.5 leading-none">Receivables</span>
            {distributorNav === "receivables" && (
              <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,229,255,0.8)]" />
            )}
          </button>

          {/* 4. Products */}
          <button
            type="button"
            onClick={() => setDistributorNav("products-pricing")}
            className={`min-h-[48px] py-1 px-2.5 rounded-full relative flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
              distributorNav === "products-pricing" || distributorNav === "products"
                ? "text-primary font-bold"
                : "text-ink-muted hover:text-ink"
            }`}
          >
            <div className="relative">
              <Icon name="sell" size={20} className={distributorNav === "products-pricing" || distributorNav === "products" ? "text-primary" : "text-ink-muted"} />
              {pricePendingCount > 0 && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-warning animate-pulse" />
              )}
            </div>
            <span className="text-[10px] font-sans mt-0.5 leading-none">Products</span>
            {(distributorNav === "products-pricing" || distributorNav === "products") && (
              <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,229,255,0.8)]" />
            )}
          </button>

          {/* 5. More Menu Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(true)}
            className={`min-h-[48px] py-1 px-2.5 rounded-full relative flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
              isMobileMoreOpen ? "text-primary font-bold" : "text-ink-muted hover:text-ink"
            }`}
          >
            <Icon name="more_horiz" size={20} className={isMobileMoreOpen ? "text-primary" : "text-ink-muted"} />
            <span className="text-[10px] font-sans mt-0.5 leading-none">More</span>
            {isMobileMoreOpen && (
              <span className="absolute bottom-1 w-4 h-0.5 rounded-full bg-accent shadow-[0_0_8px_rgba(34,229,255,0.8)]" />
            )}
          </button>
        </nav>
      </div>

      {/* 3. Mobile "More" Drawer for Secondary Distributor Views */}
      {isMobileMoreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div
            className="w-full bg-surface rounded-t-2xl p-4 pb-8 border-t border-border shadow-soft-xl space-y-3 animate-in slide-in-from-bottom duration-200 text-ink"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-border rounded-full mx-auto -mt-1 mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">
                ARK Backoffice Modules
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="w-7 h-7 rounded-full bg-background hover:bg-surface-raised flex items-center justify-center text-ink-muted hover:text-ink"
              >
                <Icon name="close" size={15} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {canInvoices && (
                <button
                  type="button"
                  onClick={() => {
                    setDistributorNav("invoices");
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="description" size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Invoices</span>
                    <span className="text-[10px] text-ink-muted">Billing &amp; GST</span>
                  </div>
                </button>
              )}

              {canReceipts && (
                <button
                  type="button"
                  onClick={() => {
                    setIsReceiptModalOpen(true);
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="payments" size={18} className="text-success shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Record Receipt</span>
                    <span className="text-[10px] text-ink-muted">Post payment</span>
                  </div>
                </button>
              )}

              {canSuppliers && (
                <button
                  type="button"
                  onClick={() => {
                    setDistributorNav("suppliers");
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="factory" size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Mill Suppliers</span>
                    <span className="text-[10px] text-ink-muted">Tiruppur Mills</span>
                  </div>
                </button>
              )}

              {canPurchaseBills && (
                <button
                  type="button"
                  onClick={() => {
                    setDistributorNav("purchase-bills");
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="receipt_long" size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Purchase Bills</span>
                    <span className="text-[10px] text-ink-muted">Inward stock</span>
                  </div>
                </button>
              )}

              {canRetailers && (
                <button
                  type="button"
                  onClick={() => {
                    setDistributorNav("retailers");
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="storefront" size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Retailer Directory</span>
                    <span className="text-[10px] text-ink-muted">28 store accounts</span>
                  </div>
                </button>
              )}

              {canRetailers && (
                <button
                  type="button"
                  onClick={() => {
                    setDistributorNav("follow-ups");
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="event_repeat" size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Follow-ups</span>
                    <span className="text-[10px] text-ink-muted">{followUpBadge} tasks due</span>
                  </div>
                </button>
              )}

              {canRetailers && (
                <button
                  type="button"
                  onClick={() => {
                    setDistributorNav("segments");
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="pie_chart" size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Segmentation</span>
                    <span className="text-[10px] text-ink-muted">5 account cohorts</span>
                  </div>
                </button>
              )}

              {canRetailers && (
                <button
                  type="button"
                  onClick={() => {
                    setDistributorNav("voice-agent");
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="phone_in_talk" size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Voice Calling</span>
                    <span className="text-[10px] text-ink-muted">{proposedCallsCount} proposed calls</span>
                  </div>
                </button>
              )}

              {canRetailers && (
                <button
                  type="button"
                  onClick={() => {
                    setDistributorNav("insights");
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="sparkles" size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Insights</span>
                    <span className="text-[10px] text-ink-muted">Actionable intelligence</span>
                  </div>
                </button>
              )}

              {canReports && (
                <button
                  type="button"
                  onClick={() => {
                    setDistributorNav("reports");
                    setIsMobileMoreOpen(false);
                  }}
                  className="min-h-[48px] p-2.5 rounded-sm bg-background hover:bg-surface-raised border border-border flex items-center gap-2 text-left cursor-pointer"
                >
                  <Icon name="show_chart" size={18} className="text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-ink block">Reports &amp; P&amp;L</span>
                    <span className="text-[10px] text-ink-muted">Profit margins</span>
                  </div>
                </button>
              )}
            </div>

            {/* Logout button */}
            <div className="pt-2 border-t border-border flex items-center justify-between">
              <span className="text-xs text-ink-muted font-medium">
                Signed in as <strong>{user?.name}</strong> ({user?.distributorRole})
              </span>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 rounded-xl bg-danger/10 text-danger text-xs font-bold hover:bg-danger/20 cursor-pointer"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
