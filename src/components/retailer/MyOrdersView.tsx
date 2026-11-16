"use client";
import { Icon } from "@/components/ui/Icon";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/data/mockData";
import { formatINR, isDemoModeEnabled, RETAILER_PROFILE } from "@/lib/mock/retailer";
import { Badge, StatusChip } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
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
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<string>(orderTabFilter || "all");
  const [demoState, setDemoState] = useState<"orders" | "empty" | "skeleton">("orders");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [searchPO, setSearchPO] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [copiedLR, setCopiedLR] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState(false);

  const activeRetailerId = user?.type === "retailer" ? (user.retailerId || "ret-1") : "ret-1";
  const activeRetailerCode = user?.type === "retailer" ? (user.retailerCode || "RET-0001") : "RET-0001";

  // Retailer isolation: logged-in retailer only sees their own non-historical orders
  const retailerOrders = useMemo(() => {
    return orders.filter(
      o =>
        (o.retailerId === activeRetailerId || o.retailerId === activeRetailerCode) &&
        !o.orderNumber.startsWith("ARK-H")
    );
  }, [orders, activeRetailerId, activeRetailerCode]);

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

  // Counts derived strictly from isolated retailer orders
  const draftCount = retailerOrders.filter(o => o.status === "Draft").length;
  const inReviewCount = retailerOrders.filter(o =>
    ["Submitted", "Approved", "Confirmed", "Processing"].includes(o.status)
  ).length;
  const dispatchedCount = retailerOrders.filter(o => o.status === "Dispatched").length;
  const deliveredCount = retailerOrders.filter(o => o.status === "Delivered").length;
  const activePipelineCount = inReviewCount + dispatchedCount;
  const closedCount = deliveredCount + retailerOrders.filter(o => o.status === "Cancelled").length;

  // Filter orders by tab, PO search, and date range
  const filteredOrders = retailerOrders.filter(order => {
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
        return <StatusChip variant="neutral" dot label="Draft" />;
      case "Submitted":
      case "Confirmed":
      case "Processing":
        return <StatusChip variant="warning" dot pulse label="In Review" />;
      case "Approved":
        return <StatusChip variant="primary" dot label="Approved" />;
      case "Dispatched":
        return <StatusChip variant="accent" dot label="Dispatched" />;
      case "Delivered":
        return <StatusChip variant="success" dot label="Delivered" />;
      default:
        return <StatusChip variant="neutral" dot label={status} />;
    }
  };

  const unusedOldBadge = (status: Order["status"]) => {
    switch (status) {
      case "Draft":
        return <StatusChip variant="neutral" dot label="Draft" />;
      case "Submitted":
      case "Confirmed":
      case "Processing":
        return <StatusChip variant="warning" dot pulse label="In Review" />;
      case "Approved":
        return <StatusChip variant="primary" dot label="Approved" />;
      case "Dispatched":
        return <StatusChip variant="accent" dot label="Dispatched" />;
      case "Delivered":
        return <StatusChip variant="success" dot label="Delivered" />;
      default:
        return <StatusChip variant="neutral" dot label={status} />;
    }
  };
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-6 text-ink">
      {/* 1. Urgent Action Banner for Approved Orders */}
      {(() => {
        const approvedOrder = orders.find(o => o.status === "Approved");
        if (!approvedOrder) return null;
        return (
          <section className="bg-primary text-primary-foreground rounded-md p-5 shadow-soft-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface/20 flex items-center justify-center shrink-0">
                <Icon name="verified" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-success text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    Action Required
                  </span>
                  <span className="text-xs text-primary-foreground/80 font-mono num">#{approvedOrder.orderNumber}</span>
                </div>
                <p className="text-sm sm:text-base font-semibold mt-1">
                  Order #{approvedOrder.orderNumber} is approved by wholesaler. Confirm to release for processing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleConfirmOrder(approvedOrder.id)}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-md bg-surface text-ink hover:bg-background font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-soft-sm transition-all shrink-0 active:scale-98 cursor-pointer border border-border"
            >
              <span>Confirm Order</span>
              <Icon name="arrow_forward" size={18} />
            </button>
          </section>
        );
      })()}

      {/* 2. Order Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-page-title text-2xl sm:text-3xl text-ink font-normal">
            Orders
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
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${demoState === "orders"
                ? "bg-primary text-primary-foreground shadow-soft-sm"
                : "text-ink-muted hover:text-ink"
                }`}
            >
              Orders ({retailerOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setDemoState("empty")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${demoState === "empty"
                ? "bg-primary text-primary-foreground shadow-soft-sm"
                : "text-ink-muted hover:text-ink"
                }`}
            >
              Empty
            </button>
            <button
              type="button"
              onClick={() => setDemoState("skeleton")}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${demoState === "skeleton"
                ? "bg-primary text-primary-foreground shadow-soft-sm"
                : "text-ink-muted hover:text-ink"
                }`}
            >
              Skeleton
            </button>
          </div>
        )}
      </div>

      {/* Active Dispatched Delivery: 3-Stage Progress Tracker */}
      {(() => {
        const dispatchedOrder = retailerOrders.find(o => o.status === "Dispatched");
        if (!dispatchedOrder) return null;
        return (
          <section className="w-full bg-surface rounded-2xl p-4 sm:p-5 border border-border shadow-soft-sm flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                <h2 className="text-sm font-bold text-ink">Active delivery</h2>
                <span className="font-mono text-xs text-primary font-bold">
                  PO #{dispatchedOrder.orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTrackingOrder(dispatchedOrder)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Track delivery</span>
                <Icon name="open_in_new" size={14} />
              </button>
            </div>

            <div className="bg-background rounded-xl p-3 sm:p-4 border border-border flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">
                  {dispatchedOrder.transporter || "Navata Road Transport"}
                </span>
                <span className="font-mono font-bold text-primary">
                  LR: {dispatchedOrder.lrNumber || "NRT-77492-SDP"}
                </span>
              </div>

              {/* 3-Stage Visual Bar */}
              <div className="w-full flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-success" />
                <div className="flex-1 h-2 rounded-full bg-success animate-pulse" />
                <div className="flex-1 h-2 rounded-full bg-border" />
              </div>

              <div className="flex items-center justify-between text-xs text-ink-muted">
                <span className="text-success font-semibold">Dispatched</span>
                <span className="text-primary font-bold">In transit</span>
                <span>Expected tomorrow</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-ink-muted">
              <span>{dispatchedOrder.totalBoxes} boxes • {formatINR(dispatchedOrder.grandTotal)} (incl. GST)</span>
              <button
                type="button"
                onClick={() => setTrackingOrder(dispatchedOrder)}
                className="min-h-[48px] h-12 w-full sm:w-auto px-5 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-soft-xs hover:bg-primary/90"
              >
                <Icon name="local_shipping" size={18} />
                <span>Track delivery</span>
              </button>
            </div>
          </section>
        );
      })()}

      {/* Requirement 4: Search Box for PO number and Date-Range Filter */}
      <div className="bg-surface rounded-md p-3.5 sm:p-4 border border-border shadow-soft-sm flex flex-col sm:flex-row items-center gap-3">
        {/* Search PO Number */}
        <div className="relative flex-1 w-full">
          <Icon name="search" size={18} className="absolute left-3.5 top-3 text-ink-muted" />
          <input
            type="text"
            value={searchPO}
            onChange={e => setSearchPO(e.target.value)}
            placeholder="Search PO number, brand, article..."
            className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-md bg-background border border-border text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono num shadow-soft-sm"
          />
          {searchPO && (
            <button
              type="button"
              onClick={() => setSearchPO("")}
              className="absolute right-3 top-3 text-ink-muted hover:text-ink cursor-pointer"
              aria-label="Clear PO search"
            >
              <Icon name="close" size={16} />
            </button>
          )}
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <Icon name="calendar_today" size={18} className="text-ink-muted hidden sm:inline" />
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
        <EmptyState
          icon={<Icon name="inbox" size={28} />}
          title="No purchase orders found"
          description="When you place wholesale purchase orders, they will appear here with live tracking, stock allocation, and lorry transport updates."
          actionLabel="Browse Brand Catalogue"
          onAction={() => setRetailerNav("catalogue")}
        />
      )}

      {/* 4. Skeleton State Variant */}
      {demoState === "skeleton" && (
        <div className="space-y-4">
          <Skeleton variant="rounded" height={40} width={260} />
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-surface rounded-md p-5 border border-border shadow-soft-sm space-y-3">
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
              { id: "all", label: `All (${retailerOrders.length})` },
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
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${activeTab === tab.id
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
            <EmptyState
              icon={<Icon name="search_off" size={28} />}
              title="No orders match your filter criteria"
              description="Try adjusting the search query, date filter, or tab selection."
              actionLabel="Show All Orders"
              onAction={() => {
                setActiveTab("all");
                setOrderTabFilter("all");
                setSearchPO("");
                setDateFilter("all");
              }}
            />
          ) : (
            <div className="space-y-4">
              {filteredOrders.map(order => {
                const brandsList =
                  Array.from(new Set(order.items.map(i => i.brand))).join(", ") || "Multi-brand";
                const orderPieces = order.items && order.items.length > 0
                  ? order.items.reduce((sum, item) => sum + (item.totalPieces || (item.units * 10)), 0)
                  : (order.totalPieces || order.totalBoxes * 10);

                return (
                  <article
                    key={order.id}
                    className="bg-surface rounded-md p-5 shadow-soft-sm border border-border hover:shadow-soft-md transition-all duration-200 ease-out space-y-3 text-ink"
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
                        <Icon name="visibility" size={20} />
                      </button>
                    </div>

                    {/* Summary Box */}
                    <div className="bg-surface-raised p-3 sm:p-3.5 rounded-md border border-border space-y-1.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Brands</span>
                        <span className="font-semibold text-ink">{brandsList}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-muted">Volume</span>
                        <span className="font-semibold text-ink font-mono num">
                          {order.totalBoxes} boxes ({orderPieces} pcs)
                        </span>
                      </div>
                    </div>

                    {/* Values */}
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs text-ink-muted">
                        Total (incl. GST)
                      </span>
                      <span className="text-base sm:text-lg font-bold text-ink font-mono num">
                        {formatINR(order.grandTotal || (order.subtotal * 1.05))}
                      </span>
                    </div>

                    {/* Requirement 2: Draft Cards with Resume Editing & Delete Draft */}
                    {order.status === "Draft" && (
                      <div className="pt-3 border-t border-border flex flex-col sm:flex-row items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResumeEditing(order)}
                          className="flex-1 w-full h-10 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <Icon name="edit_square" size={16} />
                          <span>Resume Editing</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDraft(order.id)}
                          className="w-full sm:w-auto px-4 h-10 rounded-md bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Icon name="delete" size={16} />
                          <span>Delete Draft</span>
                        </button>
                      </div>
                    )}

                    {/* Requirement 2: In Review Cards show PO number, submitted date & allocation review note */}
                    {(order.status === "Submitted" ||
                      order.status === "Processing" ||
                      order.status === "Confirmed") && (
                        <div className="pt-2 border-t border-border">
                          <div className="bg-warning/10 p-3.5 rounded-md border border-warning/30 text-xs text-warning flex items-start sm:items-center gap-3">
                            <Icon name="hourglass_top" size={20} className="text-warning shrink-0 mt-0.5 sm:mt-0" />
                            <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <div>
                                <span className="font-bold block text-ink">
                                  Under allocation review at Secunderabad hub
                                </span>
                                <span className="text-[11px] text-ink-muted font-mono">
                                  PO #{order.orderNumber} • Submitted on {order.date}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-warning/15 border border-warning/30 text-warning text-[10px] font-bold uppercase self-start sm:self-auto shrink-0">
                                Hub Priority
                              </span>
                            </div>
                          </div>
                      </div>
                    )}

                          {/* Approved Action */}
                          {order.status === "Approved" && (
                            <div className="pt-2 border-t border-border space-y-2">
                              <div className="bg-success/10 text-success text-xs p-2.5 rounded-md border border-success/30 flex items-center gap-2">
                                <Icon name="check_circle" size={18} className="text-success" />
                                <span>Wholesaler stock allocated • Ready for your confirmation</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleConfirmOrder(order.id)}
                                className="w-full h-11 rounded-md bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                              >
                                <Icon name="task_alt" size={18} />
                                <span>Review & Confirm Allocation</span>
                              </button>
                            </div>
                          )}

                          {/* Dispatched Cards with Track delivery (opens Drawer) */}
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
                                  <span className="font-bold text-primary font-mono num">
                                    {order.lrNumber || "NRT-77492-SDP"}
                                  </span>
                                </div>
                              </div>

                              {/* One Track delivery Action */}
                              <button
                                type="button"
                                onClick={() => setTrackingOrder(order)}
                                className="w-full h-10 rounded-md bg-surface-raised hover:bg-surface-raised text-primary font-semibold text-xs flex items-center justify-center gap-2 transition-colors border border-border cursor-pointer shadow-soft-xs"
                              >
                                <Icon name="local_shipping" size={16} />
                                <span>Track delivery</span>
                              </button>
                            </div>
                          )}

                          {/* Delivered Cards */}
                          {order.status === "Delivered" && (
                            <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs text-success font-semibold">
                                <Icon name="verified_user" size={16} />
                                <span>Delivered & verified at shop (Siddipet)</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setTrackingOrder(order)}
                                className="w-full sm:w-auto px-4 h-9 rounded-md bg-surface hover:bg-surface-raised text-ink font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-border cursor-pointer shadow-soft-xs"
                              >
                                <Icon name="local_shipping" size={15} />
                                <span>Track delivery</span>
                              </button>
                            </div>
                          )}
                        </article>
                      );
              })}
                  </div>
                )
              }
        </div>
          )}

          {/* Requirement 3: Right-Side Drawer for "Track Lorry Receipt" with Vertical Timeline */}
          {trackingOrder && (
            <div
              className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in"
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
                    <Icon name="close" size={18} />
                  </button>
                </div>

                <div className="p-5 space-y-6 flex-1">
                  {/* Transporter & Booking Point Card */}
                  <div className="p-4 rounded-md bg-background border border-border shadow-soft-sm space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon name="local_shipping" size={22} />
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
                        <span className="font-semibold text-ink">{trackingOrder?.retailerName || RETAILER_PROFILE.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* LR Number Box with Copy Action */}
                  <div className="p-4 rounded-md bg-primary/5 border border-primary/20 flex items-center justify-between shadow-soft-sm">
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
                      <Icon name={copiedLR ? "check" : "content_copy"} size={16} />
                      <span>{copiedLR ? "Copied!" : "Copy LR"}</span>
                    </button>
                  </div>

                  {/* e-Way Bill Number Box */}
                  {trackingOrder.ewayBill && (
                    <div className="p-3.5 rounded-md bg-background border border-border flex items-center justify-between shadow-soft-sm">
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
                          <Icon name="check" size={12} />
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
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface ${trackingOrder.status === "Delivered"
                            ? "bg-success text-white"
                            : "bg-primary text-primary-foreground ring-primary/20"
                            }`}
                        >
                          {trackingOrder.status === "Delivered" ? (
                            <Icon name="check" size={12} />
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
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface ${trackingOrder.status === "Delivered"
                            ? "bg-success text-white"
                            : "bg-border text-ink-muted"
                            }`}
                        >
                          {trackingOrder.status === "Delivered" ? (
                            <Icon name="check" size={12} />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
                          )}
                        </div>
                        <div>
                          <h4
                            className={`text-xs sm:text-sm font-sans ${trackingOrder.status === "Delivered"
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
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-surface ${trackingOrder.status === "Delivered"
                            ? "bg-success text-white"
                            : "bg-border text-ink-muted"
                            }`}
                        >
                          {trackingOrder.status === "Delivered" ? (
                            <Icon name="check" size={12} />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
                          )}
                        </div>
                        <div>
                          <h4
                            className={`text-xs sm:text-sm font-sans ${trackingOrder.status === "Delivered"
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
                  <div className="p-4 rounded-md bg-background border border-border text-xs space-y-2 shadow-soft-sm">
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
              <div className="w-full max-w-lg bg-surface rounded-lg p-6 shadow-2xl border border-border space-y-4 max-h-[90vh] overflow-y-auto">
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
                    <Icon name="close" size={18} />
                  </button>
                </div>

                <div className="p-3.5 bg-surface-raised rounded-md border border-border text-xs space-y-1.5">
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
                  <div className="divide-y divide-border border border-border rounded-md overflow-hidden text-xs">
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

                <div className="p-3.5 bg-primary/10/60 rounded-md border border-primary/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Grand Total (incl. GST)</span>
                  <span className="text-lg font-bold text-primary font-mono">
                    {formatINR(selectedOrder.grandTotal)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full h-11 rounded-md bg-surface-raised hover:bg-surface text-white font-semibold text-xs cursor-pointer transition-colors"
                >
                  Close Details
                </button>
              </div>
            </div>
          )}
        </div>
      );
}
