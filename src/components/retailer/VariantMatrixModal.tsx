"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { OrderItem } from "@/data/mockData";
import { formatINR } from "@/lib/mock/retailer";
import { useEntityImages } from "@/lib/storage/imageStore";

function MatrixProductImage({ product }: { product: { id: string; title: string; image: string } }) {
  const { primaryUrl } = useEntityImages("style", product.id);
  return (
    <img
      src={primaryUrl || product.image}
      alt={product.title}
      className="w-full h-full object-cover"
    />
  );
}

export default function VariantMatrixModal() {
  const { matrixProduct, closeMatrixModal, addToCart } = useApp();

  const availableFits = useMemo(() => {
    if (!matrixProduct) return [];
    return matrixProduct.availableFits && matrixProduct.availableFits.length > 0
      ? matrixProduct.availableFits
      : [];
  }, [matrixProduct]);

  const [selectedFit, setSelectedFit] = useState<string>("");

  useEffect(() => {
    if (availableFits.length > 0) {
      setSelectedFit(availableFits[0]);
    } else {
      setSelectedFit("");
    }
  }, [availableFits]);

  const sizes = useMemo(() => {
    if (!matrixProduct) return [];
    if (matrixProduct.sizes && matrixProduct.sizes.length > 0) {
      return matrixProduct.sizes;
    }
    return ["Free Size"];
  }, [matrixProduct]);

  const shades = useMemo(() => {
    if (!matrixProduct) return [];
    if (matrixProduct.shades && matrixProduct.shades.length > 0) {
      return matrixProduct.shades;
    }
    return [{ name: "Assorted", hex: "#475569", code: "AST" }];
  }, [matrixProduct]);

  // Matrix quantities: { [fit_shadeIdx_sizeIdx]: number }
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  // Reset or preset whenever a product is opened
  useEffect(() => {
    if (matrixProduct) {
      const initial: { [key: string]: number } = {};
      const fitKey = availableFits.length > 0 ? availableFits[0] : "std";
      if (!matrixProduct.pricePending) {
        shades.slice(0, 3).forEach((_, shadeIdx) => {
          sizes.slice(0, 3).forEach((_, sizeIdx) => {
            initial[`${fitKey}_${shadeIdx}_${sizeIdx}`] = 2;
          });
        });
      }
      setQuantities(initial);
    }
  }, [matrixProduct, shades, sizes, availableFits]);

  if (!matrixProduct) return null;

  const ratePerBox = matrixProduct.pricePerUnit || 0;
  const piecesPerBox = matrixProduct.piecesPerUnit || 10;
  const isPending = matrixProduct.pricePending === true;
  const currentFit = selectedFit || (availableFits.length > 0 ? availableFits[0] : "std");

  const getKey = (shadeIdx: number, sizeIdx: number, fit: string = currentFit) => {
    return `${fit}_${shadeIdx}_${sizeIdx}`;
  };

  const getVal = (shadeIdx: number, sizeIdx: number) => {
    return quantities[getKey(shadeIdx, sizeIdx)] || 0;
  };

  const setVal = (shadeIdx: number, sizeIdx: number, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [getKey(shadeIdx, sizeIdx)]: Math.max(0, val),
    }));
  };

  const increment = (shadeIdx: number, sizeIdx: number) => {
    setVal(shadeIdx, sizeIdx, getVal(shadeIdx, sizeIdx) + 1);
  };

  const decrement = (shadeIdx: number, sizeIdx: number) => {
    setVal(shadeIdx, sizeIdx, Math.max(0, getVal(shadeIdx, sizeIdx) - 1));
  };

  const handleInputChange = (shadeIdx: number, sizeIdx: number, text: string) => {
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
    setVal(shadeIdx, sizeIdx, num);
  };

  const fillEvenBoxes = (delta: number) => {
    setQuantities(prev => {
      const updated = { ...prev };
      shades.forEach((_, shadeIdx) => {
        sizes.forEach((_, sizeIdx) => {
          const k = getKey(shadeIdx, sizeIdx);
          updated[k] = (updated[k] || 0) + delta;
        });
      });
      return updated;
    });
  };

  const resetMatrix = () => {
    const cleared: { [key: string]: number } = {};
    shades.forEach((_, shadeIdx) => {
      sizes.forEach((_, sizeIdx) => {
        cleared[getKey(shadeIdx, sizeIdx)] = 0;
      });
    });
    setQuantities(cleared);
  };

  // Total boxes across all fits and variants
  let grandTotalBoxes = 0;
  Object.values(quantities).forEach(v => {
    grandTotalBoxes += v;
  });

  const totalPieces = grandTotalBoxes * piecesPerBox;
  const subtotalAmount = isPending ? 0 : grandTotalBoxes * ratePerBox;
  const masterCartons = (grandTotalBoxes / 60).toFixed(1);

  const handleCommit = () => {
    if (isPending) return;
    const itemsToAdd: OrderItem[] = [];

    const fitList = availableFits.length > 0 ? availableFits : ["std"];
    fitList.forEach(fit => {
      shades.forEach((shade, shadeIdx) => {
        sizes.forEach((size, sizeIdx) => {
          const qty = quantities[`${fit}_${shadeIdx}_${sizeIdx}`] || 0;
          if (qty > 0) {
            const fitLabel = fit !== "std" ? ` (${fit} Fit)` : "";
            itemsToAdd.push({
              productId: matrixProduct.id,
              productTitle: `${matrixProduct.title}${fitLabel}`,
              brand: matrixProduct.brand,
              artNumber: matrixProduct.artNumber,
              image: matrixProduct.image,
              color: shade.name,
              colorHex: shade.hex || "#475569",
              size: `${size}${fitLabel}`,
              units: qty,
              rate: ratePerBox,
              totalPieces: qty * piecesPerBox,
            });
          }
        });
      });
    });

    if (itemsToAdd.length > 0) {
      addToCart(itemsToAdd);
    }
    closeMatrixModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/50 backdrop-blur-sm transition-opacity duration-300 p-0 sm:p-4 animate-in fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) closeMatrixModal();
      }}
    >
      <div className="relative w-full max-w-4xl bg-surface rounded-t-2xl sm:rounded-2xl h-[94vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-soft-xl overflow-hidden border border-border text-ink">
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden bg-surface-raised/40">
          <div className="w-12 h-1.5 bg-border rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-6 flex items-start justify-between bg-surface-raised/30 border-b border-border">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden bg-surface-raised shrink-0 border border-border shadow-soft-sm">
              <MatrixProductImage product={matrixProduct} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-sm font-bold uppercase tracking-wider">
                  {matrixProduct.brand}
                </span>
                <span className="text-xs text-ink-muted font-mono num">
                  Art #{matrixProduct.artNumber}
                </span>
                <span className="bg-surface-raised text-ink-muted text-xs px-2 py-0.5 rounded-sm font-semibold border border-border">
                  {matrixProduct.category}
                </span>
                {isPending ? (
                  <span className="bg-warning/10 text-warning border border-warning/20 text-xs px-2.5 py-0.5 rounded-sm font-bold uppercase">
                    Price Pending
                  </span>
                ) : (
                  <span className="bg-success/10 text-success text-xs px-2.5 py-0.5 rounded-sm font-semibold flex items-center gap-1 border border-success/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    {matrixProduct.stockStatus}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-ink mt-1">
                {matrixProduct.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-ink-muted text-xs sm:text-sm mt-0.5">
                <span>Box Packed ({piecesPerBox} pcs/box)</span>
                <span className="text-border">•</span>
                <span>{matrixProduct.description}</span>
                <span className="text-border">•</span>
                {isPending ? (
                  <span className="text-warning font-semibold">
                    Distributor rate card pending confirmation
                  </span>
                ) : (
                  <span>
                    Net Price:{" "}
                    <strong className="text-primary font-bold num">
                      {formatINR(ratePerBox)}/box
                    </strong>{" "}
                    <span className="num">({formatINR(ratePerBox / piecesPerBox)}/pc)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={closeMatrixModal}
            className="w-9 h-9 rounded-full bg-surface hover:bg-surface-raised text-ink-muted hover:text-ink flex items-center justify-center transition-colors border border-border shadow-soft-sm cursor-pointer"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Fit Switcher for Bras with multiple cup fits */}
        {availableFits.length > 0 && (
          <div className="px-4 sm:px-6 py-2.5 bg-surface-raised/60 border-b border-border flex items-center gap-3">
            <span className="text-xs font-bold text-ink uppercase tracking-wider shrink-0">
              Select Cup Fit:
            </span>
            <div className="flex items-center gap-2">
              {availableFits.map(fit => (
                <button
                  key={fit}
                  type="button"
                  onClick={() => setSelectedFit(fit)}
                  className={`px-3 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer border ${
                    currentFit === fit
                      ? "bg-primary text-primary-foreground border-primary shadow-soft-xs"
                      : "bg-surface hover:bg-surface-raised text-ink border-border"
                  }`}
                >
                  {fit} Fit Cup
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Available Color Swatches Preview */}
        <div className="px-4 sm:px-6 py-2.5 bg-surface border-b border-border flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider shrink-0">
            Shades &amp; Packs:
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {shades.map((s, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-surface-raised border border-border px-2.5 py-1 rounded-sm text-xs font-medium text-ink"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-border"
                  style={{ backgroundColor: s.hex || "#475569" }}
                />
                <span>{s.name}</span>
                {s.code && <span className="text-[10px] text-ink-muted font-mono">({s.code})</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Price Pending Alert Banner if not priced */}
        {isPending && (
          <div className="px-4 sm:px-6 py-3 bg-warning/10 border-b border-warning/20 flex items-center gap-2.5 text-xs text-warning">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>
              <strong>Price Pending:</strong> Mill rate card confirmation in progress. You can preview sizes and shade assortments, but orders cannot be placed until distributor sets the wholesale price.
            </span>
          </div>
        )}

        {/* Variant Matrix Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-background/50">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink text-sm sm:text-base">
                {matrixProduct.category === "Bras" ? "Band Size × Colour Matrix" : "Size × Colour Matrix"}
              </span>
              <span className="text-ink-muted text-xs">
                (Units in boxes of {piecesPerBox} pcs)
              </span>
            </div>
            {!isPending && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fillEvenBoxes(2)}
                  className="px-3 py-1 bg-surface hover:bg-primary/10 border border-border hover:border-primary/30 rounded-sm text-xs text-primary font-bold transition-all shadow-soft-sm cursor-pointer"
                >
                  +2 All Sizes
                </button>
                <button
                  type="button"
                  onClick={resetMatrix}
                  className="px-3 py-1 bg-surface hover:bg-danger/10 border border-border hover:border-danger/30 rounded-sm text-xs text-danger font-bold transition-all shadow-soft-sm cursor-pointer"
                >
                  Reset
                </button>
              </div>
            )}
          </div>

          {/* Matrix Table */}
          <div className="bg-surface rounded-md shadow-soft-sm border border-border overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-surface-raised/70 text-ink-muted text-xs uppercase border-b border-border">
                  <th className="py-3 px-4 font-bold">Colour / Shade</th>
                  {sizes.map((s, idx) => (
                    <th key={idx} className="py-3 px-2 text-center font-bold">
                      <div>{s}</div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {shades.map((shade, shadeIdx) => {
                  let rowBoxes = 0;
                  sizes.forEach((_, sizeIdx) => {
                    rowBoxes += getVal(shadeIdx, sizeIdx);
                  });
                  const rowAmount = rowBoxes * ratePerBox;

                  return (
                    <tr key={shadeIdx} className="hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded-full shrink-0 border border-border"
                            style={{ backgroundColor: shade.hex || "#475569" }}
                          />
                          <div className="flex flex-col">
                            <span className="font-semibold text-ink text-xs sm:text-sm">
                              {shade.name}
                            </span>
                            {shade.code && (
                              <span className="text-[10px] text-ink-muted font-mono">
                                Code: {shade.code}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {sizes.map((_, sizeIdx) => (
                        <td key={sizeIdx} className="py-2.5 px-2">
                          <div className="flex items-center justify-center bg-surface-raised rounded-sm p-0.5 max-w-[110px] mx-auto border border-border">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => decrement(shadeIdx, sizeIdx)}
                              className="w-7 h-7 rounded-sm bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed text-ink font-bold flex items-center justify-center transition-all active:scale-95 shadow-soft-sm text-base cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              disabled={isPending}
                              value={getVal(shadeIdx, sizeIdx)}
                              onChange={e => handleInputChange(shadeIdx, sizeIdx, e.target.value)}
                              className="w-8 text-center bg-transparent font-mono num font-bold text-ink outline-none text-xs disabled:opacity-40"
                            />
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => increment(shadeIdx, sizeIdx)}
                              className="w-7 h-7 rounded-sm bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed text-ink font-bold flex items-center justify-center transition-all active:scale-95 shadow-soft-sm text-base cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      ))}

                      <td className="py-3 px-4 text-right">
                        <span className="font-mono num text-xs sm:text-sm font-semibold text-ink">
                          {rowBoxes} bx{" "}
                          {!isPending && (
                            <span className="text-primary font-bold">
                              (₹{rowAmount.toLocaleString("en-IN")})
                            </span>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Packing & Logistics Note */}
          <div className="mt-4 p-3.5 bg-surface-raised border border-border rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                inventory_2
              </span>
              <span>
                Standard Master Carton contains <strong className="text-ink">60 boxes ({60 * piecesPerBox} pcs)</strong>.
                You currently have <strong className="text-ink">{masterCartons} Master Cartons</strong> selected.
              </span>
            </div>
            <span className="font-semibold text-success flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Box Packed • Wholesale Hub Dispatch
            </span>
          </div>
        </div>

        {/* Modal Bottom Footer Actions - Sticky Total Bar */}
        <div className="sticky bottom-0 z-20 p-3 sm:p-5 bg-surface border-t border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-soft-lg">
          {/* Subtotal metrics */}
          <div className="flex items-center justify-between md:justify-start gap-3 sm:gap-6">
            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-ink-muted uppercase block tracking-wider">
                Total Volume
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-lg sm:text-2xl font-bold text-ink num">
                  {totalPieces.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-ink-muted">pcs</span>
                <span className="text-xs text-ink-muted font-mono num ml-1">
                  ({grandTotalBoxes} bxs)
                </span>
              </div>
            </div>

            <div className="h-7 w-px bg-border" />

            <div>
              <span className="text-[10px] sm:text-[11px] font-semibold text-ink-muted uppercase block tracking-wider">
                Rate / Box
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                {isPending ? (
                  <span className="text-xs sm:text-sm font-bold text-warning font-mono">
                    Pending
                  </span>
                ) : (
                  <>
                    <span className="text-base sm:text-2xl font-bold text-primary font-mono num">
                      {formatINR(ratePerBox)}
                    </span>
                    <span className="text-[10px] sm:text-xs text-ink-muted">/box</span>
                  </>
                )}
              </div>
            </div>

            <div className="h-7 w-px bg-border hidden sm:block" />

            <div className="text-right sm:text-left">
              <span className="text-[10px] sm:text-[11px] font-semibold text-ink-muted uppercase block tracking-wider">
                Line Total
              </span>
              <div className="mt-0.5">
                {isPending ? (
                  <span className="text-xs font-semibold text-ink-muted">
                    Awaited
                  </span>
                ) : (
                  <span className="text-base sm:text-2xl font-bold text-ink font-mono num">
                    {formatINR(subtotalAmount)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeMatrixModal}
              className="flex-1 md:flex-initial px-4 min-h-[48px] rounded-xl bg-background hover:bg-surface text-ink font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 border border-border cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isPending || grandTotalBoxes === 0}
              onClick={handleCommit}
              className="flex-2 md:flex-initial px-6 min-h-[48px] rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-bold text-xs sm:text-sm shadow-soft-md transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              title={isPending ? "Price is pending from distributor" : undefined}
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              <span>
                {isPending
                  ? "Price Pending"
                  : grandTotalBoxes === 0
                  ? "Select Boxes"
                  : `Add to Order (${formatINR(subtotalAmount)})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
