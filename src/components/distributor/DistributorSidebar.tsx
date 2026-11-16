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
    followUps,
    currentDate,
    callTasks,
  } = useApp();
  const { user, hasPermission, logout } = useAuth();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(() => {
    // Keep More open if an item under More is active
    return ["reports", "follow-ups", "segments", "insights", "voice-agent"].includes(distributorNav);
  });
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  // Grouped follow-ups & live badge
  const followUpGrouped = getFollowUpsGrouped(followUps, currentDate);
  const followUpBadge = followUpGrouped.counts.missed + followUpGrouped.counts.today;
  const proposedCallsCount = callTasks ? callTasks.filter((t) => t.status === "proposed").length : 0;

  // Action-only counts
  const visibleOrders = orders.filter(o => o.status !== "Draft");
  const needsReviewCount = visibleOrders.filter(o => o.status === "Submitted").length;
  const pendingApprovals = retailers.filter(r => r.status === "Needs Approval").length;
  const overdueRetailersCount = retailers.filter(r => r.overdue > 0).length;

  const isMoreActive = ["reports", "follow-ups", "segments", "insights", "voice-agent"].includes(distributorNav);

  const navItem = (
    id: string,
    label: string,
    icon: string,
    badge?: { count: number; alert?: boolean }
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
                ? "bg-danger/15 text-danger border border-danger/25"
                : "bg-surface-raised text-ink-muted border border-border"
            }`}
          >
            {badge.count}
          </span>
        )}
      </button>
    );
  };

  const moreSubItem = (
    id: string,
    label: string,
    icon: string,
    badge?: { count: number; alert?: boolean }
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
        className={`w-full flex items-center justify-between pl-7 pr-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
          isActive
            ? "bg-primary/10 text-primary font-bold"
            : "text-ink-muted hover:text-ink hover:bg-surface-raised"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon name={icon} size={15} className={isActive ? "text-primary" : "text-ink-muted"} />
          <span className="truncate">{label}</span>
        </div>
        {badge && badge.count > 0 && (
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-danger/15 text-danger">
            {badge.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* 1. Desktop Fixed Left Sidebar */}
      <aside
        aria-label="Distributor Backoffice Navigation"
        className={`hidden lg:flex flex-col border-r border-border bg-surface shrink-0 h-screen sticky top-0 transition-all duration-200 z-30 select-none ${
          isCollapsed ? "w-[72px]" : "w-[240px]"
        }`}
      >
        {/* Brand Header */}
        <div className="h-14 px-3.5 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <ArkMonogram size={30} variant="gradient" />
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-xs tracking-tight text-ink font-sans">
                  ARK Distributors
                </span>
                <span className="text-[10px] text-ink-muted font-mono truncate">
                  Secunderabad Hub
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(prev => !prev)}
            className="w-7 h-7 rounded-lg hover:bg-surface-raised text-ink-muted hover:text-ink flex items-center justify-center transition-colors cursor-pointer"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Icon name={isCollapsed ? "chevron_right" : "chevron_left"} size={16} />
          </button>
        </div>

        {/* 8 Main Navigation Items */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          {/* 1. Today */}
          {hasPermission("canViewDashboard") &&
            navItem("dashboard", "Today", "today")}

          {/* 2. Orders (Badge: needs review count) */}
          {hasPermission("canViewOrders") &&
            navItem("orders", "Orders", "inventory_2", {
              count: needsReviewCount,
              alert: needsReviewCount > 0,
            })}

          {/* 3. Retailers (Badge: pending approvals) */}
          {hasPermission("canViewRetailers") &&
            navItem("retailers", "Retailers", "storefront", {
              count: pendingApprovals,
              alert: pendingApprovals > 0,
            })}

          {/* 4. Invoices */}
          {hasPermission("canViewInvoices") &&
            navItem("invoices", "Invoices", "receipt")}

          {/* 5. Receivables (Badge: overdue stores count) */}
          {hasPermission("canViewReceivables") &&
            navItem("receivables", "Receivables", "account_balance_wallet", {
              count: overdueRetailersCount,
              alert: overdueRetailersCount > 0,
            })}

          {/* 6. Products */}
          {hasPermission("canViewProducts") &&
            navItem("products-pricing", "Products", "layers")}

          {/* 7. Suppliers and bills */}
          {hasPermission("canViewSuppliers") &&
            navItem("suppliers", "Suppliers and bills", "factory")}

          {/* 8. More (Opens Reports, Follow-ups, Segments, Insights, Voice calling) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsMoreOpen(prev => !prev)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all duration-150 cursor-pointer ${
                isMoreActive
                  ? "bg-primary/10 text-primary font-bold border border-primary/25"
                  : "text-ink-muted hover:bg-surface-raised hover:text-ink font-medium"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon name="apps" size={18} className={isMoreActive ? "text-primary" : "text-ink-muted"} />
                {!isCollapsed && <span className="font-sans">More</span>}
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-1.5">
                  {(followUpBadge > 0 || proposedCallsCount > 0) && (
                    <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                  )}
                  <Icon
                    name={isMoreOpen ? "expand_less" : "expand_more"}
                    size={16}
                    className="text-ink-muted"
                  />
                </div>
              )}
            </button>

            {/* Sub-items under More */}
            {isMoreOpen && !isCollapsed && (
              <div className="mt-1 space-y-0.5 animate-in fade-in duration-150">
                {hasPermission("canViewReports") &&
                  moreSubItem("reports", "Reports & P&L", "analytics")}
                {hasPermission("canViewRetailers") &&
                  moreSubItem("follow-ups", "Follow-ups", "event_repeat", {
                    count: followUpBadge,
                    alert: followUpGrouped.counts.missed > 0,
                  })}
                {hasPermission("canViewRetailers") &&
                  moreSubItem("segments", "Segments", "pie_chart")}
                {hasPermission("canViewRetailers") &&
                  moreSubItem("insights", "Insights", "insights")}
                {hasPermission("canViewRetailers") &&
                  moreSubItem("voice-agent", "Voice calling", "phone_in_talk", {
                    count: proposedCallsCount,
                    alert: proposedCallsCount > 0,
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Pinned Bottom Footer (GSTIN & Staff Account) */}
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

      {/* 2. Mobile Floating Bar (< 1024px) for the Owner on his phone */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none pb-[calc(env(safe-area-inset-bottom,0px)+8px)] px-3 max-w-lg mx-auto">
        <nav
          aria-label="Distributor Mobile Navigation"
          className="pointer-events-auto w-full bg-surface/95 backdrop-blur-xl text-ink rounded-2xl p-1.5 border border-border shadow-soft-lg flex items-center justify-around select-none"
        >
          {/* Today */}
          <button
            type="button"
            onClick={() => setDistributorNav("dashboard")}
            className={`min-h-[48px] py-1 px-2.5 rounded-xl flex flex-col items-center justify-center cursor-pointer ${
              distributorNav === "dashboard" ? "text-primary font-bold bg-primary/10" : "text-ink-muted"
            }`}
          >
            <Icon name="today" size={20} />
            <span className="text-[10px] font-sans mt-0.5 leading-none">Today</span>
          </button>

          {/* Orders */}
          <button
            type="button"
            onClick={() => setDistributorNav("orders")}
            className={`min-h-[48px] py-1 px-2.5 rounded-xl flex flex-col items-center justify-center cursor-pointer ${
              distributorNav === "orders" ? "text-primary font-bold bg-primary/10" : "text-ink-muted"
            }`}
          >
            <Icon name="inventory_2" size={20} />
            <span className="text-[10px] font-sans mt-0.5 leading-none">Orders</span>
          </button>

          {/* Invoices */}
          <button
            type="button"
            onClick={() => setDistributorNav("invoices")}
            className={`min-h-[48px] py-1 px-2.5 rounded-xl flex flex-col items-center justify-center cursor-pointer ${
              distributorNav === "invoices" ? "text-primary font-bold bg-primary/10" : "text-ink-muted"
            }`}
          >
            <Icon name="receipt" size={20} />
            <span className="text-[10px] font-sans mt-0.5 leading-none">Invoices</span>
          </button>

          {/* Receivables */}
          <button
            type="button"
            onClick={() => setDistributorNav("receivables")}
            className={`min-h-[48px] py-1 px-2.5 rounded-xl flex flex-col items-center justify-center cursor-pointer ${
              distributorNav === "receivables" ? "text-primary font-bold bg-primary/10" : "text-ink-muted"
            }`}
          >
            <Icon name="account_balance_wallet" size={20} />
            <span className="text-[10px] font-sans mt-0.5 leading-none">Receivables</span>
          </button>

          {/* More Sheet Trigger */}
          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(prev => !prev)}
            className={`min-h-[48px] py-1 px-2.5 rounded-xl flex flex-col items-center justify-center cursor-pointer ${
              isMoreActive ? "text-primary font-bold bg-primary/10" : "text-ink-muted"
            }`}
          >
            <Icon name="apps" size={20} />
            <span className="text-[10px] font-sans mt-0.5 leading-none">More</span>
          </button>
        </nav>
      </div>

      {/* Mobile More Sheet Modal */}
      {isMobileMoreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center p-3 sm:hidden"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div
            className="w-full bg-surface rounded-2xl p-4 border border-border shadow-soft-xl flex flex-col gap-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-sm font-bold text-ink">More sections</span>
              <button
                type="button"
                onClick={() => setIsMobileMoreOpen(false)}
                className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-ink-muted"
              >
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setDistributorNav("products-pricing"); setIsMobileMoreOpen(false); }}
                className="p-3 rounded-xl bg-background border border-border flex items-center gap-2 text-xs font-semibold text-ink"
              >
                <Icon name="layers" size={16} className="text-primary" />
                <span>Products</span>
              </button>

              <button
                type="button"
                onClick={() => { setDistributorNav("suppliers"); setIsMobileMoreOpen(false); }}
                className="p-3 rounded-xl bg-background border border-border flex items-center gap-2 text-xs font-semibold text-ink"
              >
                <Icon name="factory" size={16} className="text-primary" />
                <span>Suppliers & bills</span>
              </button>

              <button
                type="button"
                onClick={() => { setDistributorNav("reports"); setIsMobileMoreOpen(false); }}
                className="p-3 rounded-xl bg-background border border-border flex items-center gap-2 text-xs font-semibold text-ink"
              >
                <Icon name="analytics" size={16} className="text-primary" />
                <span>Reports</span>
              </button>

              <button
                type="button"
                onClick={() => { setDistributorNav("follow-ups"); setIsMobileMoreOpen(false); }}
                className="p-3 rounded-xl bg-background border border-border flex items-center gap-2 text-xs font-semibold text-ink"
              >
                <Icon name="event_repeat" size={16} className="text-primary" />
                <span>Follow-ups ({followUpBadge})</span>
              </button>

              <button
                type="button"
                onClick={() => { setDistributorNav("segments"); setIsMobileMoreOpen(false); }}
                className="p-3 rounded-xl bg-background border border-border flex items-center gap-2 text-xs font-semibold text-ink"
              >
                <Icon name="pie_chart" size={16} className="text-primary" />
                <span>Segments</span>
              </button>

              <button
                type="button"
                onClick={() => { setDistributorNav("insights"); setIsMobileMoreOpen(false); }}
                className="p-3 rounded-xl bg-background border border-border flex items-center gap-2 text-xs font-semibold text-ink"
              >
                <Icon name="insights" size={16} className="text-primary" />
                <span>Insights</span>
              </button>

              <button
                type="button"
                onClick={() => { setDistributorNav("voice-agent"); setIsMobileMoreOpen(false); }}
                className="col-span-2 p-3 rounded-xl bg-background border border-border flex items-center justify-between text-xs font-semibold text-ink"
              >
                <div className="flex items-center gap-2">
                  <Icon name="phone_in_talk" size={16} className="text-primary" />
                  <span>Voice calling queue</span>
                </div>
                {proposedCallsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                    {proposedCallsCount} proposed
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
