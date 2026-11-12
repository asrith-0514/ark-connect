"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { OrderItem } from "@/data/mockData";
import { formatINR } from "@/lib/mock/retailer";

const SIZES = [
  { key: "s", label: "S", spec: "75 cm" },
  { key: "m", label: "M", spec: "80 cm" },
  { key: "l", label: "L", spec: "85 cm" },
  { key: "xl", label: "XL", spec: "90 cm" },
  { key: "xxl", label: "XXL", spec: "95 cm" },
];

const COLORS = [
  { key: "bk", label: "Jet Black", bgClass: "bg-slate-900", hex: "#0f172a" },
  { key: "nv", label: "Ink Navy", bgClass: "bg-blue-950", hex: "#1e3a8a" },
  { key: "gr", label: "Heather Grey", bgClass: "bg-slate-300", hex: "#cbd5e1" },
  { key: "wh", label: "Classic White", bgClass: "bg-white ring-1 ring-slate-300", hex: "#ffffff" },
];

export default function VariantMatrixModal() {
  const { matrixProduct, closeMatrixModal, addToCart } = useApp();

  // Matrix quantities: { [colorKey_sizeKey]: number }
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({
    bk_s: 3, bk_m: 4, bk_l: 5, bk_xl: 3, bk_xxl: 2,
    nv_s: 3, nv_m: 4, nv_l: 6, nv_xl: 4, nv_xxl: 3,
    gr_s: 2, gr_m: 5, gr_l: 5, gr_xl: 3, gr_xxl: 2,
    wh_s: 10, wh_m: 20, wh_l: 20, wh_xl: 10, wh_xxl: 6,
  });

  // Reset or preset whenever a product is opened
  useEffect(() => {
    if (matrixProduct) {
      // Keep sensible default wholesale distribution
      setQuantities({
        bk_s: 3, bk_m: 4, bk_l: 5, bk_xl: 3, bk_xxl: 2,
        nv_s: 3, nv_m: 4, nv_l: 6, nv_xl: 4, nv_xxl: 3,
        gr_s: 2, gr_m: 5, gr_l: 5, gr_xl: 3, gr_xxl: 2,
        wh_s: 10, wh_m: 20, wh_l: 20, wh_xl: 10, wh_xxl: 6,
      });
    }
  }, [matrixProduct]);

  if (!matrixProduct) return null;

  const ratePerBox = matrixProduct.pricePerUnit;
  const piecesPerBox = matrixProduct.piecesPerUnit;

  const getVal = (colorKey: string, sizeKey: string) => {
    return quantities[`${colorKey}_${sizeKey}`] || 0;
  };

  const setVal = (colorKey: string, sizeKey: string, val: number) => {
    setQuantities(prev => ({
      ...prev,
      [`${colorKey}_${sizeKey}`]: Math.max(0, val),
    }));
  };

  const increment = (colorKey: string, sizeKey: string) => {
    setVal(colorKey, sizeKey, getVal(colorKey, sizeKey) + 1);
  };

  const decrement = (colorKey: string, sizeKey: string) => {
    setVal(colorKey, sizeKey, Math.max(0, getVal(colorKey, sizeKey) - 1));
  };

  const handleInputChange = (colorKey: string, sizeKey: string, text: string) => {
    const num = parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
    setVal(colorKey, sizeKey, num);
  };

  const fillEvenBoxes = (delta: number) => {
    setQuantities(prev => {
      const updated = { ...prev };
      COLORS.forEach(c => {
        SIZES.forEach(s => {
          const key = `${c.key}_${s.key}`;
          updated[key] = (updated[key] || 0) + delta;
        });
      });
      return updated;
    });
  };

  const resetMatrix = () => {
    const cleared: { [key: string]: number } = {};
    COLORS.forEach(c => {
      SIZES.forEach(s => {
        cleared[`${c.key}_${s.key}`] = 0;
      });
    });
    setQuantities(cleared);
  };

  // Calculations
  let grandTotalBoxes = 0;
  COLORS.forEach(c => {
    SIZES.forEach(s => {
      grandTotalBoxes += getVal(c.key, s.key);
    });
  });

  const totalPieces = grandTotalBoxes * piecesPerBox;
  const subtotalAmount = grandTotalBoxes * ratePerBox;
  const masterCartons = (grandTotalBoxes / 60).toFixed(1);

  const handleCommit = () => {
    const itemsToAdd: OrderItem[] = [];

    COLORS.forEach(c => {
      SIZES.forEach(s => {
        const qty = getVal(c.key, s.key);
        if (qty > 0) {
          itemsToAdd.push({
            productId: matrixProduct.id,
            productTitle: matrixProduct.title,
            brand: matrixProduct.brand,
            artNumber: matrixProduct.artNumber,
            image: matrixProduct.image,
            color: c.label,
            colorHex: c.hex,
            size: `${s.label} (${s.spec})`,
            units: qty,
            rate: ratePerBox,
            totalPieces: qty * piecesPerBox,
          });
        }
      });
    });

    if (itemsToAdd.length > 0) {
      addToCart(itemsToAdd);
    }
    closeMatrixModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 p-0 lg:p-4 animate-in fade-in"
      onClick={e => {
        if (e.target === e.currentTarget) closeMatrixModal();
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-t-3xl lg:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Mobile Drag Handle */}
        <div className="w-full flex justify-center pt-3 pb-1 lg:hidden bg-slate-50">
          <div className="w-10 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="p-4 sm:p-6 flex items-start justify-between bg-slate-50 border-b border-slate-200">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200 shadow-sm">
              <img
                src={matrixProduct.image}
                alt={matrixProduct.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-[#0047d3] text-white text-xs px-2.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  {matrixProduct.brand}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Art #{matrixProduct.artNumber}
                </span>
                <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  {matrixProduct.stockStatus}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
                {matrixProduct.title}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600 text-xs sm:text-sm mt-0.5">
                <span>Wholesale {matrixProduct.unitLabel}</span>
                <span className="text-slate-300">•</span>
                <span>{matrixProduct.description}</span>
                <span className="text-slate-300">•</span>
                <span>
                  Net Price:{" "}
                  <strong className="text-[#0047d3] font-bold">
                    {formatINR(ratePerBox)}/box
                  </strong>{" "}
                  ({formatINR(ratePerBox / piecesPerBox)}/pc)
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={closeMatrixModal}
            className="w-9 h-9 rounded-full bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors border border-slate-200 shadow-xs"
            aria-label="Close dialog"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Available Color Swatches Preview */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-100 flex items-center gap-3 overflow-x-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0">
            Available Shades:
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {COLORS.map(c => (
              <div
                key={c.key}
                className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-800"
              >
                <span className={`w-3 h-3 rounded-full ${c.bgClass}`} />
                <span>{c.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Variant Matrix Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/50">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm sm:text-base">
                Size × Colour Quantity Matrix
              </span>
              <span className="text-slate-500 text-xs">
                (Units in boxes of {piecesPerBox})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fillEvenBoxes(2)}
                className="px-3 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-xs text-[#0047d3] font-bold transition-all shadow-2xs"
              >
                +2 All Sizes
              </button>
              <button
                type="button"
                onClick={resetMatrix}
                className="px-3 py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-lg text-xs text-rose-600 font-bold transition-all shadow-2xs"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[620px]">
              <thead>
                <tr className="bg-slate-100/80 text-slate-600 text-xs uppercase border-b border-slate-200">
                  <th className="py-3 px-4 font-bold">Colourway</th>
                  {SIZES.map(s => (
                    <th key={s.key} className="py-3 px-2 text-center font-bold">
                      <div>{s.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{s.spec}</div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right font-bold">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {COLORS.map(c => {
                  let rowBoxes = 0;
                  SIZES.forEach(s => {
                    rowBoxes += getVal(c.key, s.key);
                  });
                  const rowAmount = rowBoxes * ratePerBox;

                  return (
                    <tr key={c.key} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className={`w-4 h-4 rounded-full ${c.bgClass} shrink-0`} />
                          <span className="font-semibold text-slate-800">{c.label}</span>
                        </div>
                      </td>

                      {SIZES.map(s => (
                        <td key={s.key} className="py-2.5 px-2">
                          <div className="flex items-center justify-center bg-slate-100 rounded-lg p-0.5 max-w-[110px] mx-auto border border-slate-200">
                            <button
                              type="button"
                              onClick={() => decrement(c.key, s.key)}
                              className="w-7 h-7 rounded bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-all active:scale-95 shadow-2xs text-base"
                            >
                              -
                            </button>
                            <input
                              type="text"
                              value={getVal(c.key, s.key)}
                              onChange={e => handleInputChange(c.key, s.key, e.target.value)}
                              className="w-8 text-center bg-transparent font-mono font-bold text-slate-900 outline-none text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => increment(c.key, s.key)}
                              className="w-7 h-7 rounded bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center justify-center transition-all active:scale-95 shadow-2xs text-base"
                            >
                              +
                            </button>
                          </div>
                        </td>
                      ))}

                      <td className="py-3 px-4 text-right">
                        <span className="font-mono text-xs sm:text-sm font-semibold text-slate-900">
                          {rowBoxes} bx{" "}
                          <span className="text-[#0047d3] font-bold">
                            (₹{rowAmount.toLocaleString("en-IN")})
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Packing & Logistics Note */}
          <div className="mt-4 p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0047d3] text-[20px]">
                local_shipping
              </span>
              <span>
                Standard Master Carton contains <strong>60 boxes ({60 * piecesPerBox} pcs)</strong>.
                You currently have <strong>{masterCartons} Master Cartons</strong> selected.
              </span>
            </div>
            <span className="font-semibold text-emerald-700 flex items-center gap-1 shrink-0">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Ready for Lorry Freight
            </span>
          </div>
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
          {/* Subtotal metrics */}
          <div className="flex items-center justify-between md:justify-start gap-4 sm:gap-6">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block tracking-wider">
                Total Volume
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-900">
                  {totalPieces.toLocaleString("en-IN")}
                </span>
                <span className="text-xs text-slate-500">pcs</span>
                <span className="text-xs text-slate-400 font-mono ml-1">
                  ({grandTotalBoxes} boxes)
                </span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block tracking-wider">
                Wholesale Net Rate
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold text-[#0047d3]">
                  {formatINR(ratePerBox)}
                </span>
                <span className="text-xs text-slate-500">/ box</span>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block" />

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase block tracking-wider">
                Line Subtotal (GST Extra)
              </span>
              <div className="mt-0.5">
                <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
                  {formatINR(subtotalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={closeMatrixModal}
              className="flex-1 md:flex-initial px-4 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all flex items-center justify-center gap-1.5 border border-slate-200"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={grandTotalBoxes === 0}
              onClick={handleCommit}
              className="flex-1 md:flex-initial px-6 h-11 rounded-xl bg-[#0047d3] hover:bg-[#1e5eff] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              <span>Add to Order ({formatINR(subtotalAmount)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
