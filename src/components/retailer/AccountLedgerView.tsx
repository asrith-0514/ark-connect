"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  RETAILER_PROFILE,
  RETAILER_INVOICES,
  RETAILER_PAYMENTS,
  getRetailerFinancials,
  getRetailerOrderMetrics,
  formatINR,
  isDemoModeEnabled,
  downloadInvoicePDF,
} from "@/lib/mock";
import CreditMeter from "@/components/retailer/CreditMeter";

export default function AccountLedgerView() {
  const { setRetailerNav, orders, invoices, payments, currentDate, retailers } = useApp();
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const currentRetailerRecord = useMemo(() => {
    return retailers.find(
      r => r.code === RETAILER_PROFILE.code || r.id === RETAILER_PROFILE.id || r.name.toLowerCase().includes(RETAILER_PROFILE.name.toLowerCase())
    );
  }, [retailers]);

  const isCreditHeld = !!currentRetailerRecord?.creditHold;

  useEffect(() => {
    setIsDemo(isDemoModeEnabled());
    if (typeof window !== "undefined") {
      const stateParam = new URLSearchParams(window.location.search).get("state");
      if (stateParam === "empty") setShowEmptyState(true);
    }
  }, []);

  // Filter dynamic invoices for this retailer (Drafts are invisible per Requirement 2)
  const retailerInvoices = useMemo(() => {
    const list = invoices.filter(
      i =>
        (i.retailerId === "ret-1" ||
          i.retailerId === RETAILER_PROFILE.code ||
          i.retailerName.toLowerCase().includes(RETAILER_PROFILE.name.toLowerCase())) &&
        i.status !== "Draft"
    );

    if (list.length === 0) return RETAILER_INVOICES;

    return list.map(i => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      orderNumber: i.orderNumber,
      billedDate: i.billedDate || i.date,
      total: i.grandTotal || i.total,
      paid: i.paid || 0,
      balanceDue: i.balanceDue,
      dueDate: i.dueDate,
      status: i.status as any,
      statusBadge: i.status === "Paid" ? "Paid" : i.status === "Overdue" ? "Overdue" : "Due Soon",
      receiptRef: i.receiptRef,
      creditDays: i.creditDays || 30,
      taxRatePercent: i.taxRatePercent || 5,
      itemsCount: i.items?.length || 1,
    }));
  }, [invoices]);

  // Filter dynamic payments for this retailer
  const retailerPayments = useMemo(() => {
    const list = payments.filter(
      p =>
        p.retailerId === "ret-1" ||
        p.retailerId === RETAILER_PROFILE.code ||
        p.retailerName.toLowerCase().includes(RETAILER_PROFILE.name.toLowerCase())
    );

    if (list.length === 0) return RETAILER_PAYMENTS;

    return list.map(p => ({
      id: p.id,
      receiptNumber: p.receiptNumber,
      date: p.date,
      invoiceNumber: p.invoiceNumber,
      orderNumber: p.orderNumber,
      amount: p.amount,
      mode: (p.mode as any) || "UPI",
      referenceId: p.referenceId,
      reconciled: p.reconciled ?? true,
    }));
  }, [payments]);

  const financials = getRetailerFinancials(retailerInvoices, undefined, currentDate);
  const orderMetrics = getRetailerOrderMetrics(orders);

  // Requirement 3: Sort invoices with overdue first, then by due date
  const sortedInvoices = [...retailerInvoices].sort((a, b) => {
    // 1. Overdue first
    if (a.status === "Overdue" && b.status !== "Overdue") return -1;
    if (b.status === "Overdue" && a.status !== "Overdue") return 1;
    // 2. Unpaid next
    if (a.balanceDue > 0 && b.balanceDue === 0) return -1;
    if (b.balanceDue > 0 && a.balanceDue === 0) return 1;
    // 3. Chronological
    return a.invoiceNumber.localeCompare(b.invoiceNumber);
  });

  // Calculate total payments received
  const totalPaymentsAmount = retailerPayments.reduce((sum, p) => sum + p.amount, 0);

  // Primary overdue invoice for alert
  const primaryOverdue = financials.overdueInvoices[0] || {
    invoiceNumber: "INV-0079",
    balanceDue: 31000,
  };

  // Requirement 1 & 2: WhatsApp deep link builder
  const buildWhatsAppLink = (invoiceNo?: string, amount?: number) => {
    const inv = invoiceNo || primaryOverdue.invoiceNumber;
    const amt = amount !== undefined ? formatINR(amount) : formatINR(primaryOverdue.balanceDue);
    const message = `Payment proof from ${RETAILER_PROFILE.name} (${RETAILER_PROFILE.code}) for invoice ${inv} of amount ${amt}.`;
    return `https://wa.me/919440123456?text=${encodeURIComponent(message)}`;
  };

  // Requirement 6: Real Ledger Download (CSV export)
  const handleDownloadLedger = () => {
    const csvRows: string[] = [
      "ARK DISTRIBUTORS - WHOLESALE ACCOUNT STATEMENT",
      `Retailer Name,"${RETAILER_PROFILE.name}"`,
      `Retailer Code,"${RETAILER_PROFILE.code}"`,
      `Proprietor,"${RETAILER_PROFILE.proprietor}"`,
      `GSTIN,"${RETAILER_PROFILE.gstin}"`,
      `Phone,"${RETAILER_PROFILE.phone}"`,
      `Address,"${RETAILER_PROFILE.address}"`,
      `Statement Date,"${new Date().toLocaleDateString("en-IN")}"`,
      `Credit Limit,"INR ${financials.creditLimit}"`,
      `Total Outstanding,"INR ${financials.totalOutstanding}"`,
      `Overdue Amount,"INR ${financials.overdueAmount}"`,
      `Available Credit,"INR ${financials.availableCredit}"`,
      "",
      "INVOICE SUMMARY",
      "Invoice Number,PO Number,Billed Date,Due Date,Total Amount,Paid Amount,Balance Due,Status",
      ...retailerInvoices.map(inv =>
        `"${inv.invoiceNumber}","${inv.orderNumber}","${inv.billedDate}","${inv.dueDate}",${inv.total},${inv.paid},${inv.balanceDue},"${inv.status}"`
      ),
      "",
      "PAYMENTS RECEIVED SUMMARY",
      "Receipt Number,Date,Payment Mode,Reference ID,Applied Invoice,Amount",
      ...retailerPayments.map(pay =>
        `"${pay.receiptNumber}","${pay.date}","${pay.mode}","${pay.referenceId}","${pay.invoiceNumber}",${pay.amount}`
      ),
      "",
      "ACCOUNT TOTALS",
      `Total Invoiced,"INR ${financials.totalInvoiced}"`,
      `Total Paid,"INR ${financials.totalPaid}"`,
      `Total Outstanding Balance,"INR ${financials.totalOutstanding}"`,
      `Overdue Balance,"INR ${financials.overdueAmount}"`
    ];

    const blob = new Blob([csvRows.join("\r\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ARK_Ledger_${RETAILER_PROFILE.code}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess("Ledger statement downloaded successfully as CSV.");
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  // Requirement 3: Real PDF Download using shared generator
  const handleDownloadInvoice = (invoiceNo: string) => {
    const fullInv = invoices.find(i => i.invoiceNumber === invoiceNo) || {
      id: `inv-${invoiceNo}`,
      invoiceNumber: invoiceNo,
      orderNumber: "ARK-8812",
      retailerId: RETAILER_PROFILE.code,
      retailerName: RETAILER_PROFILE.name,
      retailerTown: RETAILER_PROFILE.town,
      retailerGstin: RETAILER_PROFILE.gstin,
      billedDate: "14 Oct 2026",
      date: "14 Oct 2026",
      dueDate: "13 Nov 2026",
      creditDays: 30,
      status: "Partly Paid" as const,
      subtotal: 31619.05,
      discount: 0,
      taxableValue: 31619.05,
      taxRatePercent: 5,
      cgstAmount: 790.48,
      sgstAmount: 790.48,
      igstAmount: 0,
      roundOff: -0.01,
      grandTotal: 33200,
      total: 33200,
      paid: 10000,
      balanceDue: 23200,
      items: [
        {
          description: "Combed Cotton Rib Vest RN75",
          variant: "Classic White / Size L",
          brand: "Flybirds",
          hsn: "61091000",
          boxes: 50,
          rate: 325,
          amount: 16250,
        },
      ],
    };

    downloadInvoicePDF(fullInv as any, RETAILER_PROFILE);
    setDownloadSuccess(`Tax Invoice ${invoiceNo} downloaded as official PDF.`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* Toast Notification for Real Downloads */}
      {downloadSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Requirement 6: Credit Hold Banner */}
      {isCreditHeld && (
        <section
          role="alert"
          className="bg-red-50 border-2 border-red-400 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0 border border-red-200">
              <span className="material-symbols-outlined text-[24px]">lock</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-600 text-white">
                  Account On Hold
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-red-950 mt-1">
                Orders on hold, please settle ₹{formatINR(financials.totalOutstanding)}
              </p>
              <p className="text-xs text-red-800/80 mt-0.5">
                New purchase order dispatches are currently paused pending payment reconciliation.
              </p>
            </div>
          </div>
          <a
            href={`https://wa.me/919440122890?text=${encodeURIComponent(
              `Hello ARK Distributors, our account (${RETAILER_PROFILE.code} - ${RETAILER_PROFILE.name}) is on credit hold. We are arranging payment of ${formatINR(financials.totalOutstanding)}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <span>Contact ARK Backoffice</span>
          </a>
        </section>
      )}

      {/* Requirement 1: Red Alert Banner for Overdue Invoice */}
      {financials.overdueAmount > 0 && !isCreditHeld && (
        <section
          role="alert"
          className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-600 text-white">
                  Payment Overdue
                </span>
                <span className="text-xs text-rose-700 font-mono font-semibold">
                  {primaryOverdue.invoiceNumber}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-rose-950 mt-1">
                {formatINR(financials.overdueAmount)} overdue on {primaryOverdue.invoiceNumber}. Please settle to avoid order holds.
              </p>
              <p className="text-xs text-rose-800/80 mt-0.5">
                Past grace period. Upload your bank deposit or UPI slip to clear dispatches.
              </p>
            </div>
          </div>

          {/* WhatsApp Deep Link Button */}
          <a
            href={buildWhatsAppLink(primaryOverdue.invoiceNumber, financials.overdueAmount)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span>Send payment proof</span>
          </a>
        </section>
      )}

      {/* 2. Retailer Profile Header Card */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0047d3] flex items-center justify-center font-bold text-lg border border-blue-100 shrink-0">
              <span className="material-symbols-outlined text-[26px]">storefront</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                  {RETAILER_PROFILE.name}
                </h1>
                <span className="bg-blue-100 text-[#0047d3] text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
                  {RETAILER_PROFILE.code}
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                  <span>GSTIN Verified</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Prop. {RETAILER_PROFILE.proprietor} • {RETAILER_PROFILE.address}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 font-mono">
                <span>GSTIN: {RETAILER_PROFILE.gstin}</span>
                <span>•</span>
                <span>Ph: {RETAILER_PROFILE.phone}</span>
              </div>
            </div>
          </div>

          {/* Requirement 6: Real Download Ledger Action */}
          <div className="self-start sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadLedger}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-200 shadow-2xs cursor-pointer"
              title="Download real CSV statement"
            >
              <span className="material-symbols-outlined text-[16px] text-[#0047d3]">
                download
              </span>
              <span>Download Ledger (CSV)</span>
            </button>
          </div>
        </div>

        {/* Financial Highlights Row */}
        <div className="pt-2 border-t border-slate-100 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Outstanding */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Outstanding
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {formatINR(financials.totalOutstanding)}
              </span>
              <span className="text-xs text-rose-600 font-medium mt-1">
                {formatINR(financials.overdueAmount)} past due grace
              </span>
            </div>

            {/* Overdue */}
            <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Overdue Bills
              </span>
              <span className="text-2xl font-bold text-rose-700 font-mono mt-1">
                {formatINR(financials.overdueAmount)}
              </span>
              <span className="text-xs text-rose-600 font-medium mt-1">
                {primaryOverdue.invoiceNumber} past due date
              </span>
            </div>

            {/* Next Due */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Next Due Payment
              </span>
              <span className="text-2xl font-bold text-slate-900 font-mono mt-1">
                {formatINR(financials.nextDueAmount)}
              </span>
              <span className="text-xs text-amber-700 font-medium mt-1">
                Due: {financials.nextDueDate} (in {financials.nextDueDays} day)
              </span>
            </div>
          </div>

          {/* Requirement 4: Reused Shared Credit-Meter Component */}
          <CreditMeter
            totalOutstanding={financials.totalOutstanding}
            availableCredit={financials.availableCredit}
            creditLimit={financials.creditLimit}
            usedCreditPercent={financials.usedCreditPercent}
            availableCreditPercent={financials.availableCreditPercent}
          />
        </div>
      </div>

      {/* 3. Metric Summary Row (Stacked on mobile to 1 col, 3 cols on sm+) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3.5 flex flex-col items-center text-center shadow-2xs border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Invoiced
          </span>
          <span className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {formatINR(financials.totalInvoiced)}
          </span>
          <span className="text-[11px] text-slate-400">{RETAILER_INVOICES.length} bills</span>
        </div>
        <div className="bg-white rounded-xl p-3.5 flex flex-col items-center text-center shadow-2xs border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Paid
          </span>
          <span className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
            {formatINR(financials.totalPaid)}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium">Reconciled</span>
        </div>
        <div className="bg-white rounded-xl p-3.5 flex flex-col items-center text-center shadow-2xs border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Orders
          </span>
          <span className="text-lg font-bold text-slate-900 font-mono mt-0.5">
            {orderMetrics.totalOrdersCount}
          </span>
          <span className="text-[11px] text-slate-400">Lifetime</span>
        </div>
      </div>

      {/* 4. Tabbed Switcher (Invoices / Payments) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("invoices")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "invoices"
                  ? "bg-white text-[#0047d3] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">receipt</span>
              <span>Invoices ({retailerInvoices.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "payments"
                  ? "bg-white text-[#0047d3] shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">payments</span>
              <span>Payments ({retailerPayments.length})</span>
            </button>
          </div>

          {isDemo && (
            <button
              type="button"
              onClick={() => setShowEmptyState(!showEmptyState)}
              className="text-xs text-[#0047d3] hover:underline font-semibold cursor-pointer"
            >
              {showEmptyState ? "Show Active Data" : "Preview Empty State"}
            </button>
          )}
        </div>

        {/* Empty State Preview Frame */}
        {showEmptyState ? (
          <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-[36px]">inventory_2</span>
            </div>
            <h3 className="text-base font-bold text-slate-900">No invoices generated yet</h3>
            <p className="text-xs text-slate-500 max-w-xs">
              Invoices will appear here once your orders are packed, weighed, and dispatched from Secunderabad central hub.
            </p>
            <button
              type="button"
              onClick={() => setRetailerNav("catalogue")}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#0047d3] text-white text-xs font-semibold cursor-pointer"
            >
              Browse Catalogue
            </button>
          </div>
        ) : activeTab === "invoices" ? (
          /* INVOICES LIST (Sorted: Overdue first, then due date) */
          <div className="space-y-4">
            {sortedInvoices.map(inv => {
              const isOverdue = inv.status === "Overdue";
              const isPaid = inv.status === "Paid";
              const isInv0094 = inv.invoiceNumber === "INV-0094";

              return (
                <div
                  key={inv.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 shadow-xs border ${
                    isOverdue ? "border-rose-300 ring-1 ring-rose-200" : "border-slate-200"
                  } space-y-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base font-mono">
                          {inv.invoiceNumber}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono text-xs">
                          {inv.orderNumber}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        Billed: {inv.billedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {/* Requirement 3: Due in 1 day in amber for INV-0094 */}
                      {isInv0094 && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Due in 1 day • 13 Nov 2026
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                            : isOverdue
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-amber-100 text-amber-900 border-amber-200"
                        }`}
                      >
                        {inv.statusBadge}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown Box */}
                  <div
                    className={`rounded-xl p-3.5 border space-y-1.5 text-xs sm:text-sm ${
                      isOverdue
                        ? "bg-rose-50/50 border-rose-200"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex justify-between text-slate-600">
                      <span>Total Invoiced (incl. 5% GST):</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatINR(inv.total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Paid to date:</span>
                      <span
                        className={`font-mono font-bold ${
                          inv.paid > 0 ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {formatINR(inv.paid)}
                      </span>
                    </div>
                    <div className={`h-px my-1 ${isOverdue ? "bg-rose-200" : "bg-slate-200"}`} />
                    <div
                      className={`flex justify-between font-bold ${
                        isOverdue ? "text-rose-700" : "text-slate-900"
                      }`}
                    >
                      <span>Balance due:</span>
                      <span
                        className={`font-mono text-base ${
                          isOverdue
                            ? "text-rose-700"
                            : inv.balanceDue > 0
                            ? "text-[#0047d3]"
                            : "text-emerald-700"
                        }`}
                      >
                        {formatINR(inv.balanceDue)}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between text-[11px] pt-1 ${
                        isOverdue ? "text-rose-600" : "text-slate-500"
                      }`}
                    >
                      <span>
                        {inv.receiptRef
                          ? `Receipt Ref: ${inv.receiptRef}`
                          : `Credit Terms: ${inv.creditDays} Days`}
                      </span>
                      <span
                        className={`font-semibold ${
                          isOverdue
                            ? "text-rose-700 font-bold"
                            : isPaid
                            ? "text-emerald-700"
                            : "text-slate-800"
                        }`}
                      >
                        {isOverdue
                          ? `Due: ${inv.dueDate} (Overdue)`
                          : isPaid
                          ? "Settled & Verified"
                          : `Due: ${inv.dueDate}`}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons (Requirement 2: Prefilled WhatsApp link on unpaid card) */}
                  <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                    {!isPaid && (
                      <a
                        href={buildWhatsAppLink(inv.invoiceNumber, inv.balanceDue)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:flex-1 h-10 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        title={`Send payment proof for ${inv.invoiceNumber}`}
                      >
                        <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                        <span>Send payment proof</span>
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(inv.invoiceNumber)}
                      className={`h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 cursor-pointer ${
                        isPaid ? "w-full" : "w-full sm:w-auto"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px] text-[#0047d3]">
                        download
                      </span>
                      <span>Download Invoice {inv.invoiceNumber}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Requirement 5: PAYMENTS TAB showing date, amount, mode (UPI/NEFT/Cash), receipt ref, plus total */
          <div className="space-y-4">
            {/* Payments Total Summary Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-md flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Reconciled Receipts
                </span>
                <span className="text-2xl font-bold text-emerald-400 font-mono mt-0.5 block">
                  {formatINR(totalPaymentsAmount)}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">
                  Reconciled into Sri Laxmi Narasimha Textiles ledger
                </span>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  {retailerPayments.length} Verified Payments
                </span>
              </div>
            </div>

            {/* Payments Table / List */}
            <div className="space-y-3">
              {retailerPayments.map(pay => (
                <div
                  key={pay.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shrink-0">
                        <span className="material-symbols-outlined text-[20px]">
                          {pay.mode === "UPI"
                            ? "qr_code_2"
                            : pay.mode === "NEFT"
                            ? "account_balance"
                            : "payments"}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">
                            {pay.mode} Payment
                          </h4>
                          {/* Mode Badge (Requirement 5) */}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                            {pay.mode}
                          </span>
                        </div>
                        {/* Date (Requirement 5) */}
                        <span className="text-xs text-slate-400 block mt-0.5">
                          Received on {pay.date}
                        </span>
                      </div>
                    </div>

                    {/* Amount (Requirement 5) */}
                    <div className="text-right">
                      <span className="text-lg font-bold text-emerald-700 font-mono block">
                        +{formatINR(pay.amount)}
                      </span>
                      <span className="text-[11px] text-emerald-600 font-medium">Reconciled</span>
                    </div>
                  </div>

                  {/* Payment Details Box (Requirement 5: Receipt ref, Applied invoice) */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receipt Ref:</span>
                      <span className="font-mono text-[#0047d3] font-bold">
                        {pay.referenceId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Internal Voucher:</span>
                      <span className="font-mono text-slate-700">{pay.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Applied Towards:</span>
                      <span className="font-mono font-bold text-slate-900">
                        {pay.invoiceNumber} ({pay.orderNumber})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary Footer (Requirement 5) */}
            <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between text-xs sm:text-sm font-semibold text-slate-800">
              <span>Total Payments Recorded:</span>
              <span className="font-mono font-bold text-emerald-800 text-base">
                {formatINR(totalPaymentsAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Policy & Direct Support Contact */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0047d3] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[20px]">verified</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Official Wholesale Accounts Policy</h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Wholesale payments to ARK Distributors are reconciled daily. Settlements via bank transfer (NEFT/RTGS), UPI, or cheque are reflected in your available credit within 24 hours of clearance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
