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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) setIsOrderSuccessOpen(false);
      }}
    >
      <div className="relative w-full max-w-lg bg-[#f7f9fb] rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Top Close button */}
        <div className="p-4 flex justify-end bg-white border-b border-slate-100">
          <button
            onClick={() => setIsOrderSuccessOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* 1. Calm Success Moment */}
          <div className="flex flex-col items-center text-center pt-1">
            <div className="relative flex items-center justify-center mb-4">
              <div className="absolute w-20 h-20 rounded-full bg-blue-100 animate-ping opacity-60" />
              <div className="relative w-16 h-16 rounded-full bg-[#0047d3] flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
                <span className="material-symbols-outlined text-[34px]">check</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Order sent</h1>
            <p className="text-sm text-slate-500 max-w-xs mt-1">
              ARK Distributors will review physical stock and confirm proforma allocation shortly.
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/80 text-slate-800 text-xs font-semibold">
              <span className="material-symbols-outlined text-[16px] text-[#0047d3]">store</span>
              <span>{RETAILER_PROFILE.name} • {RETAILER_PROFILE.town}</span>
            </div>
          </div>

          {/* 2. Order Summary Card */}
          <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Order Reference
                </span>
                <span className="text-xl font-bold text-slate-900 font-mono">
                  #{orderNum}
                </span>
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-50 text-[#0047d3] border border-blue-200 flex items-center gap-1.5 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-[#0047d3] animate-pulse" />
                <span>Submitted</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-500 text-xs pb-1">
              <span className="material-symbols-outlined text-[16px]">schedule</span>
              <span>
                {lastSubmittedOrder.date}, {getCurrentDate().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Volume
                </span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {boxes} boxes
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Variety
                </span>
                <span className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {itemsCount} items
                </span>
              </div>
            </div>

            {/* Total Section */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-medium text-slate-600">
                  Estimated total (before GST)
                </span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {formatINR(lastSubmittedOrder.subtotal)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="material-symbols-outlined text-[14px] text-amber-600">info</span>
                <span>GST extra (5%), charged on tax invoice upon physical dispatch.</span>
              </div>
            </div>
          </div>

          {/* 3. What Happens Next (4-step mini-timeline) */}
          <div className="rounded-2xl bg-white p-4 sm:p-5 shadow-sm border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">What happens next</h3>
              <span className="text-xs text-slate-400">4-step dispatch flow</span>
            </div>

            <div className="space-y-4 pl-1 pt-1">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">done</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Submitted</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      Completed
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Order received at Secunderabad central hub
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#0047d3] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-blue-500/20">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0047d3]">Under review</span>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.2 rounded uppercase">
                      Now
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Wholesaler checks physical shelf stock & allocates boxes
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-700">Approved (you confirm)</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Review final proforma & approve dispatch release
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-700">Dispatched</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
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
              className="w-full h-12 rounded-xl bg-[#25D366] hover:bg-[#1ebd59] text-white flex items-center justify-center gap-2 font-bold text-sm shadow-md transition-all active:scale-98"
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
              className="w-full h-11 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition-all"
            >
              {pdfGenerating ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin text-[#0047d3]">
                    sync
                  </span>
                  <span>Generating Proforma PDF...</span>
                </>
              ) : pdfDownloaded ? (
                <>
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">
                    check_circle
                  </span>
                  <span className="text-emerald-700">Proforma PDF Saved</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
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
              className="w-full h-11 text-center text-sm font-bold text-[#0047d3] hover:text-blue-700 transition-colors"
            >
              View in My Orders →
            </button>
          </div>

          {/* 5. Dispatch Support Desk */}
          <div className="p-3.5 rounded-2xl bg-slate-200/60 border border-slate-300 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                <span className="material-symbols-outlined text-[20px]">support_agent</span>
              </div>
              <div>
                <span className="font-bold text-slate-900 block">Need a change in quantities?</span>
                <span className="text-slate-500 text-[11px]">Message the Secunderabad dispatch desk</span>
              </div>
            </div>
            <a
              href={`https://wa.me/919440123456?text=Query%20regarding%20order%20%23${orderNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs shrink-0"
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

