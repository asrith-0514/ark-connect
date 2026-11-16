"use client";
import { Icon } from "@/components/ui/Icon";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import {
  RETAILER_PROFILE,
  RETAILER_INVOICES,
  RETAILER_PAYMENTS,
  getRetailerFinancials,
  getRetailerOrderMetrics,
  formatINR,
  isDemoModeEnabled,
  downloadInvoicePDF,
  getDaysUntil,
} from "@/lib/mock";
import CreditMeter from "@/components/retailer/CreditMeter";

export default function AccountLedgerView() {
  const { setRetailerNav, orders, invoices, payments, currentDate, retailers } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"invoices" | "payments">("invoices");
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const activeRetailerId = user?.type === "retailer" ? (user.retailerId || "ret-1") : "ret-1";
  const activeRetailerCode = user?.type === "retailer" ? (user.retailerCode || "RET-0001") : "RET-0001";

  const currentRetailerRecord = useMemo(() => {
    return (
      retailers.find(
        r => r.code === activeRetailerCode || r.id === activeRetailerId
      ) || retailers.find(r => r.id === "ret-1")
    );
  }, [retailers, activeRetailerId, activeRetailerCode]);

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
        (i.retailerId === activeRetailerId ||
          i.retailerId === activeRetailerCode ||
          (currentRetailerRecord && i.retailerName.toLowerCase() === currentRetailerRecord.name.toLowerCase())) &&
        i.status !== "Draft"
    );

    if (list.length === 0 && activeRetailerId === "ret-1") return RETAILER_INVOICES;

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
  }, [invoices, activeRetailerId, activeRetailerCode, currentRetailerRecord]);

  // Filter dynamic payments for this retailer
  const retailerPayments = useMemo(() => {
    const list = payments.filter(
      p =>
        p.retailerId === activeRetailerId ||
        p.retailerId === activeRetailerCode ||
        (currentRetailerRecord && p.retailerName.toLowerCase() === currentRetailerRecord.name.toLowerCase())
    );

    if (list.length === 0 && activeRetailerId === "ret-1") return RETAILER_PAYMENTS;

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
  }, [payments, activeRetailerId, activeRetailerCode, currentRetailerRecord]);

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
  const primaryOverdue: { invoiceNumber: string; balanceDue: number } =
    financials.overdueInvoices[0] || sortedInvoices[0] || {
      invoiceNumber: "INV-0001",
      balanceDue: 0,
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
      orderNumber: orders[0]?.orderNumber || "PO-0001",
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
        <div className="fixed bottom-6 right-6 z-50 bg-ink text-surface text-xs font-semibold px-4 py-3 rounded-md shadow-2xl flex items-center gap-2 border border-border animate-in fade-in slide-in-from-bottom-2">
          <Icon name="check_circle" size={18} className="text-success" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Requirement 6: Credit Hold Banner */}
      {isCreditHeld && (
        <section
          role="alert"
          className="bg-danger/10 border-2 border-danger/40 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-soft-sm animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger/15 text-danger flex items-center justify-center shrink-0 border border-danger/30">
              <Icon name="lock" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-danger text-white">
                  Account On Hold
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-danger mt-1">
                Orders on hold, please settle ₹{formatINR(financials.totalOutstanding)}
              </p>
              <p className="text-xs text-danger/80 mt-0.5">
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
            className="w-full sm:w-auto min-h-[48px] h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-soft-sm transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <span>Contact ARK Backoffice</span>
          </a>
        </section>
      )}

      {/* Requirement 1: Red Alert Banner for Overdue Invoice in Danger Style */}
      {financials.overdueAmount > 0 && !isCreditHeld && (
        <section
          role="alert"
          className="bg-danger/10 border-2 border-danger/40 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-soft-sm animate-in fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-danger/15 text-danger flex items-center justify-center shrink-0 border border-danger/30">
              <Icon name="warning" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-danger text-white">
                  Payment Overdue
                </span>
                <span className="text-xs text-danger font-mono font-semibold num">
                  {financials.oldestOverdue ? `Oldest: ${financials.oldestOverdue.invoiceNumber}` : primaryOverdue.invoiceNumber}
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-danger mt-1">
                {financials.overdueSummaryText || `${formatINR(financials.overdueAmount)} overdue on ${primaryOverdue.invoiceNumber}. Please settle to avoid order holds.`}
              </p>
              <p className="text-xs text-danger/80 mt-0.5">
                Past payment due date. Upload your bank deposit or UPI slip to clear dispatches.
              </p>
            </div>
          </div>

          {/* WhatsApp Deep Link Button */}
          <a
            href={buildWhatsAppLink(primaryOverdue.invoiceNumber, financials.overdueAmount)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto min-h-[48px] h-12 px-6 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-soft-sm transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
            <span>Send payment proof</span>
          </a>
        </section>
      )}

      {/* 2. Retailer Profile Header Card */}
      <div className="bg-surface rounded-xl p-5 sm:p-6 shadow-soft-sm border border-border space-y-4 text-ink">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20 shrink-0">
              <Icon name="storefront" size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-ink font-sans">
                  {RETAILER_PROFILE.name}
                </h1>
                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full font-mono num">
                  {RETAILER_PROFILE.code}
                </span>
                <span className="inline-flex items-center gap-1 bg-success/10 text-success border border-success/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  <Icon name="verified" size={14} />
                  <span>GSTIN Verified</span>
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Prop. {RETAILER_PROFILE.proprietor} • {RETAILER_PROFILE.address}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-ink-muted font-mono num">
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
              className="min-h-[44px] px-4 py-2 rounded-md bg-surface hover:bg-background text-ink font-semibold text-xs flex items-center gap-1.5 transition-colors border border-border shadow-soft-sm cursor-pointer"
              title="Download real CSV statement"
            >
              <Icon name="download" size={16} className="text-primary" />
              <span>Download Ledger (CSV)</span>
            </button>
          </div>
        </div>

        {/* Financial Highlights Row with Big Numbers */}
        <div className="pt-2 border-t border-border space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Outstanding */}
            <div className="bg-background p-5 rounded-lg border border-border shadow-soft-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                Total Outstanding
              </span>
              <span className="text-3xl font-bold text-ink font-mono num mt-1">
                {formatINR(financials.totalOutstanding)}
              </span>
              <span className="text-xs text-danger font-medium mt-1 num">
                {formatINR(financials.overdueAmount)} overdue
              </span>
            </div>

            {/* Overdue */}
            <div className="bg-danger/5 p-5 rounded-lg border border-danger/25 shadow-soft-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-danger uppercase tracking-wider">
                Overdue Bills
              </span>
              <span className="text-3xl font-bold text-danger font-mono num mt-1">
                {formatINR(financials.overdueAmount)}
              </span>
              <span className="text-xs text-danger/80 font-medium mt-1 num">
                {primaryOverdue.invoiceNumber} past due date
              </span>
            </div>

            {/* Next Due (Not Yet Due) */}
            <div className="bg-background p-5 rounded-lg border border-border shadow-soft-sm flex flex-col justify-between">
              <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
                {financials.hasUpcomingDue ? "Next Due (Not Yet Due)" : "Next Due"}
              </span>
              {financials.hasUpcomingDue ? (
                <>
                  <span className="text-3xl font-bold text-ink font-mono num mt-1">
                    {formatINR(financials.nextDueAmount)}
                  </span>
                  <span className="text-xs text-warning font-medium mt-1 num">
                    Due: {financials.nextDueDate} (in {financials.nextDueDays} {financials.nextDueDays === 1 ? "day" : "days"})
                  </span>
                </>
              ) : (
                <div className="mt-2">
                  <span className="text-sm font-semibold text-ink-muted">No upcoming dues</span>
                  <span className="text-xs text-success block mt-1">All current invoices settled</span>
                </div>
              )}
            </div>
          </div>

          {/* Reused Shared Credit-Meter Component */}
          <CreditMeter
            totalOutstanding={financials.totalOutstanding}
            availableCredit={financials.availableCredit}
            creditLimit={financials.creditLimit}
            usedCreditPercent={financials.usedCreditPercent}
            availableCreditPercent={financials.availableCreditPercent}
          />
        </div>
      </div>

      {/* 3. Metric Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-surface rounded-xl p-4 flex flex-col items-center text-center shadow-soft-sm border border-border text-ink">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
            Total Invoiced
          </span>
          <span className="text-xl font-bold text-ink font-mono num mt-1">
            {formatINR(financials.totalInvoiced)}
          </span>
          <span className="text-[11px] text-ink-muted num">{RETAILER_INVOICES.length} bills</span>
        </div>
        <div className="bg-surface rounded-xl p-4 flex flex-col items-center text-center shadow-soft-sm border border-border text-ink">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
            Total Paid
          </span>
          <span className="text-xl font-bold text-success font-mono num mt-1">
            {formatINR(financials.totalPaid)}
          </span>
          <span className="text-[11px] text-success font-medium">Reconciled</span>
        </div>
        <div className="bg-surface rounded-xl p-4 flex flex-col items-center text-center shadow-soft-sm border border-border text-ink">
          <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
            Total Orders
          </span>
          <span className="text-xl font-bold text-ink font-mono num mt-1">
            {orderMetrics.totalOrdersCount}
          </span>
          <span className="text-[11px] text-ink-muted">Lifetime</span>
        </div>
      </div>

      {/* 4. Tabbed Switcher (Invoices / Payments) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-surface border border-border p-1 rounded-lg shadow-soft-sm">
            <button
              type="button"
              onClick={() => setActiveTab("invoices")}
              className={`min-h-[44px] px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "invoices"
                  ? "bg-primary text-primary-foreground shadow-soft-sm"
                  : "text-ink-muted hover:text-ink"
                }`}
            >
              <Icon name="receipt" size={16} />
              <span>Invoices ({retailerInvoices.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={`min-h-[44px] px-4 py-2 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === "payments"
                  ? "bg-primary text-primary-foreground shadow-soft-sm"
                  : "text-ink-muted hover:text-ink"
                }`}
            >
              <Icon name="payments" size={16} />
              <span>Payments ({retailerPayments.length})</span>
            </button>
          </div>

          {isDemo && (
            <button
              type="button"
              onClick={() => setShowEmptyState(!showEmptyState)}
              className="text-xs text-primary hover:underline font-semibold cursor-pointer"
            >
              {showEmptyState ? "Show Active Data" : "Preview Empty State"}
            </button>
          )}
        </div>

        {/* Empty State Preview Frame */}
        {showEmptyState ? (
          <div className="bg-surface rounded-xl p-8 sm:p-12 shadow-soft-sm border border-border text-center flex flex-col items-center gap-3 text-ink">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Icon name="inventory_2" size={36} />
            </div>
            <h3 className="text-base font-bold text-ink font-sans">No invoices generated yet</h3>
            <p className="text-xs text-ink-muted max-w-xs">
              Invoices will appear here once your orders are packed, weighed, and dispatched from Secunderabad central hub.
            </p>
            <button
              type="button"
              onClick={() => setRetailerNav("catalogue")}
              className="mt-2 min-h-[44px] px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold cursor-pointer shadow-soft-sm hover:opacity-90"
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
              const daysUntilDue = getDaysUntil(inv.dueDate, currentDate);
              const isDueSoon = !isPaid && !isOverdue && daysUntilDue >= 0 && daysUntilDue <= 2;

              return (
                <div
                  key={inv.id}
                  className={`bg-surface rounded-lg p-4 sm:p-5 shadow-soft-sm border ${isOverdue ? "border-danger/40 ring-1 ring-danger/20" : "border-border"
                    } space-y-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink text-base font-mono">
                          {inv.invoiceNumber}
                        </span>
                        <span className="bg-surface-raised px-2 py-0.5 rounded text-ink-muted font-mono text-xs">
                          {inv.orderNumber}
                        </span>
                      </div>
                      <span className="text-xs text-ink-muted mt-0.5 block">
                        Billed: {inv.billedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {isDueSoon && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-warning/15 text-warning border border-warning/30">
                          Due in {daysUntilDue} {daysUntilDue === 1 ? "day" : "days"} • {inv.dueDate}
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold border ${isPaid
                            ? "bg-success/15 text-success border border-success/30"
                            : isOverdue
                              ? "bg-danger/15 text-danger border border-danger/30"
                              : "bg-warning/15 text-warning border border-warning/30"
                          }`}
                      >
                        {inv.statusBadge}
                      </span>
                    </div>
                  </div>

                  {/* Financial Breakdown Box */}
                  <div
                    className={`rounded-md p-3.5 border space-y-1.5 text-xs sm:text-sm ${isOverdue
                        ? "bg-danger/10 border-danger/30"
                        : "bg-surface-raised border-border"
                      }`}
                  >
                    <div className="flex justify-between text-ink-muted">
                      <span>Total Invoiced (incl. 5% GST):</span>
                      <span className="font-mono font-bold text-ink">
                        {formatINR(inv.total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>Paid to date:</span>
                      <span
                        className={`font-mono font-bold ${inv.paid > 0 ? "text-success" : "text-ink-muted"
                          }`}
                      >
                        {formatINR(inv.paid)}
                      </span>
                    </div>
                    <div className={`h-px my-1 ${isOverdue ? "bg-danger/20" : "bg-surface-raised"}`} />
                    <div
                      className={`flex justify-between font-bold ${isOverdue ? "text-danger" : "text-ink"
                        }`}
                    >
                      <span>Balance due:</span>
                      <span
                        className={`font-mono text-base ${isOverdue
                            ? "text-danger"
                            : inv.balanceDue > 0
                              ? "text-primary"
                              : "text-success"
                          }`}
                      >
                        {formatINR(inv.balanceDue)}
                      </span>
                    </div>
                    <div
                      className={`flex justify-between text-[11px] pt-1 ${isOverdue ? "text-danger" : "text-ink-muted"
                        }`}
                    >
                      <span>
                        {inv.receiptRef
                          ? `Receipt Ref: ${inv.receiptRef}`
                          : `Credit Terms: ${inv.creditDays} Days`}
                      </span>
                      <span
                        className={`font-semibold ${isOverdue
                            ? "text-danger font-bold"
                            : isPaid
                              ? "text-success"
                              : "text-ink"
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
                        className="w-full sm:flex-1 h-10 px-4 rounded-md bg-[#25D366] hover:bg-[#1ebd59] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-soft-sm transition-all cursor-pointer"
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
                      className={`h-10 px-4 rounded-xl bg-surface-raised hover:bg-surface-raised text-ink font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-border cursor-pointer ${isPaid ? "w-full" : "w-full sm:w-auto"
                        }`}
                    >
                      <Icon name="download" size={16} className="text-primary" />
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
            <div className="bg-ink text-surface p-4 sm:p-5 rounded-2xl border border-border shadow-md flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-ink-muted uppercase tracking-wider block">
                  Total Reconciled Receipts
                </span>
                <span className="text-2xl font-bold text-success font-mono mt-0.5 block">
                  {formatINR(totalPaymentsAmount)}
                </span>
                <span className="text-xs text-ink-muted mt-0.5">
                  Reconciled into {RETAILER_PROFILE.name} ledger
                </span>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-success/15 text-success font-bold text-xs border border-success/30">
                  {retailerPayments.length} Verified Payments
                </span>
              </div>
            </div>

            {/* Payments Table / List */}
            <div className="space-y-3">
              {retailerPayments.map(pay => (
                <div
                  key={pay.id}
                  className="bg-surface rounded-lg p-4 sm:p-5 shadow-soft-sm border border-border space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-success/10 text-success flex items-center justify-center border border-success/30 shrink-0">
                        <Icon name={pay.mode === "UPI"
                          ? "qr_code_2"
                          : pay.mode === "NEFT"
                            ? "account_balance"
                            : "payments"} size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-ink">
                            {pay.mode} Payment
                          </h4>
                          {/* Mode Badge (Requirement 5) */}
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-surface-raised text-ink border border-border">
                            {pay.mode}
                          </span>
                        </div>
                        {/* Date (Requirement 5) */}
                        <span className="text-xs text-ink-muted block mt-0.5">
                          Received on {pay.date}
                        </span>
                      </div>
                    </div>

                    {/* Amount (Requirement 5) */}
                    <div className="text-right">
                      <span className="text-lg font-bold text-success font-mono block">
                        +{formatINR(pay.amount)}
                      </span>
                      <span className="text-[11px] text-success font-medium">Reconciled</span>
                    </div>
                  </div>

                  {/* Payment Details Box (Requirement 5: Receipt ref, Applied invoice) */}
                  <div className="bg-surface-raised p-3.5 rounded-md border border-border text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Receipt Ref:</span>
                      <span className="font-mono text-primary font-bold">
                        {pay.referenceId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Internal Voucher:</span>
                      <span className="font-mono text-ink">{pay.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-ink-muted">Applied Towards:</span>
                      <span className="font-mono font-bold text-ink">
                        {pay.invoiceNumber} ({pay.orderNumber})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Summary Footer (Requirement 5) */}
            <div className="p-4 bg-surface-raised rounded-md border border-border flex items-center justify-between text-xs sm:text-sm font-semibold text-ink">
              <span>Total Payments Recorded:</span>
              <span className="font-mono font-bold text-success text-base">
                {formatINR(totalPaymentsAmount)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Policy & Direct Support Contact */}
      <div className="bg-surface rounded-2xl p-5 shadow-soft-sm border border-border space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon name="verified" size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink">Official Wholesale Accounts Policy</h4>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Wholesale payments to ARK Distributors are reconciled daily. Settlements via bank transfer (NEFT/RTGS), UPI, or cheque are reflected in your available credit within 24 hours of clearance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
