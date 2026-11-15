"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { RETAILER_PROFILE, formatINR, getCurrentDate } from "@/lib/mock/retailer";

export default function OrderSubmittedModal() {
  const {
    isOrderSuccessOpen,
    setIsOrderSuccessOpen,
    lastSubmittedOrder,
    setRetailerNav,
  } = useApp();

  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);

  if (!isOrderSuccessOpen || !lastSubmittedOrder) return null;

  const orderNum = lastSubmittedOrder.orderNumber;
  const grandTotal = lastSubmittedOrder.grandTotal;
  const boxes = lastSubmittedOrder.totalBoxes;
  const itemsCount = lastSubmittedOrder.items.length;

  const waText = encodeURIComponent(
    `Order #${orderNum} Submitted by ${RETAILER_PROFILE.name}, ${RETAILER_PROFILE.town} - ${boxes} boxes (Estimated Total: ${formatINR(grandTotal)})`
  );

  const handleDownloadPdf = () => {
    setPdfGenerating(true);
    setTimeout(() => {
      setPdfGenerating(false);
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 2500);
    }, 1000);
  };

  const handleViewOrders = () => {
    setIsOrderSuccessOpen(false);
    setRetailerNav("orders");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) setIsOrderSuccessOpen(false);
      }}
    >
      <div className="relative w-full max-w-lg bg-surface rounded-t-xl sm:rounded-lg max-h-[92vh] flex flex-col shadow-soft-xl overflow-hidden border border-border text-ink">
        {/* Top Close button */}
        <div className="p-4 flex justify-end bg-surface border-b border-border">
          <button
            onClick={() => setIsOrderSuccessOpen(false)}
            className="w-8 h-8 rounded-full bg-surface-raised hover:bg-surface text-ink-muted hover:text-ink flex items-center justify-center transition-colors border border-border cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-background/50">
          {/* 1. Calm Success Moment */}
          <div className="flex flex-col items-center text-center pt-1">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute w-20 h-20 rounded-full bg-primary/20 animate-ping opacity-60" />
              <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-soft-md text-primary-foreground">
                <span className="material-symbols-outlined text-[34px]">check</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-ink tracking-tight">Order sent</h1>
            <p className="text-sm text-ink-muted max-w-xs mt-1">
              ARK Distributors will review physical stock and confirm proforma allocation shortly.
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-raised text-ink text-xs font-semibold border border-border">
              <span className="material-symbols-outlined text-[16px] text-primary">store</span>
              <span>{RETAILER_PROFILE.name} • {RETAILER_PROFILE.town}</span>
            </div>
          </div>

          {/* 2. Order Summary Card */}
          <div className="rounded-lg bg-surface p-4 sm:p-5 shadow-soft-sm border border-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
                  Order Reference
                </span>
                <span className="text-xl font-bold text-ink font-mono num">
                  #{orderNum}
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span>Submitted</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-ink-muted text-xs pb-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>
                {lastSubmittedOrder.date}, {getCurrentDate().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 rounded-md bg-surface-raised border border-border flex flex-col">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  Volume
                </span>
                <span className="text-base font-bold text-ink font-mono num mt-0.5">
                  {boxes} boxes
                </span>
              </div>
              <div className="p-3 rounded-md bg-surface-raised border border-border flex flex-col">
                <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider">
                  Variety
                </span>
                <span className="text-base font-bold text-ink font-mono num mt-0.5">
                  {itemsCount} items
                </span>
              </div>
            </div>

            {/* Total Section */}
            <div className="p-3.5 bg-surface-raised rounded-md border border-border space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-ink-muted">
                  Estimated total (before GST)
                </span>
                <span className="text-lg font-bold text-ink font-mono num">
                  {formatINR(lastSubmittedOrder.subtotal)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-ink-muted">
                <span className="material-symbols-outlined text-[14px] text-warning">info</span>
                <span>GST extra (5%), charged on tax invoice upon physical dispatch.</span>
              </div>
            </div>
          </div>

          {/* 3. What Happens Next (4-step mini-timeline) */}
          <div className="rounded-lg bg-surface p-4 sm:p-5 shadow-soft-sm border border-border space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink">What happens next</h3>
              <span className="text-xs text-ink-muted">4-step dispatch flow</span>
            </div>

            <div className="space-y-4 pl-1 pt-1">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">done</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">Submitted</span>
                    <span className="text-[10px] font-semibold text-success bg-success/10 px-1.5 py-0.2 rounded-sm border border-success/20">
                      Completed
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Order received at Secunderabad central hub
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-soft-sm">
                  <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary">Under review</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/15 px-1.5 py-0.2 rounded-sm uppercase border border-primary/25">
                      Now
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Wholesaler checks physical shelf stock & allocates boxes
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-surface-raised text-ink-muted flex items-center justify-center shrink-0 mt-0.5 border border-border">
                  <span className="w-2 h-2 rounded-full bg-border" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-ink">Approved (you confirm)</span>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Review final proforma & approve dispatch release
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-surface-raised text-ink-muted flex items-center justify-center shrink-0 mt-0.5 border border-border">
                  <span className="w-2 h-2 rounded-full bg-border" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-ink">Dispatched</span>
                  <p className="text-[11px] text-ink-muted mt-0.5">
                    Lorry transport L/R receipt details shared for pickup
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* WhatsApp Share Button */}
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-md bg-[#25D366] hover:bg-[#1ebd59] text-white flex items-center justify-center gap-2 font-bold text-sm shadow-soft-sm transition-all active:scale-98 cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              <span>Share Proforma on WhatsApp</span>
            </a>

            {/* Download PDF button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="w-full h-11 rounded-md bg-surface hover:bg-surface-raised text-ink font-semibold text-sm border border-border shadow-soft-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {pdfGenerating ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin text-primary">
                    sync
                  </span>
                  <span>Generating Proforma PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <span className="material-symbols-outlined text-[18px] text-success">
                    check_circle
                  </span>
                  <span className="text-success font-semibold">Proforma PDF Saved</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] text-ink-muted">
                    description
                  </span>
                  <span>Download Proforma (PDF)</span>
                </>
              )}
            </button>

            {/* View my orders */}
            <button
              type="button"
              onClick={handleViewOrders}
              className="w-full h-11 text-center text-sm font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
            >
              View in My Orders →
            </button>
          </div>

          {/* 5. Dispatch Support Desk */}
          <div className="p-3.5 rounded-lg bg-surface-raised border border-border flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-surface flex items-center justify-center text-success shrink-0 shadow-soft-sm border border-border">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div>
                <span className="font-bold text-ink block">Need a change in quantities?</span>
                <span className="text-ink-muted text-[11px]">Message the Secunderabad dispatch desk</span>
              </div>
            </div>
            <a
              href={`https://wa.me/919440123456?text=Query%20regarding%20order%20%23${orderNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-sm bg-surface border border-border text-ink font-bold hover:bg-surface-raised transition-colors flex items-center gap-1 shadow-soft-sm shrink-0"
            >
              <span className="material-symbols-outlined text-[16px] text-[#25D366]">chat</span>
              <span>Desk</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

