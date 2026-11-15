"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Order } from "@/data/mockData";
import { formatINR, isDemoModeEnabled } from "@/lib/mock/retailer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

export default function MyOrdersView() {
  const {
    orders,
    updateOrderStatus,
    deleteOrder,
    setRetailerNav,
    orderTabFilter,
    setOrderTabFilter,
    clearCart,
    addToCart,
    setIsReviewOrderOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>(orderTabFilter || "all");
  const [demoState, setDemoState] = useState<"orders" | "empty" | "skeleton">("orders");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [searchPO, setSearchPO] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [copiedLR, setCopiedLR] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (orderTabFilter) {
      setActiveTab(orderTabFilter);
    }
  }, [orderTabFilter]);

  useEffect(() => {
    setIsDemo(isDemoModeEnabled());
    if (typeof window !== "undefined") {
      const stateParam = new URLSearchParams(window.location.search).get("state");
      if (stateParam === "empty") setDemoState("empty");
      if (stateParam === "skeleton" || stateParam === "loading") setDemoState("skeleton");
    }
  }, []);

  // Requirement 5: Counts derived matching Home metrics
  const draftCount = orders.filter(o => o.status === "Draft").length;
  const inReviewCount = orders.filter(o =>
    ["Submitted", "Approved", "Confirmed", "Processing"].includes(o.status)
  ).length;
  const dispatchedCount = orders.filter(o => o.status === "Dispatched").length;
  const deliveredCount = orders.filter(o => o.status === "Delivered").length;
  const activePipelineCount = inReviewCount + dispatchedCount;
  const closedCount = deliveredCount + orders.filter(o => o.status === "Cancelled").length;

  // Filter orders by tab, PO search, and date range
  const filteredOrders = orders.filter(order => {
    // 1. Tab filter
    if (activeTab === "in-review") {
      if (!["Submitted", "Approved", "Confirmed", "Processing"].includes(order.status)) return false;
    } else if (activeTab === "dispatched") {
      if (order.status !== "Dispatched") return false;
    } else if (activeTab === "delivered") {
      if (order.status !== "Delivered") return false;
    } else if (activeTab === "draft") {
      if (order.status !== "Draft") return false;
    } else if (activeTab === "active") {
      if (!["Submitted", "Approved", "Confirmed", "Processing", "Dispatched"].includes(order.status)) return false;
    } else if (activeTab === "closed") {
      if (order.status !== "Delivered" && order.status !== "Cancelled") return false;
    }

    // 2. PO Number search filter (Requirement 4)
    if (searchPO.trim()) {
      const query = searchPO.trim().toLowerCase().replace("#", "");
      const poNum = order.orderNumber.toLowerCase().replace("#", "");
      if (!poNum.includes(query)) return false;
    }

    // 3. Date range filter (Requirement 4)
    if (dateFilter !== "all") {
      const dateStr = order.date.toLowerCase();
      if (dateFilter === "oct-2026" && !dateStr.includes("oct 2026")) return false;
      if (dateFilter === "sep-2026" && !dateStr.includes("sep 2026")) return false;
    }

    return true;
  });

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setOrderTabFilter(tabId);
  };

  const handleConfirmOrder = (orderId: string) => {
    updateOrderStatus(orderId, "Confirmed");
  };

  // Requirement 2: Resume editing draft PO
  const handleResumeEditing = (order: Order) => {
    clearCart();
    if (order.items && order.items.length > 0) {
      addToCart(order.items);
    }
    setRetailerNav("catalogue");
  };

  // Requirement 2: Delete draft PO
  const handleDeleteDraft = (orderId: string) => {
    deleteOrder(orderId);
  };

  // Requirement 3: Copy LR helper
  const handleCopyLR = (lr: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(lr);
      setCopiedLR(true);
      setTimeout(() => setCopiedLR(false), 2000);
    }
  };

  // Requirement 1: Distinct status chip colours using semantic tokens
  const renderStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "Draft":
        return (
          <Badge variant="neutral" size="sm" dot>
            Draft
          </Badge>
        );
      case "Submitted":
      case "Approved":
      case "Confirmed":
      case "Processing":
        return (
          <Badge variant="warning" size="sm" dot pulse>
            {status === "Approved" ? "Approved • Confirm Now" : "In Review"}
          </Badge>
        );
      case "Dispatched":
        return (
          <Badge variant="primary" size="sm" dot>
            Dispatched
          </Badge>
        );
      case "Delivered":
        return (
          <Badge variant="success" size="sm" dot>
            Delivered
          </Badge>
        );
      default:
        return (
          <Badge variant="neutral" size="sm">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24 text-ink">
      {/* 1. Urgent Action Banner for Approved Orders */}
      {orders.some(o => o.status === "Approved") && (
        <section className="bg-primary text-primary-foreground rounded-xl p-5 shadow-soft-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Action Required
                </span>
                <span className="text-xs text-primary-foreground/80 font-mono num">#ARK-8897</span>
              </div>
              <p className="text-sm sm:text-base font-semibold mt-1">
                Order #ARK-8897 is approved by wholesaler. Confirm to release for processing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleConfirmOrder("ARK-8897")}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-md bg-surface text-ink hover:bg-background font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-soft-sm transition-all shrink-0 active:scale-98 cursor-pointer border border-border"
          >
            <span>Confirm Order</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </section>
      )}

      {/* 2. Order Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-page-title text-2xl sm:text-3xl text-ink font-normal">
            Wholesale Purchase Orders
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time status updates from ARK Distributors, Secunderabad Hub
          </p>
        </div>

        {/* State Demo Switcher */}
        {isDemo && (
          <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-lg self-start sm:self-auto shadow-soft-sm">
            <button
              type="button"
              onClick={() => setDemoState("orders")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                demoState === "orders"
                  ? "bg-primary text-primary-foreground shadow-soft-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setDemoState("empty")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                demoState === "empty"
                  ? "bg-primary text-primary-foreground shadow-soft-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Empty
            </button>
            <button
              type="button"
              onClick={() => setDemoState("skeleton")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                demoState === "skeleton"
                  ? "bg-primary text-primary-foreground shadow-soft-sm"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              Skeleton
            </button>
          </div>
        )}
      </div>

      {/* Requirement 4: Search Box for PO number and Date-Range Filter */}
      <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border shadow-soft-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search PO Number */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-3 text-ink-muted text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchPO}
            onChange={e => setSearchPO(e.target.value)}
            placeholder="Search PO number (e.g. ARK-8841, 8902)..."
            className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-md bg-background border border-border text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono num shadow-soft-sm"
          />
          {searchPO && (
            <button
              type="button"
              onClick={() => setSearchPO("")}
              className="absolute right-3 top-3 text-ink-muted hover:text-ink cursor-pointer"
              aria-label="Clear PO search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <span className="material-symbols-outlined text-ink-muted text-[18px] hidden sm:inline">
            calendar_today
          </span>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full sm:w-auto min-h-[44px] px-3.5 py-2 rounded-md bg-surface border border-border text-xs font-semibold text-ink outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-soft-sm"
          >
            <option value="all">All Dates</option>
            <option value="oct-2026">October 2026</option>
            <option value="sep-2026">September 2026</option>
          </select>

          {(searchPO || dateFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchPO("");
                setDateFilter("all");
              }}
              className="text-xs font-semibold text-primary hover:underline px-2 whitespace-nowrap cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Empty State Variant */}
      {demoState === "empty" && (
        <div className="bg-surface rounded-xl p-8 sm:p-12 shadow-soft-sm border border-border text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">inventory_2</span>
          </div>
          <h2 className="text-lg font-bold text-ink font-sans">No purchase orders found</h2>
          <p className="text-xs text-ink-muted max-w-sm">
            When you place wholesale purchase orders, they will appear here with live tracking, stock allocation, and lorry transport updates.
          </p>
          <button
            type="button"
            onClick={() => setRetailerNav("catalogue")}
            className="mt-3 min-h-[44px] px-5 py-2.5 rounded-md bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-soft-sm hover:opacity-90 transition-opacity"
          >
            <span>Browse Brand Catalogue</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* 4. Skeleton State Variant */}
      {demoState === "skeleton" && (
        <div className="space-y-4">
          <Skeleton variant="rounded" height={40} width={260} />
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-xl p-5 border border-border shadow-soft-sm space-y-3">
              <div className="flex justify-between">
                <Skeleton variant="text" width={120} height={20} />
                <Skeleton variant="text" width={80} height={20} />
              </div>
              <Skeleton variant="rounded" height={48} />
              <div className="flex justify-between">
                <Skeleton variant="text" width={140} height={16} />
                <Skeleton variant="text" width={100} height={24} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Realistic Orders State */}
      {demoState === "orders" && (
        <div className="space-y-4">
          {/* Requirement 5: Filter Tabs matching Home metrics */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: "all", label: `All (${orders.length})` },
              { id: "active", label: `Active Pipeline (${activePipelineCount})` },
              { id: "in-review", label: `In Review (${inReviewCount})` },
              { id: "dispatched", label: `Dispatched (${dispatchedCount})` },
              { id: "delivered", label: `Delivered (${deliveredCount})` },
              { id: "draft", label: `Drafts (${draftCount})` },
              { id: "closed", label: `Closed (${closedCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-soft-sm font-bold"
                    : "bg-surface hover:bg-background text-ink-muted border border-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders Cards List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-xl border border-border shadow-soft-sm text-ink">
              <span className="material-symbols-outlined text-[40px] text-ink-muted">
                search_off
              </span>
              <h3 className="text-sm font-bold text-ink mt-2 font-sans">
                No orders match your filter criteria
              </h3>
              <p className="text-xs text-ink-muted mt-1">
                Try adjusting the search query, date filter, or tab selection.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setOrderTabFilter("all");
                  setSearchPO("");
                  setDateFilter("all");
                }}
                className="mt-3 min-h-[36px] px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold cursor-pointer shadow-soft-sm hover:opacity-90"
              >
                Show All Orders
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const brandsList =
                  Array.from(new Set(order.items.map(i => i.brand))).join(", ") || "Multi-brand";

                return (
                  <article
                    key={order.id}
                    className="bg-surface rounded-xl p-5 shadow-soft-sm border border-border hover:shadow-soft-md transition-all duration-200 ease-out space-y-3 text-ink"
                  >
                    {/* Top Bar: Order # & Requirement 1 Distinct Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink text-base font-mono num">
                            #{order.orderNumber}
                          </span>
                          {renderStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-ink-muted font-mono num mt-0.5">
                          {order.date}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-raised cursor-pointer"
                        title="View Full PO Breakdown"
                        aria-label={`View details for order #${order.orderNumber}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                    </div>

                    {/* Summary Box */}
                    <div className="bg-surface-raised p-3 sm:p-3.5 rounded-xl border border-border space-y-1.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Brands</span>
                        <span className="font-semibold text-ink">{brandsList}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Volume</span>
                        <span className="font-semibold text-ink font-mono">
                          {order.totalBoxes} boxes ({order.totalPieces || order.totalBoxes * 10} pcs)
                        </span>
                      </div>
                    </div>

                    {/* Values */}
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs text-ink-muted">
                        Estimated total (before GST)
                      </span>
                      <span className="text-base sm:text-lg font-bold text-ink font-mono">
                        {formatINR(order.subtotal)}
                      </span>
                    </div>

                    {/* Requirement 2: Draft Cards with Resume Editing & Delete Draft */}
                    {order.status === "Draft" && (
                      <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResumeEditing(order)}
                          className="flex-1 w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit_square</span>
                          <span>Resume Editing</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(order.id)}
                          className="w-full sm:w-auto px-4 h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Delete Draft</span>
                        </button>
                      </div>
                    )}

                    {/* Requirement 2: In Review Cards show PO number, submitted date & allocation review note */}
                    {(order.status === "Submitted" ||
                      order.status === "Processing" ||
                      order.status === "Confirmed") && (
                      <div className="pt-2 border-t border-border">
                        <div className="bg-amber-50/90 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start sm:items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] text-amber-700 shrink-0 mt-0.5 sm:mt-0">
                            hourglass_top
                          </span>
                          <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <div>
                              <span className="font-bold block text-amber-950">
                                Under allocation review at Secunderabad hub
                              </span>
                              <span className="text-[11px] text-amber-800 font-mono">
                                PO #{order.orderNumber} • Submitted on {order.date}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase self-start sm:self-auto shrink-0">
                              Hub Priority
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Approved Action */}
                    {order.status === "Approved" && (
                      <div className="pt-2 border-t border-border space-y-2">
                        <div className="bg-emerald-50 text-emerald-800 text-xs p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-emerald-700">
                            check_circle
                          </span>
                          <span>Wholesaler stock allocated • Ready for your confirmation</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConfirmOrder(order.id)}
                          className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">task_alt</span>
                          <span>Review & Confirm Allocation</span>
                        </button>
                      </div>
                    )}

                    {/* Requirement 3: Dispatched Cards with Track Lorry Receipt (opens Drawer) */}
                    {order.status === "Dispatched" && (
                      <div className="pt-2 border-t border-border space-y-2">
                        <div className="bg-primary/10/70 p-2.5 rounded-lg border border-primary/20 text-xs text-ink space-y-1">
                          <div className="flex justify-between">
                            <span className="text-ink-muted">Transporter:</span>
                            <span className="font-semibold text-ink">
                              {order.transporter || "Navata Road Transport"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-muted">Lorry Receipt (LR):</span>
                            <span className="font-bold text-primary font-mono">
                              {order.lrNumber || "NRT-77492-SDP"}
                            </span>
                          </div>
                        </div>

                        {/* Open Drawer Trigger */}
                        <button
                          type="button"
                          onClick={() => setTrackingOrder(order)}
                          className="w-full h-10 rounded-xl bg-surface-raised hover:bg-surface-raised text-primary font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-border cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                          <span>Track Lorry Receipt (LR)</span>
                        </button>
                      </div>
                    )}

                    {/* Delivered Cards */}
                    {order.status === "Delivered" && (
                      <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                          <span>Delivered & verified at shop (Siddipet)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRetailerNav("catalogue")}
                          className="w-full sm:w-auto px-4 h-9 rounded-xl bg-surface-raised hover:bg-surface-raised text-ink font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-border cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">autorenew</span>
                          <span>Reorder Articles</span>
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Requirement 3: Right-Side Drawer for "Track Lorry Receipt" with Vertical Timeline */}
      {trackingOrder && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-ink/40 backdrop-blur-xs animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setTrackingOrder(null);
          }}
        >
          <div className="w-full max-w-md h-full bg-surface text-ink shadow-soft-xl border-l border-border flex flex-col overflow-y-auto animate-in slide-in-from-right duration-250 ease-out">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-start justify-between bg-surface-raised">
              <div>
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
                  Consignment Tracking
                </span>
                <h2 className="text-lg font-bold text-ink mt-0.5 font-sans">
                  Lorry Receipt Tracking
                </h2>
                <span className="text-xs text-ink-muted font-mono num">
                  PO #{trackingOrder.orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="w-8 h-8 rounded-full bg-surface border border-border text-ink-muted hover:text-ink flex items-center justify-center cursor-pointer shadow-soft-sm"
                aria-label="Close tracking drawer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* Transporter & Booking Point Card */}
              <div className="p-4 rounded-xl bg-background border border-border shadow-soft-sm space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-ink-muted font-bold uppercase block">
                      Preferred Transporter
                    </span>
                    <h3 className="font-bold text-ink text-sm font-sans">
                      {trackingOrder.transporter || "Navata Road Transport"}
                    </h3>
                  </div>
                </div>

                <div className="pt-2 border-t border-border text-xs text-ink-muted space-y-1">
                  <div className="flex justify-between">
                    <span>Origin Hub:</span>
                    <span className="font-semibold text-ink">Secunderabad Hub</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Destination Point:</span>
                    <span className="font-semibold text-ink">Siddipet Central Booking</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipient Shop:</span>
                    <span className="font-semibold text-ink">Sri Laxmi Narasimha Textiles</span>
                  </div>
                </div>
              </div>

              {/* LR Number Box with Copy Action */}
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between shadow-soft-sm">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    Lorry Receipt (LR) Number
                  </span>
                  <span className="text-lg font-bold text-primary font-mono num block mt-0.5">
                    {trackingOrder.lrNumber || "NRT-77492-SDP"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyLR(trackingOrder.lrNumber || "NRT-77492-SDP")}
                  className="px-3 py-1.5 rounded-md bg-surface text-primary hover:bg-background border border-border font-bold text-xs flex items-center gap-1.5 shadow-soft-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedLR ? "check" : "content_copy"}
                  </span>
                  <span>{copiedLR ? "Copied!" : "Copy LR"}</span>
                </button>
              </div>

              {/* e-Way Bill Number Box */}
              {trackingOrder.ewayBill && (
                <div className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between shadow-soft-sm">
                  <div>
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider block">
                      GST e-Way Bill
                    </span>
                    <span className="text-sm font-bold text-ink font-mono num block mt-0.5">
                      {trackingOrder.ewayBill}
                    </span>
                  </div>
                  <Badge variant="success" size="sm">
                    Valid in Transit
                  </Badge>
                </div>
              )}

              {/* Vertical Timeline */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-ink uppercase tracking-wider block font-sans">
                  Consignment Timeline
                </span>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
                  {/* Stage 1: Dispatched */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-success text-white flex items-center justify-center ring-4 ring-surface">
                      <span className="material-symbols-outlined text-[12px]">check</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-ink text-xs sm:text-sm font-sans">
                        Dispatched
                      </h4>
                      <p className="text-[11px] text-ink-muted mt-0.5 num">
                        ARK Distributors, Secunderabad Hub • 24 Oct 2026, 17:30 IST
                      </p>
                      <Badge variant="success" size="sm" className="mt-1">
                        LR Waybill Generated
                      </Badge>
                    </div>
                  </div>

                  {/* Stage 2: In Transit */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface ${
                        trackingOrder.status === "Delivered"
                          ? "bg-success text-white"
                          : "bg-primary text-primary-foreground ring-primary/20"
                      }`}
                    >
                      {trackingOrder.status === "Delivered" ? (
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-ink text-xs sm:text-sm flex items-center gap-1.5 font-sans">
                        <span>In Transit</span>
                        {trackingOrder.status !== "Delivered" && (
                          <Badge variant="primary" size="sm">
                            Current Location
                          </Badge>
                        )}
                      </h4>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        On Hyderabad-Siddipet Highway (NH 365B) • Navata Express Route
                      </p>
                    </div>
                  </div>

                  {/* Stage 3: Arrived at station */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface ${
                        trackingOrder.status === "Delivered"
                          ? "bg-success text-white"
                          : "bg-border text-ink-muted"
                      }`}
                    >
                      {trackingOrder.status === "Delivered" ? (
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-xs sm:text-sm font-sans ${
                          trackingOrder.status === "Delivered"
                            ? "font-bold text-ink"
                            : "font-semibold text-ink-muted"
                        }`}
                      >
                        Arrived at Station
                      </h4>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Siddipet Central Booking Point (Expected arrival: 25 Oct, 11:00 AM)
                      </p>
                    </div>
                  </div>

                  {/* Stage 4: Delivered */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface ${
                        trackingOrder.status === "Delivered"
                          ? "bg-success text-white"
                          : "bg-border text-ink-muted"
                      }`}
                    >
                      {trackingOrder.status === "Delivered" ? (
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-xs sm:text-sm font-sans ${
                          trackingOrder.status === "Delivered"
                            ? "font-bold text-ink"
                            : "font-semibold text-ink-muted"
                        }`}
                      >
                        Delivered
                      </h4>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Final store delivery & verification at Main Bazaar, Siddipet
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Summary */}
              <div className="p-4 rounded-xl bg-background border border-border text-xs space-y-2 shadow-soft-sm">
                <span className="font-bold text-ink block font-sans">Package Details</span>
                <div className="flex justify-between text-ink-muted">
                  <span>Total Boxes:</span>
                  <span className="font-mono font-semibold text-ink num">
                    {trackingOrder.totalBoxes} boxes ({trackingOrder.totalPieces || trackingOrder.totalBoxes * 10} pcs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">Consignment Value:</span>
                  <span className="font-mono font-bold text-primary num">
                    {formatINR(trackingOrder.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border bg-surface-raised">
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="w-full min-h-[44px] rounded-md bg-surface border border-border text-ink hover:bg-background font-bold text-xs transition-colors cursor-pointer shadow-soft-sm"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedOrder(null);
          }}
        >
          <div className="w-full max-w-lg bg-surface rounded-3xl p-6 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-ink-muted font-semibold uppercase">
                  Order Details
                </span>
                <h3 className="text-xl font-bold text-ink font-mono">
                  #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-surface-raised text-ink-muted flex items-center justify-center cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3.5 bg-surface-raised rounded-xl border border-border text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-ink-muted">Status</span>
                {renderStatusBadge(selectedOrder.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-ink-muted">Transporter</span>
                <span className="font-semibold text-ink">
                  {selectedOrder.transporter || "Navata Road Transport"}
                </span>
              </div>
              {selectedOrder.lrNumber && (
                <div className="flex justify-between">
                  <span className="text-ink-muted">LR Consignment #</span>
                  <span className="font-bold text-primary font-mono">
                    {selectedOrder.lrNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-ink-muted">Order Date</span>
                <span className="text-ink">{selectedOrder.date}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-ink uppercase tracking-wider block">
                Item Breakdown
              </span>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden text-xs">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-surface">
                    <div>
                      <span className="font-semibold text-ink block">
                        {item.productTitle || item.productName}
                      </span>
                      <span className="text-ink-muted text-[11px]">
                        {item.color} • {item.size} • {item.brand}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-ink font-mono block">
                        {item.units} bx
                      </span>
                      <span className="text-ink-muted font-mono">
                        {formatINR(item.units * item.rate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-primary/10/60 rounded-xl border border-primary/20 flex items-center justify-between">
              <span className="text-xs font-bold text-ink">Grand Total (incl. GST)</span>
              <span className="text-lg font-bold text-primary font-mono">
                {formatINR(selectedOrder.grandTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="w-full h-11 rounded-xl bg-surface-raised hover:bg-surface text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
