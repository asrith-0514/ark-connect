"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  Retailer,
  formatINR,
  getRetailerPurchases,
  getRetailerMonthlyTrend,
  getRetailerPreferredBrands,
  getRetailerCommunications,
  getRetailerComplaints,
  getRetailerFollowUps,
  getRetailerSegments,
  formatDateToIsoDay,
  CommunicationChannel,
  OrderStatus,
} from "@/lib/mock";
import { Badge, StatusChip, BadgeVariant } from "@/components/ui/Badge";
import { LogCommunicationModal } from "./LogCommunicationModal";
import { AddFollowUpModal } from "./AddFollowUpModal";
import { RaiseComplaintModal } from "./RaiseComplaintModal";

interface Retailer360ProfileProps {
  retailerId: string;
  onBack: () => void;
}

const getOrderStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case "Delivered":
      return "success";
    case "Submitted":
    case "Under Review":
      return "accent";
    case "Approved":
    case "Ready to Invoice":
      return "primary";
    case "Dispatched":
    case "Processing":
      return "warning";
    default:
      return "neutral";
  }
};

const getInvoiceStatusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case "Paid":
      return "success";
    case "Partially Paid":
      return "warning";
    case "Unpaid":
      return "danger";
    default:
      return "neutral";
  }
};

export const Retailer360Profile: React.FC<Retailer360ProfileProps> = ({
  retailerId,
  onBack,
}) => {
  const {
    retailers,
    orders,
    invoices,
    payments,
    communications,
    addCommunication,
    complaints,
    addComplaint,
    updateComplaintStatus,
    followUps,
    addFollowUp,
    updateFollowUpStatus,
    rescheduleFollowUp,
    reassignFollowUp,
    toggleCreditHold,
    setViewingInvoice,
    currentDate,
    setDistributorNav,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    "overview" | "purchases" | "brands" | "ledger" | "communications" | "complaints" | "followups"
  >("overview");

  // Modals state
  const [isLogCommOpen, setIsLogCommOpen] = useState(false);
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);
  const [isRaiseComplaintOpen, setIsRaiseComplaintOpen] = useState(false);
  const [commChannelFilter, setCommChannelFilter] = useState<string>("all");

  // Find retailer
  const retailer = retailers.find((r) => r.id === retailerId) || retailers[0];

  // Derived CRM metrics via selectors
  const retPurchases = useMemo(() => getRetailerPurchases(retailer.id, orders), [retailer.id, orders]);
  const monthlyTrend = useMemo(() => getRetailerMonthlyTrend(retailer.id, orders, currentDate), [retailer.id, orders, currentDate]);
  const preferredBrands = useMemo(() => getRetailerPreferredBrands(retailer.id, orders), [retailer.id, orders]);
  const retComms = useMemo(() => getRetailerCommunications(retailer.id, communications), [retailer.id, communications]);
  const retComplaints = useMemo(() => getRetailerComplaints(retailer.id, complaints), [retailer.id, complaints]);
  const retFollowUps = useMemo(() => getRetailerFollowUps(retailer.id, followUps, currentDate), [retailer.id, followUps, currentDate]);
  
  const segmentation = useMemo(
    () => getRetailerSegments(retailers, orders, invoices, {}, currentDate),
    [retailers, orders, invoices, currentDate]
  );
  const segmentMetric = useMemo(
    () => segmentation.allMetrics.find((m) => m.retailerId === retailer.id),
    [segmentation, retailer.id]
  );

  // Financial calculations
  const retInvoices = useMemo(
    () => invoices.filter((inv) => (inv.retailerId === retailer.id || inv.retailerName === retailer.name) && inv.status !== "Draft"),
    [invoices, retailer]
  );
  const retPayments = useMemo(
    () => payments.filter((p) => p.retailerId === retailer.id || p.retailerName === retailer.name),
    [payments, retailer]
  );

  const availableCredit = Math.max(0, retailer.creditLimit - retailer.outstanding);
  const creditUsagePct = retailer.creditLimit > 0 ? Math.min(100, Math.round((retailer.outstanding / retailer.creditLimit) * 100)) : 0;

  // Max value for trend chart scaling
  const maxTrendSpend = Math.max(1, ...monthlyTrend.map((m) => m.spend));

  // Channel icon helper
  const getChannelIcon = (ch: CommunicationChannel) => {
    switch (ch) {
      case "call":
        return "phone_in_talk";
      case "whatsapp":
        return "chat";
      case "visit":
        return "storefront";
      case "note":
        return "edit_note";
      case "ai-call":
        return "smart_toy";
      default:
        return "forum";
    }
  };

  const filteredComms = commChannelFilter === "all" ? retComms : retComms.filter((c) => c.channel === commChannelFilter);

  return (
    <div className="w-full flex flex-col gap-5 pb-20 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Back Action */}
      <div className="flex items-center justify-between py-1">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Back to Retailers Network</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Account Code:</span>
          <span className="px-2 py-0.5 rounded-lg bg-surface-raised border border-border font-mono text-xs font-bold text-ink">
            {retailer.code}
          </span>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="bg-surface rounded-2xl border border-border shadow-soft-sm p-5 sm:p-6 text-ink flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary font-bold text-xl flex items-center justify-center shrink-0 border border-primary/20 shadow-soft-xs">
              {retailer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                  {retailer.name}
                </h1>
                {segmentMetric && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      segmentMetric.segment === "Champions"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                        : segmentMetric.segment === "Regular"
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : segmentMetric.segment === "New"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        : segmentMetric.segment === "At risk"
                        ? "bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30"
                        : "bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-500/30"
                    }`}
                  >
                    ★ {segmentMetric.segment}
                  </span>
                )}
                {retailer.pricingTier && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-surface-raised border border-border text-ink-muted">
                    {retailer.pricingTier}
                  </span>
                )}
                {retailer.creditHold && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-danger/15 text-danger border border-danger/30 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">block</span>
                    Credit Hold
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted mt-1.5">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-ink-muted">person</span>
                  <span className="font-semibold text-ink">{retailer.ownerName}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-ink-muted">location_on</span>
                  <span>{retailer.town}, {retailer.district} ({retailer.state})</span>
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <span className="material-symbols-outlined text-[15px] text-ink-muted">receipt</span>
                  <span>{retailer.gstin}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`tel:${retailer.phone}`}
              className="h-9 px-3 rounded-xl bg-surface hover:bg-surface-raised border border-border text-ink text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-soft-xs"
            >
              <span className="material-symbols-outlined text-[16px] text-success">call</span>
              {retailer.phone}
            </a>
            <a
              href={`https://wa.me/${retailer.phone.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setDistributorNav("voice-agent")}
              className="h-9 px-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-400 border border-purple-500/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">phone_in_talk</span>
              AI Voice Call
            </button>
            <button
              type="button"
              onClick={() => setIsLogCommOpen(true)}
              className="h-9 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
              Log Call / Note
            </button>
            <button
              type="button"
              onClick={() => setIsAddFollowUpOpen(true)}
              className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-soft-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_task</span>
              + Follow-up
            </button>
            <button
              type="button"
              onClick={() => toggleCreditHold(retailer.id)}
              className={`h-9 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                retailer.creditHold
                  ? "bg-danger text-white border-danger hover:bg-danger/90"
                  : "bg-surface hover:bg-danger/10 text-danger border-border hover:border-danger/30"
              }`}
            >
              {retailer.creditHold ? "Release Hold" : "Place Hold"}
            </button>
          </div>
        </div>

        {/* Financial & Credit Meter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-background rounded-xl border border-border">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
              Credit Limit
            </span>
            <span className="text-base sm:text-lg font-mono font-bold text-ink">
              {formatINR(retailer.creditLimit)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-0.5">
              Terms: {retailer.creditTermsDays} Days
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
              Total Outstanding
            </span>
            <span className={`text-base sm:text-lg font-mono font-bold ${retailer.outstanding > 0 ? "text-primary" : "text-ink"}`}>
              {formatINR(retailer.outstanding)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-0.5">
              {creditUsagePct}% of limit utilized
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
              Overdue Balance
            </span>
            <span className={`text-base sm:text-lg font-mono font-bold ${retailer.overdue > 0 ? "text-danger" : "text-success"}`}>
              {formatINR(retailer.overdue)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-0.5">
              {retailer.overdue > 0 ? "Immediate follow-up required" : "Zero overdue dues"}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
              Available Credit
            </span>
            <span className="text-base sm:text-lg font-mono font-bold text-success">
              {formatINR(availableCredit)}
            </span>
            <span className="text-[11px] text-ink-muted block mt-0.5">
              Ready for new orders
            </span>
          </div>
        </div>

        {/* Credit Gauge Bar */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-ink-muted">Credit Line Utilization</span>
            <span className="font-mono text-ink">{creditUsagePct}%</span>
          </div>
          <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                creditUsagePct > 90
                  ? "bg-danger"
                  : creditUsagePct > 70
                  ? "bg-warning"
                  : "bg-primary"
              }`}
              style={{ width: `${Math.min(100, Math.max(3, creditUsagePct))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-0.5">
        {[
          { id: "overview", label: "Overview", icon: "dashboard" },
          { id: "purchases", label: `Purchases (${retPurchases.length})`, icon: "inventory_2" },
          { id: "brands", label: `Preferred Brands (${preferredBrands.length})`, icon: "sell" },
          { id: "ledger", label: "Ledger & Invoices", icon: "receipt_long" },
          { id: "communications", label: `Communications (${retComms.length})`, icon: "forum" },
          { id: "complaints", label: `Complaints (${retComplaints.length})`, icon: "report_problem" },
          { id: "followups", label: `Follow-ups (${retFollowUps.length})`, icon: "event_repeat" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === t.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-ink-muted hover:text-ink hover:bg-surface-raised"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Key Metrics */}
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-surface border border-border shadow-soft-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  12M Total Spend
                </span>
                <span className="text-lg font-mono font-bold text-ink mt-1 block">
                  {formatINR(segmentMetric?.totalSpend12m || 0)}
                </span>
                <span className="text-[11px] text-ink-muted block mt-0.5">
                  {retPurchases.length} total shipments
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border shadow-soft-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  12M Boxes
                </span>
                <span className="text-lg font-mono font-bold text-ink mt-1 block">
                  {segmentMetric?.boxes12m || 0}
                </span>
                <span className="text-[11px] text-ink-muted block mt-0.5">
                  {(segmentMetric?.boxes12m || 0) * 10} pieces
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border shadow-soft-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  On-Time Payments
                </span>
                <span className="text-lg font-mono font-bold text-success mt-1 block">
                  {segmentMetric?.onTimePaymentPct || 85}%
                </span>
                <span className="text-[11px] text-ink-muted block mt-0.5">
                  Avg pay cycle: {segmentMetric?.avgDaysToPay || 22}d
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-border shadow-soft-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                  Last Order
                </span>
                <span className="text-lg font-mono font-bold text-ink mt-1 block">
                  {segmentMetric?.daysSinceLastOrder}d ago
                </span>
                <span className="text-[11px] text-ink-muted block mt-0.5">
                  {segmentMetric?.lastOrderDate}
                </span>
              </div>
            </div>

            {/* Recent Purchases Mini Table */}
            <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>
                  Recent Orders &amp; Dispatches
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab("purchases")}
                  className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                >
                  View All Orders →
                </button>
              </div>

              <div className="divide-y divide-border">
                {retPurchases.slice(0, 4).map((o) => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-ink">{o.orderNumber}</span>
                      <span className="text-ink-muted ml-2">· {o.date}</span>
                      <div className="text-[11px] text-ink-muted mt-0.5">
                        {o.totalBoxes} boxes ({o.items.map((i) => i.brand).filter((v, i, a) => a.indexOf(v) === i).join(", ")})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-ink block">{formatINR(o.grandTotal)}</span>
                      <StatusChip variant={getOrderStatusVariant(o.status)} size="sm">
                        {o.status}
                      </StatusChip>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Column: Contacts & Open Follow-ups */}
          <div className="space-y-5">
            {/* Open Follow-up Callout */}
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">priority_high</span>
                  Pending Tasks
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddFollowUpOpen(true)}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  + Add
                </button>
              </div>
              {retFollowUps.filter((f) => f.status === "open").length === 0 ? (
                <p className="text-xs text-ink-muted">No pending follow-ups scheduled.</p>
              ) : (
                <div className="space-y-2 mt-2">
                  {retFollowUps.filter((f) => f.status === "open").slice(0, 3).map((f) => (
                    <div key={f.id} className="p-2.5 rounded-lg bg-surface border border-border text-xs">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          f.isMissed ? "bg-danger/10 text-danger" : f.isToday ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"
                        }`}>
                          {f.isMissed ? "Missed" : f.isToday ? "Due Today" : "Upcoming"}
                        </span>
                        <span className="font-mono text-[11px] text-ink-muted">{f.dueDate}</span>
                      </div>
                      <p className="text-ink font-medium mt-1 text-[11px] line-clamp-2">{f.notes}</p>
                      <div className="text-[10px] text-ink-muted mt-1">Assigned: {f.assignedTo}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Store Information Card */}
            <div className="p-4 rounded-xl bg-surface border border-border text-xs space-y-2.5">
              <h4 className="font-bold text-ink uppercase tracking-wider text-[10px]">
                Authorized Partner Details
              </h4>
              <div>
                <span className="text-ink-muted block text-[11px]">Primary Contact</span>
                <span className="font-semibold text-ink">{retailer.ownerName}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Phone / Mobile</span>
                <span className="font-mono font-semibold text-ink">{retailer.phone}</span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">Commercial Address</span>
                <span className="text-ink leading-relaxed">
                  Main Road, {retailer.town}, {retailer.district}, {retailer.state}
                </span>
              </div>
              <div>
                <span className="text-ink-muted block text-[11px]">GSTIN</span>
                <span className="font-mono font-bold text-ink">{retailer.gstin}</span>
              </div>
            </div>

            {/* Voice Calling & Telephony Profile */}
            <div className="p-4 rounded-xl bg-surface border border-border text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-ink uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-purple-600">phone_in_talk</span>
                  Voice Agent Telephony
                </h4>
                <button
                  type="button"
                  onClick={() => setDistributorNav("voice-agent")}
                  className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  Manage
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div>
                  <span className="text-ink-muted block text-[10px]">Preferred Language</span>
                  <span className="font-semibold text-ink">
                    {retailer.preferredLanguage === "te"
                      ? "తెలుగు (Telugu)"
                      : retailer.preferredLanguage === "hi"
                      ? "Hindi"
                      : retailer.preferredLanguage === "ta"
                      ? "Tamil"
                      : "English"}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[10px]">Phone Consent</span>
                  <span
                    className={`font-semibold ${
                      retailer.phoneConsent !== false ? "text-success" : "text-danger"
                    }`}
                  >
                    {retailer.phoneConsent !== false ? "✓ Granted" : "✕ Revoked"}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[10px]">Calling Status</span>
                  <span
                    className={`font-semibold ${
                      retailer.doNotCall ? "text-danger" : "text-success"
                    }`}
                  >
                    {retailer.doNotCall ? "DNC Active (No calls)" : "Eligible for calls"}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[10px]">Quiet Hours</span>
                  <span className="font-mono text-ink">
                    {retailer.quietHours
                      ? `${retailer.quietHours.start} - ${retailer.quietHours.end}`
                      : "21:00 - 09:00"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Purchases (12-Month History & Trend Chart) */}
      {activeTab === "purchases" && (
        <div className="space-y-6">
          {/* Trend Chart */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">show_chart</span>
                  12-Month Purchase Volume Trend
                </h3>
                <p className="text-xs text-ink-muted">Wholesale spend (₹) and box volume per month</p>
              </div>
              <span className="text-xs font-mono font-bold text-primary">
                Total: {formatINR(monthlyTrend.reduce((s, m) => s + m.spend, 0))}
              </span>
            </div>

            {/* Bar & Column Chart */}
            <div className="h-44 flex items-end gap-2 pt-6 pb-2 border-b border-border">
              {monthlyTrend.map((m, idx) => {
                const heightPct = Math.max(8, Math.round((m.spend / maxTrendSpend) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-ink text-surface text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-soft-md z-10">
                      {m.month}: {formatINR(m.spend)} ({m.boxes} bxs)
                    </div>

                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        m.spend > 0
                          ? "bg-primary hover:bg-primary/80 group-hover:scale-y-105"
                          : "bg-surface-raised"
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-ink-muted mt-2 font-mono truncate max-w-full">
                      {m.month.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Purchases Table */}
          <div className="bg-surface rounded-2xl border border-border shadow-soft-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink">All Purchase Orders ({retPurchases.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-raised border-b border-border text-ink-muted uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Boxes</th>
                    <th className="p-3 text-right">Pieces</th>
                    <th className="p-3 text-right">Amount (₹)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Transport LR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {retPurchases.map((o) => (
                    <tr key={o.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="p-3 font-bold font-mono text-ink">{o.orderNumber}</td>
                      <td className="p-3 text-ink-muted">{o.date}</td>
                      <td className="p-3 text-right font-mono">{o.totalBoxes}</td>
                      <td className="p-3 text-right font-mono">{o.totalPieces}</td>
                      <td className="p-3 text-right font-mono font-bold text-ink">{formatINR(o.grandTotal)}</td>
                      <td className="p-3">
                        <StatusChip variant={getOrderStatusVariant(o.status)} size="sm">
                          {o.status}
                        </StatusChip>
                      </td>
                      <td className="p-3 font-mono text-ink-muted text-[11px]">{o.lrNumber || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Preferred Brands */}
      {activeTab === "brands" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm space-y-4">
            <h3 className="font-bold text-sm text-ink flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">pie_chart</span>
              Preferred Brand Spend Share
            </h3>

            <div className="space-y-3">
              {preferredBrands.map((b) => (
                <div key={b.brand} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-ink font-bold">{b.brand}</span>
                    <span className="font-mono text-ink">
                      {formatINR(b.spend)} ({b.sharePct}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${b.sharePct}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-ink-muted">{b.boxes} boxes ordered in last 12 months</div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm space-y-3">
            <h3 className="font-bold text-sm text-ink">Category Opportunity Rationale</h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              Based on wholesale reorder history, <span className="font-semibold text-ink">{retailer.name}</span> concentrates{" "}
              {preferredBrands[0]?.sharePct || 50}% of their purchases on{" "}
              <span className="font-semibold text-primary">{preferredBrands[0]?.brand || "Within"}</span>.
            </p>
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs text-primary space-y-1">
              <div className="font-bold">Recommended Cross-Selling Action:</div>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                Offer introductory sample cartons of complementary product lines during next ordering cycle to increase ticket size.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Ledger & Invoices */}
      {activeTab === "ledger" && (
        <div className="space-y-5">
          <div className="bg-surface rounded-2xl border border-border shadow-soft-sm overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-sm text-ink">Invoices Statement ({retInvoices.length})</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-raised border-b border-border text-ink-muted uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Billed Date</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3 text-right">Total (₹)</th>
                    <th className="p-3 text-right">Paid (₹)</th>
                    <th className="p-3 text-right">Balance Due (₹)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {retInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-surface-raised/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-ink">{inv.invoiceNumber}</td>
                      <td className="p-3 text-ink-muted">{inv.billedDate}</td>
                      <td className="p-3 text-ink-muted">{inv.dueDate}</td>
                      <td className="p-3 text-right font-mono font-bold text-ink">{formatINR(inv.grandTotal)}</td>
                      <td className="p-3 text-right font-mono text-success">{formatINR(inv.paid)}</td>
                      <td className="p-3 text-right font-mono font-bold text-danger">{formatINR(inv.balanceDue)}</td>
                      <td className="p-3">
                        <StatusChip variant={getInvoiceStatusVariant(inv.status)} size="sm">
                          {inv.status}
                        </StatusChip>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setViewingInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg bg-surface border border-border hover:bg-surface-raised text-primary font-semibold text-[11px] cursor-pointer"
                        >
                          View Bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Communications Timeline */}
      {activeTab === "communications" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "all", label: "All" },
                { id: "call", label: "Calls" },
                { id: "whatsapp", label: "WhatsApp" },
                { id: "visit", label: "Visits" },
                { id: "note", label: "Notes" },
                { id: "ai-call", label: "AI Calls" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setCommChannelFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                    commChannelFilter === f.id
                      ? "bg-primary text-primary-foreground shadow-soft-xs"
                      : "bg-surface border border-border text-ink-muted hover:text-ink"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsLogCommOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-soft-xs hover:bg-primary/90 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
              Log Interaction
            </button>
          </div>

          {/* Timeline List */}
          <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm space-y-4">
            {filteredComms.length === 0 ? (
              <div className="text-center py-8 text-ink-muted text-xs">
                No communications recorded under this channel.
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-border space-y-6">
                {filteredComms.map((comm) => (
                  <div key={comm.id} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className="absolute -left-[35px] top-0 w-8 h-8 rounded-full bg-surface border-2 border-primary/40 flex items-center justify-center text-primary shadow-soft-xs">
                      <span className="material-symbols-outlined text-[16px]">
                        {getChannelIcon(comm.channel)}
                      </span>
                    </div>

                    <div className="bg-background p-3.5 rounded-xl border border-border">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary">
                            {comm.channel}
                          </span>
                          <span className="text-xs font-semibold text-ink-muted">
                            {comm.direction === "inbound" ? "← Inbound" : "→ Outbound"}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-ink-muted">
                          {new Date(comm.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-ink mt-2 leading-relaxed">{comm.summary}</p>
                      <div className="text-[10px] text-ink-muted mt-2 font-medium">
                        Recorded by: <span className="font-semibold text-ink">{comm.createdBy}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Complaints */}
      {activeTab === "complaints" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-ink">Retailer Complaints &amp; Issue Tickets ({retComplaints.length})</h3>
            <button
              type="button"
              onClick={() => setIsRaiseComplaintOpen(true)}
              className="px-4 py-2 rounded-xl bg-danger text-white text-xs font-bold flex items-center gap-1.5 shadow-soft-xs hover:bg-danger/90 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">report_problem</span>
              Raise Complaint
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm">
            {retComplaints.length === 0 ? (
              <div className="text-center py-8 text-ink-muted text-xs">
                Zero complaints recorded. Customer satisfaction record is clean!
              </div>
            ) : (
              <div className="divide-y divide-border">
                {retComplaints.map((c) => (
                  <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          c.status === "resolved"
                            ? "bg-success/15 text-success"
                            : c.status === "in-progress"
                            ? "bg-warning/15 text-warning"
                            : "bg-danger/15 text-danger"
                        }`}>
                          {c.status}
                        </span>
                        <span className="font-bold text-xs text-ink uppercase tracking-wider">
                          Type: {c.type}
                        </span>
                        {c.linkedOrderId && (
                          <span className="text-[11px] font-mono text-ink-muted">PO: {c.linkedOrderId}</span>
                        )}
                        {c.linkedInvoiceId && (
                          <span className="text-[11px] font-mono text-ink-muted">Inv: {c.linkedInvoiceId}</span>
                        )}
                      </div>
                      <p className="text-xs text-ink leading-relaxed">{c.notes}</p>
                      <div className="text-[11px] text-ink-muted">
                        Assigned to: <span className="font-semibold text-ink">{c.assignee}</span> · Logged:{" "}
                        {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                    </div>

                    {c.status !== "resolved" && (
                      <button
                        type="button"
                        onClick={() => updateComplaintStatus(c.id, "resolved", "Resolved and credited")}
                        className="px-3 py-1.5 rounded-lg bg-success/10 hover:bg-success/20 text-success text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        Mark Resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 7: Follow-ups */}
      {activeTab === "followups" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-ink">Scheduled Action Items &amp; Reminders ({retFollowUps.length})</h3>
            <button
              type="button"
              onClick={() => setIsAddFollowUpOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-soft-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_task</span>
              + Follow-up
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-surface border border-border shadow-soft-sm">
            {retFollowUps.length === 0 ? (
              <div className="text-center py-8 text-ink-muted text-xs">
                No follow-ups currently scheduled for this retailer.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {retFollowUps.map((f) => (
                  <div key={f.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          f.status === "done"
                            ? "bg-surface-raised text-ink-muted"
                            : f.isMissed
                            ? "bg-danger/15 text-danger"
                            : f.isToday
                            ? "bg-warning/15 text-warning"
                            : "bg-primary/10 text-primary"
                        }`}>
                          {f.status === "done" ? "Done" : f.isMissed ? "Missed" : f.isToday ? "Due Today" : "Upcoming"}
                        </span>
                        <span className="text-xs font-bold text-ink uppercase tracking-wider">
                          Type: {f.type}
                        </span>
                        <span className="font-mono text-xs text-ink-muted font-bold">Due: {f.dueDate}</span>
                        {f.promisedAmount && (
                          <span className="font-mono text-xs font-bold text-success">
                            Promised: {formatINR(f.promisedAmount)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink leading-relaxed font-medium">{f.notes}</p>
                      <div className="text-[11px] text-ink-muted">
                        Assignee: <span className="font-semibold text-ink">{f.assignedTo}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {f.status === "open" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              const nextWeek = new Date();
                              nextWeek.setDate(nextWeek.getDate() + 7);
                              rescheduleFollowUp(f.id, nextWeek.toISOString().split("T")[0]);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-surface border border-border hover:bg-surface-raised text-xs font-semibold text-ink transition-colors cursor-pointer"
                          >
                            +7 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => updateFollowUpStatus(f.id, "done")}
                            className="px-3 py-1.5 rounded-lg bg-success hover:bg-success/90 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Mark Done
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-success font-semibold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">check_circle</span>
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <LogCommunicationModal
        retailerId={retailer.id}
        retailerName={retailer.name}
        isOpen={isLogCommOpen}
        onClose={() => setIsLogCommOpen(false)}
        onSave={addCommunication}
      />

      <AddFollowUpModal
        retailers={retailers}
        preselectedRetailerId={retailer.id}
        isOpen={isAddFollowUpOpen}
        onClose={() => setIsAddFollowUpOpen(false)}
        onSave={addFollowUp}
      />

      <RaiseComplaintModal
        retailerId={retailer.id}
        retailerName={retailer.name}
        orders={orders}
        invoices={invoices}
        isOpen={isRaiseComplaintOpen}
        onClose={() => setIsRaiseComplaintOpen(false)}
        onSave={addComplaint}
      />
    </div>
  );
};
