"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { RETAILER_PROFILE, formatINR, getRetailerFinancials } from "@/lib/mock/retailer";

export default function ReviewOrderModal() {
  const {
    isReviewOrderOpen,
    setIsReviewOrderOpen,
    cartItems,
    cartTotalBoxes,
    cartTotalPieces,
    cartSubtotal,
    cartGst,
    cartGrandTotal,
    updateCartItemQty,
    removeCartItem,
    submitCurrentOrder,
    currentDate,
  } = useApp();

  const [notes, setNotes] = useState("");
  const [transporter, setTransporter] = useState(RETAILER_PROFILE.preferredTransporter);
  const [showConfirmSheet, setShowConfirmSheet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const financials = getRetailerFinancials(undefined, undefined, currentDate);

  if (!isReviewOrderOpen) return null;

  // Group cart items by brand
  const groupedByBrand = cartItems.reduce((acc, item) => {
    if (!acc[item.brand]) acc[item.brand] = [];
    acc[item.brand].push(item);
    return acc;
  }, {} as { [brand: string]: typeof cartItems });

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      submitCurrentOrder(transporter, notes);
      setIsSubmitting(false);
      setShowConfirmSheet(false);
    }, 700);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={e => {
        if (e.target === e.currentTarget && !showConfirmSheet) {
          setIsReviewOrderOpen(false);
        }
      }}
    >
      <div className="relative w-full max-w-3xl bg-[#f7f9fb] rounded-t-3xl sm:rounded-2xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0047d3] flex items-center justify-center border border-blue-100">
              <span className="material-symbols-outlined text-[24px]">shopping_cart_checkout</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Review Active PO Request
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {RETAILER_PROFILE.name} • {RETAILER_PROFILE.town}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReviewOrderOpen(false)}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {cartItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <span className="material-symbols-outlined text-[32px]">production_quantity_limits</span>
              </div>
              <h3 className="text-base font-bold text-slate-800">Your order is empty</h3>
              <p className="text-sm text-slate-500 mt-1">
                Browse our brand catalog and add wholesale box units.
              </p>
              <button
                onClick={() => setIsReviewOrderOpen(false)}
                className="mt-4 px-5 py-2.5 rounded-xl bg-[#0047d3] text-white font-semibold text-sm"
              >
                Continue Browsing
              </button>
            </div>
          ) : (
            <>
              {/* Brand Grouped Items */}
              {Object.entries(groupedByBrand).map(([brandName, items]) => {
                const brandTotal = items.reduce((s, i) => s + i.units * i.rate, 0);

                return (
                  <section key={brandName} className="space-y-3">
                    <div className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#0047d3] flex items-center justify-center font-bold">
                          <span className="material-symbols-outlined text-[22px]">inventory_2</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm sm:text-base">
                              {brandName}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-600 font-semibold">
                              {items.length} items
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">100% Factory Certified • Sourced from Tiruppur mills</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">
                          Brand Subtotal
                        </span>
                        <span className="text-sm sm:text-base font-bold text-[#0047d3] font-mono">
                          {formatINR(brandTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div
                          key={`${item.productId}_${item.color}_${item.size}_${idx}`}
                          className="p-3 sm:p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {(item.image || item.imageUrl) && (
                              <img
                                src={item.image || item.imageUrl}
                                alt={item.productTitle || item.productName || "Product"}
                                className="w-14 h-14 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-200"
                              />
                            )}
                            <div className="min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm truncate">
                                {item.productTitle || item.productName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                                <span className="font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                                  {item.color}
                                </span>
                                <span>•</span>
                                <span className="font-medium text-slate-700">{item.size}</span>
                                <span>•</span>
                                <span className="font-mono text-slate-600">
                                  {formatINR(item.rate)}/bx
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-right sm:mr-2">
                              <span className="text-sm font-bold text-slate-900 font-mono block">
                                {formatINR(item.units * item.rate)}
                              </span>
                              <span className="text-[11px] text-slate-400 font-mono">
                                {item.totalPieces} pcs
                              </span>
                            </div>

                            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 border border-slate-200">
                              <button
                                type="button"
                                onClick={() =>
                                  updateCartItemQty(item.productId, item.color, item.size, -1)
                                }
                                className="w-8 h-8 rounded bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors shadow-2xs"
                              >
                                -
                              </button>
                              <span className="w-12 text-center text-xs font-mono font-bold text-slate-900">
                                {item.units} bx
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCartItemQty(item.productId, item.color, item.size, 1)
                                }
                                className="w-8 h-8 rounded bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-colors shadow-2xs"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeCartItem(item.productId, item.color, item.size)}
                              className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                              title="Remove item"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* Logistics & Transporter selection */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#0047d3] text-[18px]">
                    local_shipping
                  </span>
                  Transporter / Lorry Service Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "Navata Road Transport", name: "Navata Road Transport", tag: "Fastest to Siddipet" },
                    { id: "VRL Logistics", name: "VRL Logistics", tag: "Direct Hub Delivery" },
                    { id: "ARC Transport", name: "ARC Transport", tag: "Heavy Consignment" },
                  ].map(t => (
                    <label
                      key={t.id}
                      onClick={() => setTransporter(t.name)}
                      className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                        transporter === t.name
                          ? "border-[#0047d3] bg-blue-50/50 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{t.name}</span>
                        {transporter === t.name && (
                          <span className="material-symbols-outlined text-[#0047d3] text-[16px]">
                            check_circle
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 mt-1">{t.tag}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-slate-400">
                      edit_note
                    </span>
                    Delivery Instructions / Special Packaging Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="E.g. Siddipet Market branch unload, wrap with waterproof tarpaulin..."
                    className="w-full mt-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#0047d3] transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Order Summary & Credit Health */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  PO Cost & Credit Verification
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total Master Boxes</span>
                    <span className="font-mono font-bold text-slate-900">{cartTotalBoxes} boxes</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Total Pieces Quantity</span>
                    <span className="font-mono font-bold text-slate-900">{cartTotalPieces} pieces</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Estimated Subtotal (Net)</span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatINR(cartSubtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Estimated 5% GST</span>
                    <span className="font-mono text-slate-700">{formatINR(cartGst)}</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 text-[11px] text-slate-500 border border-slate-200">
                    GST extra (5%), charged on tax invoice upon physical dispatch from Secunderabad central hub.
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-slate-900 text-base">Grand Estimated Total</span>
                      <span className="text-xs text-slate-400 block">Post-verification final bill</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-[#0047d3] font-mono">
                      {formatINR(cartGrandTotal)}
                    </span>
                  </div>
                </div>

                {/* Wholesaler Reassurance & Credit terms status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[#0047d3] text-[20px] shrink-0 mt-0.5">
                      info
                    </span>
                    <p className="text-xs text-slate-700 leading-snug">
                      <strong>Order request:</strong> Wholesaler reviews physical stock and confirms allocation before invoice generation.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0 mt-0.5">
                      verified
                    </span>
                    <div>
                      <span className="text-xs font-bold text-emerald-800 block">
                        Within wholesale credit terms
                      </span>
                      <span className="text-[11px] text-emerald-700 font-mono">
                        {formatINR(financials.availableCredit)} available of {formatINR(financials.creditLimit)} credit limit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Bottom Sticky CTA */}
        {cartItems.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex items-center justify-between gap-4 sticky bottom-0 z-20 shadow-lg">
            <div>
              <span className="text-xs text-slate-500 font-mono">
                {cartTotalBoxes} boxes • {cartItems.length} SKUs
              </span>
              <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono">
                {formatINR(cartGrandTotal)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsReviewOrderOpen(false)}
                className="px-4 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all"
              >
                Back to Catalog
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmSheet(true)}
                className="px-6 h-11 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 active:scale-98"
              >
                <span>Submit Purchase Order</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Nested Confirmation Slide-Up Sheet */}
        {showConfirmSheet && (
          <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
            <div className="w-full bg-white rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 space-y-4 animate-in slide-in-from-bottom duration-200">
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto -mt-2 mb-2" />

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0047d3] flex items-center justify-center border border-blue-200">
                    <span className="material-symbols-outlined text-[26px]">assignment_turned_in</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Submit PO Allocation Request?
                    </h3>
                    <p className="text-xs text-slate-500">
                      {RETAILER_PROFILE.dispatchHub}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowConfirmSheet(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs sm:text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Order Items:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {cartTotalBoxes} boxes ({cartItems.length} SKUs)
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Destination Store:</span>
                  <span className="font-semibold text-slate-900">
                    {RETAILER_PROFILE.name} ({RETAILER_PROFILE.town})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Preferred Transport:</span>
                  <span className="font-semibold text-[#0047d3]">{transporter}</span>
                </div>
                <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1.5 font-bold">
                  <span>Grand Total (est.):</span>
                  <span className="text-[#0047d3] font-mono text-base">
                    {formatINR(cartGrandTotal)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmSubmit}
                  className="w-full sm:flex-1 h-12 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] disabled:bg-blue-300 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-[20px]">
                        progress_activity
                      </span>
                      <span>Submitting PO...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">check</span>
                      <span>Confirm & Submit PO</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowConfirmSheet(false)}
                  className="w-full sm:w-auto px-5 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-all"
                >
                  Edit Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
