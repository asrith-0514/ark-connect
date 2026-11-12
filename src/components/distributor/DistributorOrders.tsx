"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import {
  Order,
  OrderItem,
  OrderStatus,
  getOrderStatusLabel,
  formatINR,
  getRetailerAgeingLedgers,
  getCurrentDate,
  Invoice,
} from "@/lib/mock";

type SortField = "orderNumber" | "date" | "totalBoxes" | "grandTotal" | "retailerName";
type SortDirection = "asc" | "desc";

export default function DistributorOrders() {
  const {
    orders,
    updateOrderStatus,
    setViewingInvoice,
    invoices,
    retailers,
    orderTabFilter,
    setOrderTabFilter,
    currentDate,
  } = useApp();

  // Active tab state (synced with Dashboard navigation)
  const [activeTab, setActiveTab] = useState<string>(() => orderTabFilter || "all");

  useEffect(() => {
    if (orderTabFilter) {
      setActiveTab(orderTabFilter);
    }
  }, [orderTabFilter]);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Modals and Drawers
  const [viewDrawerOrder, setViewDrawerOrder] = useState<Order | null>(null);
  const [creditCheckOrder, setCreditCheckOrder] = useState<Order | null>(null);
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);

  // Credit check modal state
  const [overrideReason, setOverrideReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeCreditAction, setActiveCreditAction] = useState<"standard" | "override" | "reject" | null>(null);
  const [editableOrderItems, setEditableOrderItems] = useState<OrderItem[]>([]);

  // Dispatch modal state
  const [dispatchTransporter, setDispatchTransporter] = useState("Navata Road Transport");
  const [dispatchLR, setDispatchLR] = useState("");
  const [dispatchEwayBill, setDispatchEwayBill] = useState("");
  const [dispatchDate, setDispatchDate] = useState(() =>
    currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  );

  // Success toast feedback
  const [actionToast, setActionToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  // 1. Hide DRAFT orders (retailer-private)
  const visibleOrders = useMemo(() => {
    return orders.filter(o => o.status !== "Draft");
  }, [orders]);

  // Stage counts for tabs matching Dashboard
  const submittedCount = useMemo(() => visibleOrders.filter(o => o.status === "Submitted").length, [visibleOrders]);
  const approvedCount = useMemo(() => visibleOrders.filter(o => o.status === "Approved").length, [visibleOrders]);
  const confirmedCount = useMemo(() => visibleOrders.filter(o => o.status === "Confirmed").length, [visibleOrders]);
  const processingCount = useMemo(() => visibleOrders.filter(o => o.status === "Processing").length, [visibleOrders]);
  const dispatchedCount = useMemo(() => visibleOrders.filter(o => o.status === "Dispatched").length, [visibleOrders]);
  const deliveredCount = useMemo(() => visibleOrders.filter(o => o.status === "Delivered").length, [visibleOrders]);

  // Retailer financial ledgers for credit checking
  const retailerLedgers = useMemo(() => {
    return getRetailerAgeingLedgers(retailers, invoices, currentDate);
  }, [retailers, invoices, currentDate]);

  // Filter and sort visible orders
  const filteredOrders = useMemo(() => {
    let result = visibleOrders.filter(o => {
      // Tab filter
      if (activeTab === "review" && o.status !== "Submitted") return false;
      if (activeTab === "ready_invoice" && o.status !== "Approved") return false;
      if (activeTab === "processing" && o.status !== "Processing" && o.status !== "Confirmed") return false;
      if (activeTab === "dispatched" && o.status !== "Dispatched") return false;
      if (activeTab === "delivered" && o.status !== "Delivered") return false;

      // Search filter (PO #, Retailer Name, Retailer ID, LR #)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const poMatch = o.orderNumber.toLowerCase().includes(q);
        const nameMatch = o.retailerName.toLowerCase().includes(q);
        const townMatch = (o.retailerTown || "").toLowerCase().includes(q);
        const retIdMatch = (o.retailerId || "").toLowerCase().includes(q);
        const lrMatch = (o.lrNumber || "").toLowerCase().includes(q);
        const transporterMatch = (o.transporter || "").toLowerCase().includes(q);
        if (!poMatch && !nameMatch && !townMatch && !retIdMatch && !lrMatch && !transporterMatch) {
          return false;
        }
      }

      // Date range filter
      if (dateFilter === "today") {
        const todayStr = currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        return o.date.includes(todayStr);
      }
      if (dateFilter === "oct2026") {
        return o.date.includes("Oct 2026");
      }
      if (dateFilter === "nov2026") {
        return o.date.includes("Nov 2026");
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "orderNumber") {
        cmp = a.orderNumber.localeCompare(b.orderNumber);
      } else if (sortField === "retailerName") {
        cmp = a.retailerName.localeCompare(b.retailerName);
      } else if (sortField === "totalBoxes") {
        cmp = a.totalBoxes - b.totalBoxes;
      } else if (sortField === "grandTotal") {
        cmp = a.grandTotal - b.grandTotal;
      } else if (sortField === "date") {
        // Approximate date sort
        cmp = a.id.localeCompare(b.id);
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return result;
  }, [visibleOrders, activeTab, searchQuery, dateFilter, sortField, sortDirection, currentDate]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // --------------------------------------------------------------------------
  // Credit Check Modal Open & Actions
  // --------------------------------------------------------------------------
  const openCreditCheckModal = (order: Order) => {
    setCreditCheckOrder(order);
    setEditableOrderItems(JSON.parse(JSON.stringify(order.items)));
    setOverrideReason("");
    setRejectionReason("");
    setActiveCreditAction(null);
  };

  // Calculate dynamic totals for editable items in credit check
  const dynamicCreditCheckTotals = useMemo(() => {
    if (!creditCheckOrder) return { boxes: 0, pieces: 0, subtotal: 0, gst: 0, grandTotal: 0 };
    const boxes = editableOrderItems.reduce((acc, it) => acc + (it.units || 0), 0);
    const pieces = editableOrderItems.reduce((acc, it) => acc + (it.totalPieces || 0), 0);
    const subtotal = editableOrderItems.reduce((acc, it) => acc + (it.units * it.rate), 0);
    const isInterState = creditCheckOrder.retailerTown.includes("AP") || creditCheckOrder.retailerName.includes("Andhra");
    const gstRate = 0.05;
    const gst = Math.round(subtotal * gstRate);
    const grandTotal = subtotal + gst;
    return { boxes, pieces, subtotal, gst, grandTotal, isInterState };
  }, [creditCheckOrder, editableOrderItems]);

  const handleAdjustBoxes = (idx: number, delta: number) => {
    setEditableOrderItems(prev => {
      const copy = [...prev];
      const item = { ...copy[idx] };
      const newUnits = Math.max(1, (item.units || 1) + delta);
      const pcsPerBox = item.units > 0 ? Math.round(item.totalPieces / item.units) : 10;
      item.units = newUnits;
      item.totalPieces = newUnits * pcsPerBox;
      copy[idx] = item;
      return copy;
    });
  };

  // Get retailer credit standing
  const currentOrderRetailer = useMemo(() => {
    if (!creditCheckOrder) return null;
    return (
      retailers.find(r => r.id === creditCheckOrder.retailerId || r.name === creditCheckOrder.retailerName) ||
      retailers[0]
    );
  }, [creditCheckOrder, retailers]);

  const currentOrderLedger = useMemo(() => {
    if (!currentOrderRetailer) return null;
    return retailerLedgers.find(l => l.retailer.id === currentOrderRetailer.id);
  }, [currentOrderRetailer, retailerLedgers]);

  // Retailer Credit Standing Values
  const creditLimit = currentOrderRetailer?.creditLimit || 150000;
  const outstanding = currentOrderLedger?.totalOwed || 54200;
  const overdue = currentOrderLedger ? currentOrderLedger.d1_30 + currentOrderLedger.d31_60 + currentOrderLedger.d60_plus : 31000;
  const availableCredit = Math.max(0, creditLimit - outstanding);
  const thisPOTotal = dynamicCreditCheckTotals.grandTotal || creditCheckOrder?.grandTotal || 25725;
  const hasOverdue = overdue > 0;
  const checkStatus = hasOverdue ? "WARNING" : "OK";

  // Handle Approval from Credit Check Modal
  const handleConfirmApproval = (isOverride: boolean) => {
    if (!creditCheckOrder) return;
    if (isOverride && !overrideReason.trim()) {
      alert("Please provide a manager override reason to release this order.");
      return;
    }

    updateOrderStatus(creditCheckOrder.id, "Approved", {
      items: editableOrderItems,
      totalBoxes: dynamicCreditCheckTotals.boxes,
      totalPieces: dynamicCreditCheckTotals.pieces,
      subtotal: dynamicCreditCheckTotals.subtotal,
      gstAmount: dynamicCreditCheckTotals.gst,
      grandTotal: dynamicCreditCheckTotals.grandTotal,
      overrideReason: isOverride ? overrideReason : undefined,
    });

    showToast(`PO #${creditCheckOrder.orderNumber} approved successfully. Moved to Ready to Invoice.`);
    setCreditCheckOrder(null);
    if (viewDrawerOrder?.id === creditCheckOrder.id) {
      setViewDrawerOrder(prev => (prev ? { ...prev, status: "Approved" } : null));
    }
  };

  const handleConfirmRejection = () => {
    if (!creditCheckOrder) return;
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    updateOrderStatus(creditCheckOrder.id, "Cancelled", {
      rejectionReason,
    });

    showToast(`PO #${creditCheckOrder.orderNumber} was rejected. Retailer notified.`);
    setCreditCheckOrder(null);
    if (viewDrawerOrder?.id === creditCheckOrder.id) {
      setViewDrawerOrder(null);
    }
  };

  // --------------------------------------------------------------------------
  // Next Actions by Stage
  // --------------------------------------------------------------------------
  const handleCreateInvoice = (order: Order) => {
    // Find or construct invoice
    const existing = invoices.find(i => i.orderNumber === order.orderNumber);
    if (existing) {
      setViewingInvoice(existing);
      return;
    }

    const orderRetailer = retailers.find(r => r.id === order.retailerId || r.name === order.retailerName);
    const isInterState = order.retailerTown.includes("AP") || order.retailerName.includes("Andhra");
    const subtotal = order.subtotal;
    const discount = 0;
    const taxableValue = subtotal;
    const cgstAmount = !isInterState ? Math.round(taxableValue * 0.025 * 100) / 100 : 0;
    const sgstAmount = !isInterState ? Math.round(taxableValue * 0.025 * 100) / 100 : 0;
    const igstAmount = isInterState ? Math.round(taxableValue * 0.05 * 100) / 100 : 0;
    const totalTax = !isInterState ? cgstAmount + sgstAmount : igstAmount;
    const rawTotal = taxableValue + totalTax;
    const grandTotal = Math.round(rawTotal);
    const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;

    const newInvoice: Invoice = {
      id: `inv-${order.orderNumber.toLowerCase()}`,
      invoiceNumber: order.invoiceNumber || `INV-00${Math.floor(100 + Math.random() * 899)}`,
      orderNumber: order.orderNumber,
      retailerId: order.retailerId,
      retailerName: order.retailerName,
      retailerTown: order.retailerTown,
      retailerGstin: orderRetailer?.gstin || "36AAACF1234F1Z5",
      billedDate: currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      date: currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      dueDate: new Date(Date.now() + 15 * 86400000).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      creditDays: 15,
      status: "Draft",
      subtotal,
      discount,
      taxableValue,
      taxRatePercent: 5,
      cgstAmount,
      sgstAmount,
      igstAmount,
      roundOff,
      grandTotal,
      total: grandTotal,
      paid: 0,
      balanceDue: grandTotal,
      items: order.items.map(item => ({
        description: `${item.brand} ${item.productTitle || item.productName || item.artNumber}`,
        variant: `${item.color} (${item.size})`,
        brand: item.brand,
        hsn: "6107",
        boxes: item.units,
        rate: item.rate,
        amount: item.units * item.rate,
      })),
    };

    setViewingInvoice(newInvoice);
  };

  const handleMarkPacked = (order: Order) => {
    updateOrderStatus(order.id, "Processing");
    showToast(`PO #${order.orderNumber} marked packed at Secunderabad hub. Ready for lorry dispatch.`);
    if (viewDrawerOrder?.id === order.id) {
      setViewDrawerOrder(prev => (prev ? { ...prev, status: "Processing" } : null));
    }
  };

  const openDispatchModal = (order: Order) => {
    setDispatchOrder(order);
    setDispatchTransporter(order.transporter || "Navata Road Transport");
    setDispatchLR(order.lrNumber || `NRT-${Math.floor(70000 + Math.random() * 9999)}-SDP`);
    setDispatchEwayBill(order.ewayBill || "241098452103");
  };

  const handleConfirmDispatch = () => {
    if (!dispatchOrder) return;
    if (!dispatchLR.trim()) {
      alert("Please enter a Lorry Receipt (LR) number.");
      return;
    }

    updateOrderStatus(dispatchOrder.id, "Dispatched", {
      transporter: dispatchTransporter,
      lrNumber: dispatchLR.trim(),
      ewayBill: dispatchEwayBill.trim() || undefined,
      dispatchDate: dispatchDate,
    });

    showToast(`PO #${dispatchOrder.orderNumber} dispatched via ${dispatchTransporter} (LR: ${dispatchLR.trim()}).`);
    setDispatchOrder(null);
    if (viewDrawerOrder?.id === dispatchOrder.id) {
      setViewDrawerOrder(prev =>
        prev
          ? {
              ...prev,
              status: "Dispatched",
              transporter: dispatchTransporter,
              lrNumber: dispatchLR.trim(),
              ewayBill: dispatchEwayBill.trim(),
              dispatchDate,
            }
          : null
      );
    }
  };

  const handleMarkDelivered = (order: Order) => {
    updateOrderStatus(order.id, "Delivered", {
      deliveryDate: currentDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
    });
    showToast(`PO #${order.orderNumber} marked delivered at ${order.retailerTown} store.`);
    if (viewDrawerOrder?.id === order.id) {
      setViewDrawerOrder(prev => (prev ? { ...prev, status: "Delivered" } : null));
    }
  };

  // Export CSV
  const handleExportOrders = () => {
    const headers = [
      "Order #",
      "Retailer Name",
      "Retailer Code",
      "Town",
      "Date",
      "Boxes",
      "Pieces",
      "Subtotal (excl. GST)",
      "GST",
      "Grand Total",
      "Status",
      "Transporter",
      "LR Number",
      "e-Way Bill",
    ];

    const rows = filteredOrders.map(o => [
      `#${o.orderNumber}`,
      `"${o.retailerName}"`,
      `"${o.retailerId || ''}"`,
      `"${o.retailerTown}"`,
      o.date,
      o.totalBoxes,
      o.totalPieces,
      o.subtotal,
      o.gstAmount || Math.round(o.subtotal * 0.05),
      o.grandTotal,
      getOrderStatusLabel(o.status, "distributor"),
      `"${o.transporter || ''}"`,
      `"${o.lrNumber || ''}"`,
      `"${o.ewayBill || ''}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ARK_Distributor_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Toast Notification */}
      {actionToast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
          <span className="text-xs font-semibold">{actionToast}</span>
        </div>
      )}

      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Orders Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-xs font-semibold">
              {visibleOrders.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review incoming retailer POs, conduct credit audits, allocate hub stock, and generate lorry receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportOrders}
            className="px-4 h-10 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">file_download</span>
            <span>Export Orders CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs with exact counts matching Dashboard */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: `All (${visibleOrders.length})` },
          {
            id: "review",
            label: `Needs Review (${submittedCount})`,
            badge: submittedCount > 0 ? "bg-amber-100 text-amber-900 font-black animate-pulse" : "",
          },
          {
            id: "ready_invoice",
            label: `Ready to Invoice (${approvedCount})`,
            badge: approvedCount > 0 ? "bg-blue-100 text-[#0047d3] font-bold" : "",
          },
          {
            id: "processing",
            label: `Processing (${processingCount + confirmedCount})`,
          },
          {
            id: "dispatched",
            label: `Dispatched (${dispatchedCount})`,
          },
          {
            id: "delivered",
            label: `Delivered (${deliveredCount})`,
          },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              setOrderTabFilter(t.id);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === t.id
                ? "bg-[#0047d3] text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-slate-400 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by PO # (e.g. ARK-8903), retailer name, town, or LR #..."
            className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3] transition-all font-mono"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Date:</span>
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3] cursor-pointer"
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="nov2026">November 2026</option>
            <option value="oct2026">October 2026</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200 select-none">
                <th
                  className="py-3.5 px-4 font-bold cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
                  onClick={() => toggleSort("orderNumber")}
                >
                  <div className="flex items-center gap-1">
                    <span>PO #</span>
                    {sortField === "orderNumber" && (
                      <span className="material-symbols-outlined text-[16px] text-[#0047d3]">
                        {sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 font-bold min-w-[240px] sm:w-72 max-w-[320px] cursor-pointer hover:text-slate-900 transition-colors"
                  onClick={() => toggleSort("retailerName")}
                >
                  <div className="flex items-center gap-1">
                    <span>Retailer &amp; Destination</span>
                    {sortField === "retailerName" && (
                      <span className="material-symbols-outlined text-[16px] text-[#0047d3]">
                        {sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="py-3.5 px-3 font-bold cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
                  onClick={() => toggleSort("date")}
                >
                  <div className="flex items-center gap-1">
                    <span>Date</span>
                    {sortField === "date" && (
                      <span className="material-symbols-outlined text-[16px] text-[#0047d3]">
                        {sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="py-3.5 px-3 font-bold text-right cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
                  onClick={() => toggleSort("totalBoxes")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Boxes</span>
                    {sortField === "totalBoxes" && (
                      <span className="material-symbols-outlined text-[16px] text-[#0047d3]">
                        {sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
                <th
                  className="py-3.5 px-3 font-bold text-right cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap"
                  onClick={() => toggleSort("grandTotal")}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Value (incl. GST)</span>
                    {sortField === "grandTotal" && (
                      <span className="material-symbols-outlined text-[16px] text-[#0047d3]">
                        {sortDirection === "asc" ? "arrow_upward" : "arrow_downward"}
                      </span>
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-3 font-bold">Status</th>
                <th className="py-3.5 px-3 font-bold">Transporter / LR</th>
                <th className="py-3.5 px-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filteredOrders.map(order => {
                const label = getOrderStatusLabel(order.status, "distributor");

                return (
                  <tr
                    key={order.id}
                    onClick={() => setViewDrawerOrder(order)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* PO # (whitespace-nowrap) */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-[#0047d3] group-hover:underline">
                      #{order.orderNumber}
                    </td>

                    {/* Wider Retailer column */}
                    <td className="py-3.5 px-4 min-w-[240px] sm:w-72 max-w-[320px]">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 leading-snug">
                          {order.retailerName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span className="font-mono font-medium text-slate-600">
                            {order.retailerId || "RET-0001"}
                          </span>
                          <span>•</span>
                          <span>{order.retailerTown}</span>
                        </div>
                      </div>
                    </td>

                    {/* Date (whitespace-nowrap) */}
                    <td className="py-3.5 px-3 whitespace-nowrap font-mono text-xs text-slate-500">
                      {order.date}
                    </td>

                    {/* Boxes (whitespace-nowrap) */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                      {order.totalBoxes} bx
                      <span className="block text-[11px] font-normal text-slate-400">
                        {order.totalPieces} pcs
                      </span>
                    </td>

                    {/* Value */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap font-mono font-bold text-slate-900">
                      {formatINR(order.grandTotal)}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {formatINR(order.subtotal)} + GST
                      </span>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.status === "Submitted"
                            ? "bg-amber-100 text-amber-900 border border-amber-300 animate-pulse"
                            : order.status === "Approved"
                            ? "bg-blue-50 text-[#0047d3] border border-blue-200"
                            : order.status === "Confirmed"
                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                            : order.status === "Processing"
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                            : order.status === "Dispatched"
                            ? "bg-sky-50 text-sky-800 border border-sky-200"
                            : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        {label}
                      </span>
                    </td>

                    {/* Transporter / LR */}
                    <td className="py-3.5 px-3 text-xs">
                      {order.lrNumber ? (
                        <div className="flex flex-col">
                          <span className="font-mono font-bold text-emerald-700">
                            {order.lrNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 truncate max-w-[140px]">
                            {order.transporter}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">
                          Pending dispatch
                        </span>
                      )}
                    </td>

                    {/* Action buttons by stage */}
                    <td
                      className="py-3.5 px-4 text-right whitespace-nowrap"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewDrawerOrder(order)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                          title="View order details"
                        >
                          View
                        </button>

                        {/* Stage 1: Submitted -> Approve PO */}
                        {order.status === "Submitted" && (
                          <button
                            type="button"
                            onClick={() => openCreditCheckModal(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-[#0047d3] hover:bg-[#1e5eff] text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">verified_user</span>
                            <span>Approve PO</span>
                          </button>
                        )}

                        {/* Stage 2: Approved -> Create Invoice */}
                        {order.status === "Approved" && (
                          <button
                            type="button"
                            onClick={() => handleCreateInvoice(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                            <span>Create Invoice</span>
                          </button>
                        )}

                        {/* Stage 3: Confirmed -> Mark Packed */}
                        {order.status === "Confirmed" && (
                          <button
                            type="button"
                            onClick={() => handleMarkPacked(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">inventory</span>
                            <span>Mark Packed</span>
                          </button>
                        )}

                        {/* Stage 4: Processing -> Dispatch */}
                        {order.status === "Processing" && (
                          <button
                            type="button"
                            onClick={() => openDispatchModal(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                            <span>Dispatch</span>
                          </button>
                        )}

                        {/* Stage 5: Dispatched -> Mark Delivered */}
                        {order.status === "Dispatched" && (
                          <button
                            type="button"
                            onClick={() => handleMarkDelivered(order)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">done_all</span>
                            <span>Mark Delivered</span>
                          </button>
                        )}

                        {/* Stage 6: Delivered */}
                        {order.status === "Delivered" && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-200">
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            <span>Completed</span>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <span className="material-symbols-outlined text-[40px] text-slate-300 block mb-2">
                      inventory_2
                    </span>
                    <span className="font-bold text-slate-700 text-sm block">
                      No orders found in this view
                    </span>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Adjust your search query or switch tabs to see other wholesale purchase orders.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. VIEW ORDER RIGHT-SIDE DRAWER */}
      {/* ==================================================================== */}
      {viewDrawerOrder && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setViewDrawerOrder(null);
          }}
        >
          <div className="w-full max-w-xl h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50 sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Purchase Order Details
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      viewDrawerOrder.status === "Submitted"
                        ? "bg-amber-100 text-amber-900"
                        : viewDrawerOrder.status === "Approved"
                        ? "bg-blue-100 text-[#0047d3]"
                        : viewDrawerOrder.status === "Confirmed"
                        ? "bg-purple-100 text-purple-700"
                        : viewDrawerOrder.status === "Processing"
                        ? "bg-indigo-100 text-indigo-700"
                        : viewDrawerOrder.status === "Dispatched"
                        ? "bg-sky-100 text-sky-800"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {getOrderStatusLabel(viewDrawerOrder.status, "distributor")}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                  #{viewDrawerOrder.orderNumber}
                </h2>
                <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">{viewDrawerOrder.retailerName}</span>
                  <span>•</span>
                  <span>{viewDrawerOrder.retailerTown}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">{viewDrawerOrder.date}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewDrawerOrder(null)}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer shadow-2xs"
                aria-label="Close drawer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 space-y-6 flex-1">
              {/* Order Status Timeline */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Order Status Timeline
                </span>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {[
                      {
                        key: "Submitted",
                        label: "PO Submitted & In Review",
                        desc: "Received from retailer with 30-day credit terms request",
                        done: true,
                        active: viewDrawerOrder.status === "Submitted",
                      },
                      {
                        key: "Approved",
                        label: "Credit & Inventory Approved",
                        desc: "Ledger check cleared and hub inventory reserved",
                        done: ["Approved", "Confirmed", "Processing", "Dispatched", "Delivered"].includes(
                          viewDrawerOrder.status
                        ),
                        active: viewDrawerOrder.status === "Approved",
                      },
                      {
                        key: "Confirmed",
                        label: "Tax Invoice Issued",
                        desc: "GST B2B invoice generated and synced to Tally",
                        done: ["Confirmed", "Processing", "Dispatched", "Delivered"].includes(
                          viewDrawerOrder.status
                        ),
                        active: viewDrawerOrder.status === "Confirmed",
                      },
                      {
                        key: "Processing",
                        label: "Packed at Secunderabad Hub",
                        desc: "Bales bundled and staged for dispatch",
                        done: ["Processing", "Dispatched", "Delivered"].includes(viewDrawerOrder.status),
                        active: viewDrawerOrder.status === "Processing",
                      },
                      {
                        key: "Dispatched",
                        label: "Dispatched via Lorry Transport",
                        desc: viewDrawerOrder.lrNumber
                          ? `LR #${viewDrawerOrder.lrNumber} (${viewDrawerOrder.transporter || "Navata Road Transport"})`
                          : "Waybill assigned and transit en route",
                        done: ["Dispatched", "Delivered"].includes(viewDrawerOrder.status),
                        active: viewDrawerOrder.status === "Dispatched",
                      },
                      {
                        key: "Delivered",
                        label: "Delivered at Destination Depot",
                        desc: `Arrived at ${viewDrawerOrder.retailerTown} retailer location`,
                        done: viewDrawerOrder.status === "Delivered",
                        active: viewDrawerOrder.status === "Delivered",
                      },
                    ].map(stage => (
                      <div key={stage.key} className="relative">
                        <div
                          className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                            stage.active
                              ? "bg-[#0047d3] text-white ring-blue-100 animate-pulse"
                              : stage.done
                              ? "bg-emerald-500 text-white"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {stage.done && !stage.active ? (
                            <span className="material-symbols-outlined text-[13px]">check</span>
                          ) : stage.active ? (
                            <span className="w-2 h-2 rounded-full bg-white" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4
                            className={`text-xs font-bold ${
                              stage.active
                                ? "text-[#0047d3]"
                                : stage.done
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {stage.label}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">{stage.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Line items with Hub Stock per line */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                    Order Line Items ({viewDrawerOrder.items.length})
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700">
                    {viewDrawerOrder.totalBoxes} boxes ({viewDrawerOrder.totalPieces} pcs)
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-xs bg-white">
                  {viewDrawerOrder.items.map((item, idx) => {
                    const hubStockBoxes = 140 - idx * 25; // realistic hub availability
                    const lineSubtotal = item.units * item.rate;

                    return (
                      <div key={idx} className="p-3.5 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              {item.brand} • Art #{item.artNumber}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-0.5">
                              {item.productTitle || item.productName}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                              <span className="font-semibold text-slate-700">{item.color}</span>
                              <span>•</span>
                              <span>{item.size}</span>
                              <span>•</span>
                              <span className="font-mono">₹{item.rate}/bx</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-bold text-slate-900 text-sm block">
                              {item.units} boxes
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 block">
                              {item.totalPieces} pcs
                            </span>
                            <span className="font-mono font-bold text-[#0047d3] text-xs block mt-0.5">
                              {formatINR(lineSubtotal)}
                            </span>
                          </div>
                        </div>

                        {/* Hub Stock Availability Badge */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-50 text-[11px]">
                          <span className="text-slate-500">Hub Stock Level:</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>In Stock: {hubStockBoxes} boxes available</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Financial & GST Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
                  Financial &amp; Tax Summary
                </span>
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal (excl. GST):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(viewDrawerOrder.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    GST (5% {viewDrawerOrder.retailerTown.includes("AP") ? "IGST" : "CGST 2.5% + SGST 2.5%"}):
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatINR(viewDrawerOrder.gstAmount || Math.round(viewDrawerOrder.subtotal * 0.05))}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                  <span className="font-bold text-slate-900">Grand Total:</span>
                  <span className="font-mono font-black text-[#0047d3] text-base">
                    {formatINR(viewDrawerOrder.grandTotal)}
                  </span>
                </div>
              </div>

              {/* Transporter / LR Consignment Details */}
              {(viewDrawerOrder.lrNumber || viewDrawerOrder.transporter) && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 uppercase tracking-wider text-[11px]">
                      Lorry Freight Consignment
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Waybill Issued
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Transporter:</span>
                    <span className="font-bold text-slate-900">{viewDrawerOrder.transporter || "Navata Road Transport"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Lorry Receipt (LR) #:</span>
                    <span className="font-mono font-bold text-[#0047d3] text-sm">
                      {viewDrawerOrder.lrNumber}
                    </span>
                  </div>
                  {viewDrawerOrder.ewayBill && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">e-Way Bill #:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {viewDrawerOrder.ewayBill}
                      </span>
                    </div>
                  )}
                  {viewDrawerOrder.dispatchDate && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Dispatch Date:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {viewDrawerOrder.dispatchDate}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Drawer Action Footer */}
            <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => setViewDrawerOrder(null)}
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer transition-colors"
              >
                Close Drawer
              </button>

              {viewDrawerOrder.status === "Submitted" && (
                <button
                  type="button"
                  onClick={() => openCreditCheckModal(viewDrawerOrder)}
                  className="flex-1 h-11 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span>Approve PO</span>
                </button>
              )}

              {viewDrawerOrder.status === "Approved" && (
                <button
                  type="button"
                  onClick={() => handleCreateInvoice(viewDrawerOrder)}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  <span>Create Invoice</span>
                </button>
              )}

              {viewDrawerOrder.status === "Confirmed" && (
                <button
                  type="button"
                  onClick={() => handleMarkPacked(viewDrawerOrder)}
                  className="flex-1 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">inventory</span>
                  <span>Mark Packed</span>
                </button>
              )}

              {viewDrawerOrder.status === "Processing" && (
                <button
                  type="button"
                  onClick={() => openDispatchModal(viewDrawerOrder)}
                  className="flex-1 h-11 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  <span>Dispatch Lorry</span>
                </button>
              )}

              {viewDrawerOrder.status === "Dispatched" && (
                <button
                  type="button"
                  onClick={() => handleMarkDelivered(viewDrawerOrder)}
                  className="flex-1 h-11 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  <span>Mark Delivered</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. APPROVE PO CREDIT-CHECK MODAL */}
      {/* ==================================================================== */}
      {creditCheckOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setCreditCheckOrder(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-blue-100 text-[#0047d3] flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-[20px]">credit_score</span>
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Credit Limit &amp; Overdue Audit
                    </h3>
                    <p className="text-xs text-slate-500">
                      PO #{creditCheckOrder.orderNumber} • {creditCheckOrder.retailerName}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCreditCheckOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* 6 Credit Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Credit Limit
                </span>
                <span className="text-base font-bold text-slate-900 font-mono block mt-0.5">
                  {formatINR(creditLimit)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Outstanding
                </span>
                <span className="text-base font-bold text-slate-900 font-mono block mt-0.5">
                  {formatINR(outstanding)}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  hasOverdue ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider block ${
                    hasOverdue ? "text-rose-700" : "text-slate-400"
                  }`}
                >
                  Overdue Balance
                </span>
                <span
                  className={`text-base font-bold font-mono block mt-0.5 ${
                    hasOverdue ? "text-rose-700" : "text-slate-900"
                  }`}
                >
                  {formatINR(overdue)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Available Credit
                </span>
                <span className="text-base font-bold text-emerald-700 font-mono block mt-0.5">
                  {formatINR(availableCredit)}
                </span>
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
                <span className="text-[10px] font-bold text-[#0047d3] uppercase tracking-wider block">
                  This PO (incl. GST)
                </span>
                <span className="text-base font-bold text-[#0047d3] font-mono block mt-0.5">
                  {formatINR(thisPOTotal)}
                </span>
              </div>

              <div
                className={`p-3 rounded-xl border flex flex-col justify-center ${
                  checkStatus === "WARNING"
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-emerald-50 border-emerald-200 text-emerald-800"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider block">
                  Credit Check Result
                </span>
                <span className="text-sm font-black flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">
                    {checkStatus === "WARNING" ? "warning" : "check_circle"}
                  </span>
                  <span>{checkStatus}</span>
                </span>
              </div>
            </div>

            {/* Overdue Warning Alert Box */}
            {currentOrderRetailer?.creditHold && (
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-300 text-xs text-rose-950 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-rose-700 text-[20px]">
                    block
                  </span>
                  <span className="font-bold text-sm">
                    Retailer is on Credit Hold! (Orders on hold)
                  </span>
                </div>
                <p className="text-rose-900/90 leading-relaxed text-[11px]">
                  <strong>{creditCheckOrder.retailerName}</strong> was placed on credit hold by ARK Credit Control.
                  Dispatch is frozen until outstanding balance is cleared or management override is provided.
                </p>
              </div>
            )}

            {hasOverdue && (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-300 text-xs text-amber-950 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-700 text-[20px]">
                    error
                  </span>
                  <span className="font-bold text-sm">
                    Overdue Invoices Exist: ₹{overdue.toLocaleString("en-IN")} on INV-0079
                  </span>
                </div>
                <p className="text-amber-900/90 leading-relaxed text-[11px]">
                  Retailer <strong>{creditCheckOrder.retailerName}</strong> has an overdue balance of{" "}
                  <strong>₹{overdue.toLocaleString("en-IN")}</strong> past credit terms on invoice <strong>INV-0079</strong>.
                  Standard credit policy requires payment settlement, or an authorized management override to release.
                </p>
              </div>
            )}

            {/* Option to Reduce Boxes Per Line if Hub Stock is short */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Allocated Quantities &amp; Hub Stock
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  Adjust boxes if hub stock is short
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
                {editableOrderItems.map((item, idx) => {
                  const hubStock = 150 - idx * 30;

                  return (
                    <div key={idx} className="p-3 flex items-center justify-between bg-white text-xs">
                      <div>
                        <span className="font-bold text-slate-900 block">
                          {item.brand} {item.productTitle || item.productName}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{item.color}</span>
                          <span>•</span>
                          <span>{item.size}</span>
                          <span>•</span>
                          <span className="text-emerald-700 font-semibold">
                            Hub Available: {hubStock} bx
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAdjustBoxes(idx, -5)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-slate-900 w-12 text-center">
                          {item.units} bx
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAdjustBoxes(idx, 5)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Decision Actions */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Select Approval Action
              </span>

              {/* Standard Approve */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleConfirmApproval(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">done</span>
                  <span>Standard Approve</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCreditAction(activeCreditAction === "override" ? null : "override")}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border transition-all ${
                    activeCreditAction === "override"
                      ? "bg-amber-500 text-slate-950 border-amber-600 shadow-sm"
                      : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>Approve with Override</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCreditAction(activeCreditAction === "reject" ? null : "reject")}
                  className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer border transition-all ${
                    activeCreditAction === "reject"
                      ? "bg-rose-600 text-white border-rose-700"
                      : "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">cancel</span>
                  <span>Reject PO</span>
                </button>
              </div>

              {/* Override Reason Form */}
              {activeCreditAction === "override" && (
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-300 space-y-3 animate-in fade-in">
                  <label className="text-xs font-bold text-amber-950 block">
                    Manager Override Justification <span className="text-rose-600">*</span>:
                  </label>
                  <textarea
                    rows={2}
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    placeholder="E.g. Proprietor promised RTGS settlement of INV-0079 by 5 PM today; approved by Wholesale Lead."
                    className="w-full p-2.5 rounded-xl bg-white border border-amber-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => handleConfirmApproval(true)}
                    disabled={!overrideReason.trim()}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 font-black text-xs cursor-pointer transition-all shadow-xs"
                  >
                    Confirm Override &amp; Release PO
                  </button>
                </div>
              )}

              {/* Rejection Reason Form */}
              {activeCreditAction === "reject" && (
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-300 space-y-3 animate-in fade-in">
                  <label className="text-xs font-bold text-rose-950 block">
                    Rejection Reason <span className="text-rose-600">*</span>:
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="E.g. Outstanding overdue balance of ₹31,000 exceeds 30-day term. Settle INV-0079 before placing new orders."
                    className="w-full p-2.5 rounded-xl bg-white border border-rose-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                  />
                  <button
                    type="button"
                    onClick={handleConfirmRejection}
                    disabled={!rejectionReason.trim()}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs cursor-pointer transition-all shadow-xs"
                  >
                    Confirm Rejection &amp; Notify Retailer
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setCreditCheckOrder(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. DISPATCH MODAL (When stage is Processing) */}
      {/* ==================================================================== */}
      {dispatchOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in"
          onClick={e => {
            if (e.target === e.currentTarget) setDispatchOrder(null);
          }}
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Logistics &amp; Transport
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Dispatch Lorry Freight
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  PO #{dispatchOrder.orderNumber} • {dispatchOrder.retailerName} ({dispatchOrder.retailerTown})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Preferred Transporter:
                </label>
                <select
                  value={dispatchTransporter}
                  onChange={e => setDispatchTransporter(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3]"
                >
                  <option value="Navata Road Transport">Navata Road Transport (Direct Secunderabad - Siddipet)</option>
                  <option value="VRL Logistics">VRL Logistics (Express B2B)</option>
                  <option value="Kalyani Transport">Kalyani Transport Service</option>
                  <option value="BMPS Parcel Service">BMPS Daily Parcel</option>
                </select>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Lorry Receipt (LR) Number <span className="text-rose-600">*</span>:
                </label>
                <input
                  type="text"
                  value={dispatchLR}
                  onChange={e => setDispatchLR(e.target.value)}
                  placeholder="E.g. NRT-88492-SDP"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047d3]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  GST e-Way Bill Number (if applicable):
                </label>
                <input
                  type="text"
                  value={dispatchEwayBill}
                  onChange={e => setDispatchEwayBill(e.target.value)}
                  placeholder="E.g. 241098452103"
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047d3]"
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">
                  Dispatch Date:
                </label>
                <input
                  type="text"
                  value={dispatchDate}
                  onChange={e => setDispatchDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047d3]"
                />
              </div>

              <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-[11px] text-blue-900">
                <span className="font-bold block">Consignment Sync Notice:</span>
                Assigning this LR number will automatically feed into the retailer&apos;s Track Lorry Receipt drawer and notify Sri Laxmi Narasimha Textiles.
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={() => setDispatchOrder(null)}
                className="flex-1 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                className="flex-1 h-11 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                <span>Confirm Dispatch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}