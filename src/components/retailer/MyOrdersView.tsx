"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Order } from "@/data/mockData";
import { formatINR, isDemoModeEnabled } from "@/lib/mock/retailer";

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

  // Requirement 1: Distinct status chip colours
  const renderStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "Draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Draft</span>
          </span>
        );
      case "Submitted":
      case "Approved":
      case "Confirmed":
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{status === "Approved" ? "Approved • Confirm Now" : "In Review"}</span>
          </span>
        );
      case "Dispatched":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#0047d3] border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0047d3]" />
            <span>Dispatched</span>
          </span>
        );
      case "Delivered":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="material-symbols-outlined text-[14px] text-emerald-700">check_circle</span>
            <span>Delivered</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* 1. Urgent Action Banner for Approved Orders */}
      {orders.some(o => o.status === "Approved") && (
        <section className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-4 sm:p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Action Required
                </span>
                <span className="text-xs text-blue-200 font-mono">#ARK-8897</span>
              </div>
              <p className="text-sm sm:text-base font-semibold mt-1">
                Order #ARK-8897 is approved by wholesaler. Confirm to release for processing.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleConfirmOrder("ARK-8897")}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white text-[#0047d3] hover:bg-blue-50 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 active:scale-98 cursor-pointer"
          >
            <span>Confirm Order</span>
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </section>
      )}

      {/* 2. Order Management Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Wholesale Purchase Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status updates from ARK Distributors, Secunderabad Hub
          </p>
        </div>

        {/* State Demo Switcher */}
        {isDemo && (
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDemoState("orders")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                demoState === "orders"
                  ? "bg-white text-[#0047d3] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setDemoState("empty")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                demoState === "empty"
                  ? "bg-white text-[#0047d3] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Empty
            </button>
            <button
              type="button"
              onClick={() => setDemoState("skeleton")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                demoState === "skeleton"
                  ? "bg-white text-[#0047d3] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Skeleton
            </button>
          </div>
        )}
      </div>

      {/* Requirement 4: Search Box for PO number and Date-Range Filter */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        {/* Search PO Number */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchPO}
            onChange={e => setSearchPO(e.target.value)}
            placeholder="Search PO number (e.g. ARK-8841, 8902)..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3] transition-all font-mono"
          />
          {searchPO && (
            <button
              type="button"
              onClick={() => setSearchPO("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              aria-label="Clear PO search"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Date Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <span className="material-symbols-outlined text-slate-400 text-[18px] hidden sm:inline">
            calendar_today
          </span>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 outline-none cursor-pointer focus:ring-2 focus:ring-[#0047d3]"
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
              className="text-xs font-semibold text-[#0047d3] hover:underline px-2 whitespace-nowrap cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 3. Empty State Variant */}
      {demoState === "empty" && (
        <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[36px]">inventory_2</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">No purchase orders found</h2>
          <p className="text-xs text-slate-500 max-w-sm">
            When you place wholesale purchase orders, they will appear here with live tracking, stock allocation, and lorry transport updates.
          </p>
          <button
            type="button"
            onClick={() => setRetailerNav("catalogue")}
            className="mt-3 px-5 py-2.5 rounded-xl bg-[#0047d3] text-white font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <span>Browse Brand Catalogue</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* 4. Skeleton State Variant */}
      {demoState === "skeleton" && (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 w-64 bg-slate-200 rounded-full" />
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 w-28 bg-slate-200 rounded" />
                <div className="h-5 w-20 bg-slate-200 rounded-full" />
              </div>
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-6 w-24 bg-slate-200 rounded" />
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[#0047d3] text-white shadow-2xs font-bold"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders Cards List */}
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <span className="material-symbols-outlined text-[40px] text-slate-300">
                search_off
              </span>
              <h3 className="text-sm font-bold text-slate-800 mt-2">
                No orders match your filter criteria
              </h3>
              <p className="text-xs text-slate-500 mt-1">
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
                className="mt-3 px-4 py-1.5 rounded-xl bg-[#0047d3] text-white text-xs font-semibold cursor-pointer"
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
                    className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 hover:shadow-md transition-all space-y-3"
                  >
                    {/* Top Bar: Order # & Requirement 1 Distinct Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base font-mono">
                            #{order.orderNumber}
                          </span>
                          {renderStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          {order.date}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="View Full PO Breakdown"
                        aria-label={`View details for order #${order.orderNumber}`}
                      >
                        <span className="material-symbols-outlined text-[20px]">visibility</span>
                      </button>
                    </div>

                    {/* Summary Box */}
                    <div className="bg-slate-50 p-3 sm:p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Brands</span>
                        <span className="font-semibold text-slate-900">{brandsList}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Volume</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          {order.totalBoxes} boxes ({order.totalPieces || order.totalBoxes * 10} pcs)
                        </span>
                      </div>
                    </div>

                    {/* Values */}
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs text-slate-500">
                        Estimated total (before GST)
                      </span>
                      <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">
                        {formatINR(order.subtotal)}
                      </span>
                    </div>

                    {/* Requirement 2: Draft Cards with Resume Editing & Delete Draft */}
                    {order.status === "Draft" && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleResumeEditing(order)}
                          className="flex-1 w-full h-10 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
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
                      <div className="pt-2 border-t border-slate-100">
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
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="bg-emerald-50 text-emerald-800 text-xs p-2.5 rounded-lg border border-emerald-200 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-emerald-700">
                            check_circle
                          </span>
                          <span>Wholesaler stock allocated • Ready for your confirmation</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleConfirmOrder(order.id)}
                          className="w-full h-11 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">task_alt</span>
                          <span>Review & Confirm Allocation</span>
                        </button>
                      </div>
                    )}

                    {/* Requirement 3: Dispatched Cards with Track Lorry Receipt (opens Drawer) */}
                    {order.status === "Dispatched" && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="bg-blue-50/70 p-2.5 rounded-lg border border-blue-200 text-xs text-slate-700 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Transporter:</span>
                            <span className="font-semibold text-slate-900">
                              {order.transporter || "Navata Road Transport"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Lorry Receipt (LR):</span>
                            <span className="font-bold text-[#0047d3] font-mono">
                              {order.lrNumber || "NRT-77492-SDP"}
                            </span>
                          </div>
                        </div>

                        {/* Open Drawer Trigger */}
                        <button
                          type="button"
                          onClick={() => setTrackingOrder(order)}
                          className="w-full h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0047d3] font-bold text-xs flex items-center justify-center gap-2 transition-colors border border-slate-200 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                          <span>Track Lorry Receipt (LR)</span>
                        </button>
                      </div>
                    )}

                    {/* Delivered Cards */}
                    {order.status === "Delivered" && (
                      <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                          <span className="material-symbols-outlined text-[18px]">verified_user</span>
                          <span>Delivered & verified at shop (Siddipet)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setRetailerNav("catalogue")}
                          className="w-full sm:w-auto px-4 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
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

      {/* Requirement 3: Right-Side Drawer for "Track Lorry Receipt" */}
      {trackingOrder && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setTrackingOrder(null);
          }}
        >
          <div className="w-full max-w-md h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Consignment Tracking
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  Lorry Receipt Tracking
                </h2>
                <span className="text-xs text-slate-500 font-mono">
                  PO #{trackingOrder.orderNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer shadow-2xs"
                aria-label="Close tracking drawer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* Transporter & Booking Point Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0047d3] flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 font-bold uppercase block">
                      Preferred Transporter
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {trackingOrder.transporter || "Navata Road Transport"}
                    </h3>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 text-xs text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Origin Hub:</span>
                    <span className="font-semibold text-slate-800">Secunderabad Hub</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination Point:</span>
                    <span className="font-semibold text-slate-800">Siddipet Central Booking</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recipient Shop:</span>
                    <span className="font-semibold text-slate-800">Sri Laxmi Narasimha Textiles</span>
                  </div>
                </div>
              </div>

              {/* LR Number Box with Copy Action */}
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                    Lorry Receipt (LR) Number
                  </span>
                  <span className="text-lg font-bold text-[#0047d3] font-mono block mt-0.5">
                    {trackingOrder.lrNumber || "NRT-77492-SDP"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyLR(trackingOrder.lrNumber || "NRT-77492-SDP")}
                  className="px-3 py-1.5 rounded-xl bg-white text-[#0047d3] hover:bg-blue-100/70 border border-blue-200 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedLR ? "check" : "content_copy"}
                  </span>
                  <span>{copiedLR ? "Copied!" : "Copy LR"}</span>
                </button>
              </div>

              {/* e-Way Bill Number Box */}
              {trackingOrder.ewayBill && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      GST e-Way Bill
                    </span>
                    <span className="text-sm font-bold text-slate-900 font-mono block mt-0.5">
                      {trackingOrder.ewayBill}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono">
                    Valid in Transit
                  </span>
                </div>
              )}

              {/* Simple 4-stage Timeline: Dispatched → In Transit → Arrived at station → Delivered */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Consignment Timeline
                </span>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {/* Stage 1: Dispatched */}
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center ring-4 ring-white">
                      <span className="material-symbols-outlined text-[12px]">check</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                        Dispatched
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        ARK Distributors, Secunderabad Hub • 24 Oct 2026, 17:30 IST
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        LR Waybill Generated
                      </span>
                    </div>
                  </div>

                  {/* Stage 2: In Transit */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                        trackingOrder.status === "Delivered"
                          ? "bg-emerald-500 text-white"
                          : "bg-[#0047d3] text-white ring-blue-100"
                      }`}
                    >
                      {trackingOrder.status === "Delivered" ? (
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        <span>In Transit</span>
                        {trackingOrder.status !== "Delivered" && (
                          <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            Current Location
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        On Hyderabad-Siddipet Highway (NH 365B) • Navata Express Route
                      </p>
                    </div>
                  </div>

                  {/* Stage 3: Arrived at station */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                        trackingOrder.status === "Delivered"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {trackingOrder.status === "Delivered" ? (
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-xs sm:text-sm ${
                          trackingOrder.status === "Delivered"
                            ? "font-bold text-slate-900"
                            : "font-semibold text-slate-600"
                        }`}
                      >
                        Arrived at Station
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Siddipet Central Booking Point (Expected arrival: 25 Oct, 11:00 AM)
                      </p>
                    </div>
                  </div>

                  {/* Stage 4: Delivered */}
                  <div className="relative">
                    <div
                      className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                        trackingOrder.status === "Delivered"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 text-slate-400"
                      }`}
                    >
                      {trackingOrder.status === "Delivered" ? (
                        <span className="material-symbols-outlined text-[12px]">check</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4
                        className={`text-xs sm:text-sm ${
                          trackingOrder.status === "Delivered"
                            ? "font-bold text-slate-900"
                            : "font-semibold text-slate-600"
                        }`}
                      >
                        Delivered
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Final store delivery & verification at Main Bazaar, Siddipet
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-800 block">Package Details</span>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Boxes:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {trackingOrder.totalBoxes} boxes ({trackingOrder.totalPieces || trackingOrder.totalBoxes * 10} pcs)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Consignment Value:</span>
                  <span className="font-mono font-bold text-[#0047d3]">
                    {formatINR(trackingOrder.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
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
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">
                  Order Details
                </span>
                <h3 className="text-xl font-bold text-slate-900 font-mono">
                  #{selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center cursor-pointer"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                {renderStatusBadge(selectedOrder.status)}
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transporter</span>
                <span className="font-semibold text-slate-800">
                  {selectedOrder.transporter || "Navata Road Transport"}
                </span>
              </div>
              {selectedOrder.lrNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">LR Consignment #</span>
                  <span className="font-bold text-[#0047d3] font-mono">
                    {selectedOrder.lrNumber}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Order Date</span>
                <span className="text-slate-800">{selectedOrder.date}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Item Breakdown
              </span>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <span className="font-semibold text-slate-900 block">
                        {item.productTitle || item.productName}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {item.color} • {item.size} • {item.brand}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 font-mono block">
                        {item.units} bx
                      </span>
                      <span className="text-slate-500 font-mono">
                        {formatINR(item.units * item.rate)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">Grand Total (incl. GST)</span>
              <span className="text-lg font-bold text-[#0047d3] font-mono">
                {formatINR(selectedOrder.grandTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrder(null)}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
