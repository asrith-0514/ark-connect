"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/context/AppContext";
import { DISTRIBUTOR_GSTIN, formatINR, downloadInvoicePDF } from "@/lib/mock";

// Helper for Indian numbering in words
function numberToWordsINR(num: number): string {
  if (!num || isNaN(num)) return "Zero rupees only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertTwoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
  }

  function convertThreeDigits(n: number): string {
    let str = "";
    if (Math.floor(n / 100) > 0) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      str += convertTwoDigits(n);
    }
    return str.trim();
  }

  const rounded = Math.round(num);
  let crore = Math.floor(rounded / 10000000);
  let rem = rounded % 10000000;
  let lakh = Math.floor(rem / 100000);
  rem %= 100000;
  let thousand = Math.floor(rem / 1000);
  rem %= 1000;
  let hundred = rem;

  let words = "";
  if (crore > 0) words += convertThreeDigits(crore) + " Crore ";
  if (lakh > 0) words += convertThreeDigits(lakh) + " Lakh ";
  if (thousand > 0) words += convertThreeDigits(thousand) + " Thousand ";
  if (hundred > 0) words += convertThreeDigits(hundred);

  return words.trim() + " Rupees Only";
}

export default function DistributorInvoiceModal() {
  const { viewingInvoice, setViewingInvoice, currentDate, issueInvoice } = useApp();

  const [discount, setDiscount] = useState(0);
  const [showIssueConfirm, setShowIssueConfirm] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issuedSuccess, setIssuedSuccess] = useState(false);

  if (!viewingInvoice) return null;

  const subtotal = viewingInvoice.subtotal;
  const taxableValue = Math.max(0, subtotal - discount);

  // Requirement 4: Distributor GSTIN state code must be 36 (Telangana).
  // Tax split: CGST+SGST for buyer state 36, IGST for 37.
  const buyerGstin = viewingInvoice.retailerGstin || "";
  const isIntraState = !buyerGstin || buyerGstin.startsWith("36");

  const cgst = isIntraState ? Math.round(taxableValue * 0.025 * 100) / 100 : 0;
  const sgst = isIntraState ? Math.round(taxableValue * 0.025 * 100) / 100 : 0;
  const igst = !isIntraState ? Math.round(taxableValue * 0.05 * 100) / 100 : 0;
  const totalTax = isIntraState ? cgst + sgst : igst;

  const rawTotal = taxableValue + totalTax;
  const grandTotal = Math.round(rawTotal * 100) / 100;
  const roundOff = Math.round((grandTotal - rawTotal) * 100) / 100;

  const totalBoxes = viewingInvoice.items.reduce((sum, item) => sum + (item.boxes || 0), 0);

  const handleIssueInvoice = () => {
    setIsIssuing(true);
    setTimeout(() => {
      setIsIssuing(false);
      setIssuedSuccess(true);
      issueInvoice(viewingInvoice.id || viewingInvoice.invoiceNumber);
      setTimeout(() => {
        setIssuedSuccess(false);
        setShowIssueConfirm(false);
        setViewingInvoice(null);
      }, 1200);
    }, 600);
  };

  const invoiceDate = viewingInvoice.date || viewingInvoice.billedDate || currentDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={e => {
        if (e.target === e.currentTarget && !showIssueConfirm) {
          setViewingInvoice(null);
        }
      }}
    >
      <div className="relative w-full max-w-5xl bg-surface rounded-t-xl sm:rounded-lg max-h-[95vh] flex flex-col shadow-soft-xl overflow-hidden border border-border text-ink">
        {/* Top Header Actions */}
        <div className="p-4 sm:p-6 bg-surface border-b border-border flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
              <Icon name="receipt_long" size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-ink font-mono num">
                  {viewingInvoice.invoiceNumber}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-surface-raised text-ink-muted border border-border">
                  {viewingInvoice.status}
                </span>
                <span className="text-xs text-primary font-mono num font-semibold">
                  #{viewingInvoice.orderNumber}
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                B2B Wholesale Tax Invoice • Secunderabad Central Depot
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => downloadInvoicePDF(viewingInvoice)}
              className="h-10 px-4 rounded-md bg-surface border border-border hover:bg-surface-raised text-ink font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-soft-sm transition-colors cursor-pointer"
            >
              <Icon name="download" size={18} className="text-primary" />
              <span>Download PDF</span>
            </button>

            {viewingInvoice.status === "Draft" ? (
              <button
                type="button"
                onClick={() => setShowIssueConfirm(true)}
                className="h-10 px-5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-sm flex items-center gap-2 shadow-soft-sm transition-all active:scale-98 cursor-pointer"
              >
                <Icon name="send" size={18} />
                <span>Issue Tax Invoice</span>
              </button>
            ) : (
              <span className="px-3 py-2 rounded-md bg-success/10 text-success border border-success/20 text-xs font-bold flex items-center gap-1">
                <Icon name="check_circle" size={16} />
                <span>Issued ({viewingInvoice.status})</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setViewingInvoice(null)}
              className="w-9 h-9 rounded-full bg-surface hover:bg-surface-raised text-ink-muted hover:text-ink flex items-center justify-center transition-colors border border-border cursor-pointer"
            >
              <Icon name="close" size={20} />
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Workspace */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-background/50">
          {/* Left Column: Authentic Paper Tax Invoice Preview (8 cols) */}
          <div className="lg:col-span-8 bg-surface rounded-lg shadow-soft-sm border border-border p-6 sm:p-8 space-y-6 relative overflow-hidden text-ink">
            {/* Top decorative stripe */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />

            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-border">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-base">
                    A
                  </span>
                  <span className="font-bold text-xl text-ink tracking-tight font-page-title">
                    ARK Distributors
                  </span>
                </div>
                <p className="text-xs text-ink-muted">
                  Secunderabad Central Garment Complex, Telangana - 500003
                </p>
                <p className="text-xs text-ink-muted font-mono num font-medium">
                  GSTIN: {DISTRIBUTOR_GSTIN} • State: Telangana (36)
                </p>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="px-3 py-1 rounded-sm bg-surface-raised border border-border text-xs font-bold uppercase tracking-wider text-ink">
                  Tax Invoice
                </span>
                <div className="text-xs font-mono num text-ink-muted pt-1 space-y-0.5">
                  <div>
                    Invoice No: <strong className="text-ink">{viewingInvoice.invoiceNumber}</strong>
                  </div>
                  <div>Invoice Date: {invoiceDate}</div>
                  <div>Due Date: {viewingInvoice.dueDate}</div>
                  <div className="text-primary font-semibold">
                    Order Ref: #{viewingInvoice.orderNumber}
                  </div>
                </div>
              </div>
            </div>

            {/* Billing & Supply Dispatch Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-md bg-surface-raised border border-border text-xs">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                  Billed to
                </span>
                <div className="font-bold text-ink text-sm">
                  {viewingInvoice.retailerName}
                </div>
                <div className="text-ink-muted">
                  {viewingInvoice.retailerTown}, {isIntraState ? "Telangana (36)" : "Andhra Pradesh (37)"}
                </div>
                <div className="font-mono num text-ink font-semibold pt-0.5">
                  GSTIN: {viewingInvoice.retailerGstin}
                </div>
              </div>

              <div className="space-y-1 sm:border-l sm:border-border sm:pl-4">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                  Supply &amp; Dispatch
                </span>
                <div className="text-ink">
                  Place of supply:{" "}
                  <strong className="text-ink font-semibold">
                    {isIntraState ? "Telangana (36) [Intra-state]" : "Andhra Pradesh (37) [Inter-state]"}
                  </strong>
                </div>
                <div className="text-ink pt-0.5">
                  Transport:{" "}
                  <strong className="text-ink font-semibold">
                    Navata Road Transport (NRT-77492-SDP)
                  </strong>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-raised text-ink-muted font-bold uppercase tracking-wider border-b border-border">
                    <th className="py-2.5 px-3">Item &amp; Description</th>
                    <th className="py-2.5 px-3">HSN</th>
                    <th className="py-2.5 px-3 text-right">Boxes</th>
                    <th className="py-2.5 px-3 text-right">Rate (excl. GST)</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {viewingInvoice.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-ink">{item.description}</div>
                        <div className="text-[11px] text-ink-muted">
                          {item.brand} • {item.variant}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono num text-ink-muted">{item.hsn}</td>
                      <td className="py-3 px-3 text-right font-mono num font-bold text-ink">
                        {item.boxes}
                      </td>
                      <td className="py-3 px-3 text-right font-mono num text-ink-muted">
                        {formatINR(item.rate)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono num font-bold text-ink">
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations and Words Block */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row justify-between items-start gap-4">
              <div className="space-y-1.5 max-w-xs">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  Invoice amount in words
                </span>
                <p className="text-xs text-ink font-medium bg-surface-raised p-2.5 rounded-md border border-border">
                  &ldquo;{numberToWordsINR(grandTotal)}&rdquo;
                </p>
                <span className="text-[11px] text-success flex items-center gap-1 font-semibold pt-1">
                  <Icon name="verified" size={15} />
                  Rates quoted are wholesale trade pack figures
                </span>
              </div>

              {/* Tally Box */}
              <div className="w-full sm:w-72 space-y-1.5 text-xs">
                <div className="flex justify-between text-ink-muted">
                  <span>Subtotal</span>
                  <span className="font-mono num font-bold text-ink">
                    {formatINR(subtotal)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-ink-muted">
                    <span>Discount</span>
                    <span className="font-mono num font-semibold text-danger">
                      −{formatINR(discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-ink font-semibold pt-1 border-t border-border">
                  <span>Taxable value</span>
                  <span className="font-mono num">{formatINR(taxableValue)}</span>
                </div>

                {isIntraState ? (
                  <>
                    <div className="flex justify-between text-ink-muted">
                      <span>CGST (2.5%)</span>
                      <span className="font-mono num">{formatINR(cgst)}</span>
                    </div>
                    <div className="flex justify-between text-ink-muted">
                      <span>SGST (2.5%)</span>
                      <span className="font-mono num">{formatINR(sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-ink-muted">
                    <span>IGST (5%)</span>
                    <span className="font-mono num">{formatINR(igst)}</span>
                  </div>
                )}

                {roundOff !== 0 && (
                  <div className="flex justify-between text-ink-muted text-[11px]">
                    <span>Round off</span>
                    <span className="font-mono num">
                      {roundOff > 0 ? `+${formatINR(roundOff)}` : formatINR(roundOff)}
                    </span>
                  </div>
                )}

                <div className="p-3 bg-surface-raised border border-border rounded-md flex justify-between items-baseline mt-2 shadow-soft-sm">
                  <span className="font-bold text-sm text-ink">Grand total</span>
                  <span className="font-mono num font-bold text-lg text-primary">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] text-ink-muted">
              <span>Computer-generated invoice. No physical signature required.</span>
              <span className="uppercase">ARK Distributors Wholesale Operations</span>
            </div>
          </div>

          {/* Right Column: Sticky Operational Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Source Order Card */}
            <div className="bg-surface rounded-lg p-5 shadow-soft-sm border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                  Source order
                </span>
                <span className="text-xs text-primary font-mono num font-bold">
                  #{viewingInvoice.orderNumber}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Billed: {totalBoxes} of {totalBoxes} boxes</span>
                  <span className="font-bold text-success font-mono num">100%</span>
                </div>
                <div className="w-full bg-surface-raised rounded-full h-2 overflow-hidden border border-border">
                  <div className="bg-success h-full rounded-full w-full" />
                </div>
              </div>
            </div>

            {/* Invoice Settings Configuration */}
            <div className="bg-surface rounded-lg p-5 shadow-soft-sm border border-border space-y-3">
              <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider block">
                Invoice settings
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-md bg-surface-raised border border-border">
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block">
                    Invoice Date
                  </span>
                  <span className="font-semibold text-ink font-mono num mt-0.5 block">{invoiceDate}</span>
                </div>
                <div className="p-2.5 rounded-md bg-surface-raised border border-border">
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block">
                    Credit Terms
                  </span>
                  <span className="font-semibold text-ink mt-0.5 block">30 days net</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink">Trade Discount (₹)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value) || 0)}
                  className="w-full mt-1 p-2.5 rounded-md bg-surface-raised border border-border text-xs font-mono num font-bold text-ink focus:bg-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-2.5 rounded-md bg-primary/10 text-[11px] text-primary border border-primary/20 flex items-center gap-1.5 font-semibold">
                <Icon name="account_tree" size={16} />
                <span>
                  {isIntraState
                    ? "GST type: CGST (2.5%) + SGST (2.5%) (Intra-state Telangana)"
                    : `GST type: IGST 5% (Interstate Distribution - State ${buyerGstin.slice(0, 2)})`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Issue Confirmation Modal */}
        {showIssueConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface rounded-lg p-6 max-w-sm w-full space-y-4 shadow-soft-xl border border-border text-center text-ink">
              <span className="w-12 h-12 rounded-full bg-primary/10 text-primary border border-primary/20 inline-flex items-center justify-center mx-auto">
                <Icon name="send" size={24} />
              </span>
              <h3 className="text-base font-bold text-ink">Issue Tax Invoice?</h3>
              <p className="text-xs text-ink-muted">
                This will officially finalize {viewingInvoice.invoiceNumber} for {formatINR(grandTotal)} and post it to the retailer&apos;s active ledger.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueConfirm(false)}
                  className="flex-1 h-10 rounded-md bg-surface-raised hover:bg-surface text-ink font-semibold text-xs border border-border cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleIssueInvoice}
                  disabled={isIssuing}
                  className="flex-1 h-10 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  {isIssuing ? "Issuing..." : "Confirm & Issue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
