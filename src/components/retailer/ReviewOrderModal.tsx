"use client";

import React, { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { RETAILER_PROFILE, formatINR, getRetailerFinancials } from "@/lib/mock/retailer";
import { getRetailerString } from "@/lib/i18n/retailer";
import { ProductTile } from "./ProductTile";

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

  const { language } = useAuth();
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
      role="dialog"
      aria-modal="true"
      aria-label="Review Purchase Order"
      className="fixed inset-0 z-50 bg-background flex flex-col text-ink overflow-hidden animate-in fade-in duration-200"
    >
      {/* Full-Screen Top Header */}
      <div className="p-3.5 sm:p-4 bg-surface border-b border-border flex items-center justify-between sticky top-0 z-20 shadow-soft-sm">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsReviewOrderOpen(false)}
            className="min-h-[44px] min-w-[44px] rounded-md bg-background hover:bg-surface text-ink flex items-center justify-center transition-colors border border-border shadow-soft-sm cursor-pointer"
            aria-label="Back to Shop"
          >
            <Icon name="arrow_back" size={20} />
          </button>
          <div>
            <h2 className="text-sm sm:text-lg font-bold text-ink leading-tight flex items-center gap-2">
              <Icon name="shopping_cart" size={20} className="text-primary" />
              <span>Wholesale Cart &amp; Order Review</span>
            </h2>
            <p className="text-[11px] text-ink-muted font-mono num">
              {RETAILER_PROFILE.name} • {RETAILER_PROFILE.town}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsReviewOrderOpen(false)}
          className="min-h-[44px] px-3 rounded-md bg-background hover:bg-surface text-ink-muted hover:text-ink text-xs font-semibold flex items-center gap-1 transition-colors border border-border shadow-soft-sm cursor-pointer"
        >
          <Icon name="close" size={18} />
          <span className="hidden sm:inline">Close</span>
        </button>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full">
        {cartItems.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-lg border border-border shadow-soft-sm my-8">
            <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center mx-auto mb-3 text-ink-muted">
              <Icon name="production_quantity_limits" size={32} />
            </div>
            <h3 className="text-base font-bold text-ink">{getRetailerString(language, "cartEmpty")}</h3>
            <p className="text-xs text-ink-muted mt-1">
              Browse our wholesale catalog and select boxes to create your PO.
            </p>
            <button
              onClick={() => setIsReviewOrderOpen(false)}
              className="mt-4 px-5 min-h-[44px] rounded-md bg-primary text-primary-foreground font-semibold text-xs shadow-soft-sm hover:bg-primary/90 cursor-pointer"
            >
              {getRetailerString(language, "startShopping")}
            </button>
          </div>
        ) : (
            <>
              {/* Brand Grouped Items */}
              {Object.entries(groupedByBrand).map(([brandName, items]) => {
                const brandTotal = items.reduce((s, i) => s + i.units * i.rate, 0);

                return (
                  <section key={brandName} className="space-y-3">
                    <div className="p-3 sm:p-4 rounded-md bg-surface border border-border shadow-soft-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold border border-primary/20">
                          <Icon name="inventory_2" size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-ink text-sm sm:text-base">
                              {brandName}
                            </span>
                            <span className="px-2 py-0.5 text-xs rounded-sm bg-surface-raised text-ink-muted font-semibold border border-border">
                              {items.length} items
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted">100% Factory Certified • Sourced from Tiruppur mills</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] uppercase tracking-wider text-ink-muted block font-semibold">
                          Brand Subtotal
                        </span>
                        <span className="text-sm sm:text-base font-bold text-primary font-mono num">
                          {formatINR(brandTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div
                          key={`${item.productId}_${item.color}_${item.size}_${idx}`}
                          className="p-3 sm:p-4 rounded-md bg-surface border border-border shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border">
                              <ProductTile
                                productId={item.productId}
                                brand={(item as any).brand || brandName}
                                category=""
                                title={item.productTitle || item.productName || "Product"}
                                aspectRatio="aspect-square"
                              />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-semibold text-ink text-sm truncate">
                                {item.productTitle || item.productName}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-ink-muted">
                                <span className="font-medium text-ink bg-surface-raised px-2 py-0.5 rounded-sm border border-border">
                                  {item.color}
                                </span>
                                <span>•</span>
                                <span className="font-medium text-ink">{item.size}</span>
                                <span>•</span>
                                <span className="font-mono num text-ink-muted">
                                  {formatINR(item.rate)}/bx
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                            <div className="text-right sm:mr-2">
                              <span className="text-sm font-bold text-ink font-mono num block">
                                {formatINR(item.units * item.rate)}
                              </span>
                              <span className="text-[11px] text-ink-muted font-mono num">
                                {item.totalPieces} pcs
                              </span>
                            </div>

                            <div className="flex items-center gap-1 bg-surface-raised rounded-sm p-1 border border-border">
                              <button
                                type="button"
                                onClick={() =>
                                  updateCartItemQty(item.productId, item.color, item.size, -1)
                                }
                                className="w-8 h-8 rounded-sm bg-surface hover:bg-surface-raised text-ink font-bold flex items-center justify-center transition-colors shadow-soft-sm cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-12 text-center text-xs font-mono num font-bold text-ink">
                                {item.units} bx
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  updateCartItemQty(item.productId, item.color, item.size, 1)
                                }
                                className="w-8 h-8 rounded-sm bg-surface hover:bg-surface-raised text-ink font-bold flex items-center justify-center transition-colors shadow-soft-sm cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeCartItem(item.productId, item.color, item.size)}
                              className="w-8 h-8 rounded-sm text-ink-muted hover:text-danger hover:bg-danger/10 flex items-center justify-center transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Icon name="delete" size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* Logistics & Transporter selection */}
              <div className="p-4 rounded-md bg-surface border border-border shadow-soft-sm space-y-3">
                <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                  <Icon name="local_shipping" size={18} className="text-primary" />
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
                      className={`p-3 rounded-md border cursor-pointer flex flex-col justify-between transition-all ${
                        transporter === t.name
                          ? "border-primary bg-primary/10 shadow-soft-sm"
                          : "border-border bg-surface hover:bg-surface-raised"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-ink">{t.name}</span>
                        {transporter === t.name && (
                          <Icon name="check_circle" size={16} className="text-primary" />
                        )}
                      </div>
                      <span className="text-[11px] text-ink-muted mt-1">{t.tag}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-xs font-semibold text-ink flex items-center gap-1">
                    <Icon name="edit_note" size={16} className="text-ink-muted" />
                    Delivery Instructions / Special Packaging Notes
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="E.g. Siddipet Market branch unload, wrap with waterproof tarpaulin..."
                    className="w-full mt-1.5 p-3 rounded-md bg-surface-raised border border-border text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:bg-surface focus:outline-none focus:border-primary transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Order Summary & Credit Health */}
              <div className="p-4 sm:p-5 rounded-lg bg-surface border border-border shadow-soft-sm space-y-4">
                <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                  PO Cost & Credit Verification
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>Total Master Boxes</span>
                    <span className="font-mono num font-bold text-ink">{cartTotalBoxes} boxes</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>Total Pieces Quantity</span>
                    <span className="font-mono num font-bold text-ink">{cartTotalPieces} pieces</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>Estimated Subtotal (Net)</span>
                    <span className="font-mono num font-bold text-ink">
                      {formatINR(cartSubtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>Estimated 5% GST</span>
                    <span className="font-mono num text-ink">{formatINR(cartGst)}</span>
                  </div>

                  <div className="p-2.5 rounded-sm bg-surface-raised text-[11px] text-ink-muted border border-border">
                    GST extra (5%), charged on tax invoice upon physical dispatch from Secunderabad central hub.
                  </div>

                  <div className="pt-2 border-t border-border flex items-baseline justify-between">
                    <div>
                      <span className="font-bold text-ink text-base">Grand Estimated Total</span>
                      <span className="text-xs text-ink-muted block">Post-verification final bill</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-bold text-primary font-mono num">
                      {formatINR(cartGrandTotal)}
                    </span>
                  </div>
                </div>

                {/* Wholesaler Reassurance & Credit terms status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-md bg-primary/10 border border-primary/20 flex items-start gap-2.5">
                    <Icon name="info" size={20} className="text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-ink leading-snug">
                      <strong>Order request:</strong> Wholesaler reviews physical stock and confirms allocation before invoice generation.
                    </p>
                  </div>

                  <div className="p-3 rounded-md bg-success/10 border border-success/20 flex items-start gap-2.5">
                    <Icon name="verified" size={20} className="text-success shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-success block">
                        Within wholesale credit terms
                      </span>
                      <span className="text-[11px] text-success/90 font-mono num">
                        {formatINR(financials.availableCredit)} available of {formatINR(financials.creditLimit)} credit limit
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
      </div>

      {/* Full-Screen Bottom Sticky CTA Bar */}
      {cartItems.length > 0 && (
        <div className="p-3 sm:p-4 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-between gap-3 sticky bottom-0 z-20 shadow-soft-xl">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-3">
            <div>
              <span className="text-[11px] sm:text-xs text-ink-muted font-mono num block">
                {cartTotalBoxes} boxes • {cartItems.length} SKUs
              </span>
              <div className="text-base sm:text-xl font-bold text-primary font-mono num">
                {formatINR(cartGrandTotal)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReviewOrderOpen(false)}
                className="hidden sm:flex px-4 min-h-[48px] rounded-md bg-background hover:bg-surface text-ink text-xs sm:text-sm font-semibold transition-all border border-border cursor-pointer items-center justify-center"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmSheet(true)}
                className="px-5 sm:px-6 min-h-[48px] rounded-md bg-primary hover:bg-primary/90 active:scale-98 text-primary-foreground font-bold text-xs sm:text-sm shadow-soft-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Submit Purchase Order</span>
                <Icon name="arrow_forward" size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Slide-Up Bottom Sheet */}
      {showConfirmSheet && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex flex-col justify-end animate-in fade-in">
          <div className="w-full max-w-lg mx-auto bg-surface rounded-t-2xl p-5 sm:p-6 shadow-soft-xl border-t border-border space-y-4 animate-in slide-in-from-bottom duration-200 text-ink">
            <div className="w-12 h-1 bg-border rounded-full mx-auto -mt-2 mb-2" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-md bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <Icon name="assignment_turned_in" size={26} />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-ink">
                    Submit PO Allocation Request?
                  </h3>
                  <p className="text-xs text-ink-muted">
                    {RETAILER_PROFILE.dispatchHub}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConfirmSheet(false)}
                className="w-8 h-8 rounded-full bg-background hover:bg-surface-raised text-ink-muted hover:text-ink flex items-center justify-center border border-border cursor-pointer"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="p-3.5 rounded-md bg-background border border-border space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between text-ink-muted">
                <span>Order Items:</span>
                <span className="font-bold text-ink font-mono num">
                  {cartTotalBoxes} boxes ({cartItems.length} SKUs)
                </span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Destination Store:</span>
                <span className="font-semibold text-ink">
                  {RETAILER_PROFILE.name} ({RETAILER_PROFILE.town})
                </span>
              </div>
              <div className="flex justify-between text-ink-muted">
                <span>Preferred Transport:</span>
                <span className="font-semibold text-primary">{transporter}</span>
              </div>
              <div className="flex justify-between text-ink-muted border-t border-border pt-1.5 font-bold">
                <span>Grand Total (est.):</span>
                <span className="text-primary font-mono num text-base">
                  {formatINR(cartGrandTotal)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmSubmit}
                className="w-full sm:flex-1 min-h-[48px] rounded-md bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-xs sm:text-sm shadow-soft-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Icon name="progress_activity" size={20} className="animate-spin" />
                    <span>Submitting PO...</span>
                  </>
                ) : (
                  <>
                    <Icon name="check" size={20} />
                    <span>Confirm & Submit PO</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmSheet(false)}
                className="w-full sm:w-auto px-5 min-h-[48px] rounded-md bg-background hover:bg-surface text-ink text-xs sm:text-sm font-semibold transition-all border border-border cursor-pointer"
              >
                Edit Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
