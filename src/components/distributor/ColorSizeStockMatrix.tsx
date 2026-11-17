"use client";

import React, { useState, useMemo } from "react";
import { Icon } from "@/components/ui/Icon";
import { TierPricingArticle, CatalogueVariant, CatalogueShade } from "@/lib/mock/types";

export interface ColorSizeStockMatrixProps {
  article: TierPricingArticle;
  onSave?: (updatedVariants: CatalogueVariant[], newTotalBoxes: number, newTotalPieces: number) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export function ColorSizeStockMatrix({
  article,
  onSave,
  onClose,
  isModal = false,
}: ColorSizeStockMatrixProps) {
  // Extract or derive shades
  const shades: CatalogueShade[] = useMemo(() => {
    if (article.availableShades && article.availableShades.length > 0) {
      return article.availableShades;
    }
    if ((article as any).shades && (article as any).shades.length > 0) {
      return (article as any).shades;
    }
    // Fallback standard shades
    return [
      { code: "SH #01", name: "Black", hex: "#111827" },
      { code: "SH #02", name: "White", hex: "#FFFFFF" },
      { code: "SH #03", name: "Red", hex: "#DC2626" },
      { code: "SH #04", name: "Navy", hex: "#1E3A8A" },
      { code: "SH #05", name: "Royal Blue", hex: "#2563EB" },
    ];
  }, [article]);

  // Extract or derive sizes
  const sizes: string[] = useMemo(() => {
    if (article.availableSizes && article.availableSizes.length > 0) {
      return article.availableSizes;
    }
    return ["S", "M", "L", "XL", "2XL", "3XL"];
  }, [article]);

  // Initialize variants map [shadeCode_or_name + "::" + size] -> stockBoxes
  const initialStockMap = useMemo(() => {
    const map = new Map<string, number>();
    const existingVariants: CatalogueVariant[] = (article as any).variants || [];

    // Pre-populate with existing variants
    for (const v of existingVariants) {
      const shadeKey = v.shade?.code || v.shade?.name;
      if (shadeKey) {
        map.set(`${shadeKey}::${v.size}`, v.stockBoxes || 0);
      }
    }

    // Ensure all (shade, size) pairs exist
    for (const shade of shades) {
      const shadeKey = shade.code || shade.name;
      for (const size of sizes) {
        const key = `${shadeKey}::${size}`;
        if (!map.has(key)) {
          map.set(key, 2); // default fallback 2 boxes
        }
      }
    }

    return map;
  }, [article, shades, sizes]);

  // Local state for stock adjustments
  const [stockMap, setStockMap] = useState<Map<string, number>>(initialStockMap);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [cellInputValue, setCellInputValue] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const pcsPerBox = article.piecesPerPack || (article as any).pcsPerBox || 10;

  // Helper to get stock for shade and size
  const getStock = (shade: CatalogueShade, size: string): number => {
    const key = `${shade.code || shade.name}::${size}`;
    return stockMap.get(key) || 0;
  };

  // Update stock for single cell
  const setStock = (shade: CatalogueShade, size: string, newQty: number) => {
    const clamped = Math.max(0, Math.floor(newQty));
    const key = `${shade.code || shade.name}::${size}`;
    setStockMap(prev => {
      const next = new Map(prev);
      next.set(key, clamped);
      return next;
    });
    setHasChanges(true);
  };

  // Adjust stock by delta (+1, -1, +5, etc.)
  const adjustStock = (shade: CatalogueShade, size: string, delta: number) => {
    const current = getStock(shade, size);
    setStock(shade, size, current + delta);
  };

  // Row total for shade across all sizes
  const getShadeTotal = (shade: CatalogueShade): number => {
    return sizes.reduce((sum, size) => sum + getStock(shade, size), 0);
  };

  // Column total for size across all shades
  const getSizeTotal = (size: string): number => {
    return shades.reduce((sum, shade) => sum + getStock(shade, size), 0);
  };

  // Grand total boxes and pieces
  const grandTotalBoxes = useMemo(() => {
    let sum = 0;
    for (const shade of shades) {
      for (const size of sizes) {
        sum += getStock(shade, size);
      }
    }
    return sum;
  }, [stockMap, shades, sizes]);

  const grandTotalPieces = grandTotalBoxes * pcsPerBox;

  // Filtered shades based on search & stock status
  const filteredShades = useMemo(() => {
    return shades.filter(shade => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = shade.name.toLowerCase().includes(q);
        const matchesCode = (shade.code || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCode) return false;
      }

      // 2. Status Filter
      const shadeTotal = sizes.reduce((sum, size) => sum + getStock(shade, size), 0);
      const hasOutOfStock = sizes.some(size => getStock(shade, size) === 0);
      const hasLowStock = sizes.some(size => {
        const st = getStock(shade, size);
        return st > 0 && st <= 4;
      });

      if (statusFilter === "out_of_stock") {
        return hasOutOfStock;
      }
      if (statusFilter === "low_stock") {
        return hasLowStock;
      }
      if (statusFilter === "in_stock") {
        return shadeTotal > 0 && !hasOutOfStock;
      }

      return true;
    });
  }, [shades, sizes, stockMap, searchQuery, statusFilter]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    let outOfStockCells = 0;
    let lowStockCells = 0;
    let healthyCells = 0;

    for (const shade of shades) {
      for (const size of sizes) {
        const st = getStock(shade, size);
        if (st === 0) outOfStockCells++;
        else if (st <= 4) lowStockCells++;
        else healthyCells++;
      }
    }

    return {
      totalCells: shades.length * sizes.length,
      outOfStockCells,
      lowStockCells,
      healthyCells,
    };
  }, [shades, sizes, stockMap]);

  // Bulk quick adjustments for filtered shades
  const handleBulkAdjust = (delta: number) => {
    setStockMap(prev => {
      const next = new Map(prev);
      for (const shade of filteredShades) {
        for (const size of sizes) {
          const key = `${shade.code || shade.name}::${size}`;
          const current = next.get(key) || 0;
          next.set(key, Math.max(0, current + delta));
        }
      }
      return next;
    });
    setHasChanges(true);
  };

  // Reset to initial
  const handleReset = () => {
    setStockMap(new Map(initialStockMap));
    setHasChanges(false);
  };

  // Save changes
  const handleSave = () => {
    const updatedVariants: CatalogueVariant[] = [];

    for (const shade of shades) {
      const shadeKey = shade.code || shade.name;
      for (const size of sizes) {
        const key = `${shadeKey}::${size}`;
        const stock = stockMap.get(key) || 0;
        updatedVariants.push({
          id: `${article.id}-${(shade.code || shade.name).toLowerCase().replace(/[^a-z0-9]/g, "")}-${size.toLowerCase()}`,
          shade,
          size,
          stockBoxes: stock,
        });
      }
    }

    if (onSave) {
      onSave(updatedVariants, grandTotalBoxes, grandTotalPieces);
    }

    setHasChanges(false);
    setSaveSuccessMsg(`Stock updated successfully: ${grandTotalBoxes.toLocaleString("en-IN")} boxes (${grandTotalPieces.toLocaleString("en-IN")} pcs)`);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  return (
    <div className={`flex flex-col gap-3 text-ink ${isModal ? "p-6" : "p-4 bg-surface rounded-xl border border-border shadow-soft-sm"}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-sm bg-surface-raised border border-border text-ink">
              {article.artNumber}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
              {article.brand}
            </span>
            <span className="text-xs text-ink-muted">
              {article.category} · Box of {pcsPerBox} pcs
            </span>
          </div>
          <h2 className="text-lg font-bold text-ink mt-1 flex items-center gap-2">
            <Icon name="palette" size={20} className="text-primary" />
            <span>Color &amp; Size Stock Matrix: {article.title}</span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Track and adjust real warehouse inventory across all shades and sizes. Changes update catalogue hub stock instantly.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {hasChanges && (
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-soft-sm transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
            >
              <Icon name="save" size={16} />
              <span>Save Stock Changes</span>
            </button>
          )}

          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 rounded-lg bg-surface-raised hover:bg-surface text-ink font-semibold text-xs border border-border transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-raised text-ink-muted hover:text-ink transition-colors cursor-pointer"
              title="Close Stock Matrix"
            >
              <Icon name="close" size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Success Banner */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-lg bg-success/15 border border-success/30 text-success text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Icon name="check_circle" size={16} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="p-3 bg-surface-raised rounded-lg border border-border shadow-soft-xs">
          <span className="text-[11px] font-semibold text-ink-muted block">Total Hub Stock</span>
          <span className="text-base font-bold font-mono text-primary num mt-0.5 block">
            {grandTotalBoxes.toLocaleString("en-IN")} bx
          </span>
          <span className="text-[10px] text-ink-muted block">
            {grandTotalPieces.toLocaleString("en-IN")} pcs
          </span>
        </div>

        <div className="p-3 bg-surface-raised rounded-lg border border-border shadow-soft-xs">
          <span className="text-[11px] font-semibold text-ink-muted block">Total Colors</span>
          <span className="text-base font-bold font-mono text-ink num mt-0.5 block">
            {shades.length} shades
          </span>
          <span className="text-[10px] text-ink-muted block">
            Available palette
          </span>
        </div>

        <div className="p-3 bg-surface-raised rounded-lg border border-border shadow-soft-xs">
          <span className="text-[11px] font-semibold text-ink-muted block">Sizes Offered</span>
          <span className="text-base font-bold font-mono text-ink num mt-0.5 block">
            {sizes.length} sizes
          </span>
          <span className="text-[10px] text-ink-muted block">
            {sizes[0]} to {sizes[sizes.length - 1]}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("in_stock")}
          className={`p-3 rounded-lg border shadow-soft-xs cursor-pointer transition-all ${
            statusFilter === "in_stock"
              ? "bg-success/15 border-success ring-1 ring-success/30"
              : "bg-surface-raised border-border hover:border-success/40"
          }`}
        >
          <span className="text-[11px] font-semibold text-success block">Healthy Stock</span>
          <span className="text-base font-bold font-mono text-success num mt-0.5 block">
            {summaryCounts.healthyCells}
          </span>
          <span className="text-[10px] text-success/80 block">
            &ge; 5 boxes
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("low_stock")}
          className={`p-3 rounded-lg border shadow-soft-xs cursor-pointer transition-all ${
            statusFilter === "low_stock"
              ? "bg-warning/15 border-warning ring-1 ring-warning/30"
              : "bg-surface-raised border-border hover:border-warning/40"
          }`}
        >
          <span className="text-[11px] font-semibold text-warning block">Low Stock Alert</span>
          <span className="text-base font-bold font-mono text-warning num mt-0.5 block">
            {summaryCounts.lowStockCells}
          </span>
          <span className="text-[10px] text-warning/80 block">
            1 to 4 boxes
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("out_of_stock")}
          className={`p-3 rounded-lg border shadow-soft-xs cursor-pointer transition-all ${
            statusFilter === "out_of_stock"
              ? "bg-danger/15 border-danger ring-1 ring-danger/30"
              : "bg-surface-raised border-border hover:border-danger/40"
          }`}
        >
          <span className="text-[11px] font-semibold text-danger block">Out of Stock</span>
          <span className="text-base font-bold font-mono text-danger num mt-0.5 block">
            {summaryCounts.outOfStockCells}
          </span>
          <span className="text-[10px] text-danger/80 block">
            0 boxes
          </span>
        </div>
      </div>

      {/* Filter and Quick Action Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 p-2.5 bg-surface-raised rounded-lg border border-border">
        {/* Left: Search & Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] max-w-xs">
            <Icon name="search" size={16} className="absolute left-2.5 top-2.5 text-ink-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter shade by name or code..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-surface border border-border rounded-md text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 text-ink-muted hover:text-ink"
              >
                <Icon name="close" size={14} />
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === "all"
                  ? "bg-primary text-white shadow-soft-xs"
                  : "bg-surface text-ink hover:bg-surface-raised border border-border"
              }`}
            >
              All ({shades.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("in_stock")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === "in_stock"
                  ? "bg-success text-white shadow-soft-xs"
                  : "bg-surface text-ink hover:bg-surface-raised border border-border"
              }`}
            >
              In Stock
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("low_stock")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === "low_stock"
                  ? "bg-warning text-ink font-bold shadow-soft-xs"
                  : "bg-surface text-ink hover:bg-surface-raised border border-border"
              }`}
            >
              Low Stock (&lt; 5 bx)
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("out_of_stock")}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                statusFilter === "out_of_stock"
                  ? "bg-danger text-white shadow-soft-xs"
                  : "bg-surface text-ink hover:bg-surface-raised border border-border"
              }`}
            >
              Out of Stock (0)
            </button>
          </div>
        </div>

        {/* Right: Quick Batch Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-[11px] text-ink-muted font-medium hidden sm:inline">
            Quick Adjust Filtered ({filteredShades.length}):
          </span>
          <button
            type="button"
            onClick={() => handleBulkAdjust(5)}
            className="px-2.5 py-1 rounded-md bg-surface hover:bg-surface-raised text-ink font-semibold text-xs border border-border shadow-soft-xs transition-colors cursor-pointer"
            title="Add 5 boxes to all currently filtered cells"
          >
            +5 bx All
          </button>
          <button
            type="button"
            onClick={() => handleBulkAdjust(10)}
            className="px-2.5 py-1 rounded-md bg-surface hover:bg-surface-raised text-ink font-semibold text-xs border border-border shadow-soft-xs transition-colors cursor-pointer"
            title="Add 10 boxes to all currently filtered cells"
          >
            +10 bx All
          </button>
        </div>
      </div>

      {/* 2D Color x Size Stock Table */}
      <div className="border border-border rounded-lg overflow-hidden shadow-soft-sm bg-surface max-h-[560px] overflow-y-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead className="sticky top-0 z-10 bg-surface-raised border-b border-border select-none shadow-soft-xs">
            <tr className="text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              <th className="py-2.5 px-3 w-12 text-center">#</th>
              <th className="py-2.5 px-3 min-w-[180px]">Color / Shade</th>
              {sizes.map(size => (
                <th key={size} className="py-2.5 px-3 text-center min-w-[90px]">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-ink">{size}</span>
                    <span className="text-[10px] font-normal text-ink-muted font-mono">
                      {getSizeTotal(size)} bx
                    </span>
                  </div>
                </th>
              ))}
              <th className="py-2.5 px-3 text-right min-w-[110px]">Total (Boxes)</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border text-xs">
            {filteredShades.length === 0 ? (
              <tr>
                <td colSpan={sizes.length + 3} className="py-8 text-center text-ink-muted">
                  <Icon name="search_off" size={24} className="mx-auto mb-1 opacity-50" />
                  <span>No shades matching &quot;{searchQuery}&quot; or selected filter.</span>
                </td>
              </tr>
            ) : (
              filteredShades.map((shade, idx) => {
                const shadeTotal = getShadeTotal(shade);
                const hasOos = sizes.some(s => getStock(shade, s) === 0);

                return (
                  <tr
                    key={shade.code || shade.name}
                    className={`hover:bg-primary/5 transition-colors ${
                      hasOos ? "bg-danger/[0.02]" : ""
                    }`}
                  >
                    {/* Index */}
                    <td className="py-2 px-3 text-center text-[10px] font-mono text-ink-muted">
                      {idx + 1}
                    </td>

                    {/* Color Swatch & Label */}
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 border border-border shadow-soft-xs"
                          style={{ backgroundColor: shade.hex || "#94A3B8" }}
                          title={shade.hex || shade.name}
                        />
                        <div className="flex flex-col">
                          <span className="font-bold text-ink text-xs truncate max-w-[150px]">
                            {shade.name}
                          </span>
                          {shade.code && (
                            <span className="font-mono text-[10px] text-ink-muted font-semibold">
                              {shade.code}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Size Cells */}
                    {sizes.map(size => {
                      const stock = getStock(shade, size);
                      const cellKey = `${shade.code || shade.name}::${size}`;
                      const isEditingThis = editingCell === cellKey;

                      // Stock status styling
                      const isOos = stock === 0;
                      const isLow = stock > 0 && stock <= 4;

                      return (
                        <td key={size} className="py-1.5 px-2 text-center">
                          {isEditingThis ? (
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                autoFocus
                                value={cellInputValue}
                                onChange={e => setCellInputValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    setStock(shade, size, Number(cellInputValue));
                                    setEditingCell(null);
                                  } else if (e.key === "Escape") {
                                    setEditingCell(null);
                                  }
                                }}
                                onBlur={() => {
                                  setStock(shade, size, Number(cellInputValue));
                                  setEditingCell(null);
                                }}
                                className="w-14 h-7 text-center font-mono font-bold text-xs bg-surface border border-primary rounded shadow-soft-xs text-primary focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-1 group/cell">
                              {/* Quick Decrement */}
                              <button
                                type="button"
                                disabled={stock <= 0}
                                onClick={() => adjustStock(shade, size, -1)}
                                className="w-5 h-5 rounded flex items-center justify-center text-ink-muted hover:bg-surface-raised hover:text-ink disabled:opacity-20 cursor-pointer transition-colors"
                                title="Subtract 1 box"
                              >
                                -
                              </button>

                              {/* Box Count Badge (Clickable to edit directly) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCell(cellKey);
                                  setCellInputValue(String(stock));
                                }}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer min-w-[42px] border ${
                                  isOos
                                    ? "bg-danger/10 text-danger border-danger/20 hover:bg-danger/20"
                                    : isLow
                                    ? "bg-warning/15 text-warning border-warning/30 hover:bg-warning/25"
                                    : "bg-surface-raised text-ink border-border hover:border-primary/40"
                                }`}
                                title="Click to edit quantity directly"
                              >
                                {stock === 0 ? "0 bx" : `${stock} bx`}
                              </button>

                              {/* Quick Increment */}
                              <button
                                type="button"
                                onClick={() => adjustStock(shade, size, 1)}
                                className="w-5 h-5 rounded flex items-center justify-center text-ink-muted hover:bg-surface-raised hover:text-ink cursor-pointer transition-colors"
                                title="Add 1 box"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* Row Total (Boxes) */}
                    <td className="py-2 px-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-mono font-bold text-ink text-xs num">
                          {shadeTotal} bx
                        </span>
                        <span className="text-[10px] text-ink-muted font-mono">
                          {(shadeTotal * pcsPerBox).toLocaleString("en-IN")} pcs
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Sticky Table Footer: Grand Totals per Size */}
          <tfoot className="sticky bottom-0 z-10 bg-surface-raised border-t-2 border-border font-bold text-xs select-none shadow-soft-xs">
            <tr>
              <td className="py-3 px-3 text-center text-ink-muted font-mono uppercase text-[10px]">
                Total
              </td>
              <td className="py-3 px-3 text-ink">
                <span>Total Hub Stock across {shades.length} shades</span>
              </td>
              {sizes.map(size => {
                const total = getSizeTotal(size);
                return (
                  <td key={size} className="py-3 px-3 text-center">
                    <span className="font-mono text-primary font-bold text-xs num block">
                      {total.toLocaleString("en-IN")} bx
                    </span>
                    <span className="text-[10px] text-ink-muted font-mono font-normal">
                      {(total * pcsPerBox).toLocaleString("en-IN")} pcs
                    </span>
                  </td>
                );
              })}
              <td className="py-3 px-3 text-right">
                <span className="font-mono text-primary font-bold text-sm num block">
                  {grandTotalBoxes.toLocaleString("en-IN")} bx
                </span>
                <span className="text-[10px] text-ink-muted font-mono font-normal">
                  {grandTotalPieces.toLocaleString("en-IN")} pcs
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bottom Sticky Action Bar if changes pending */}
      {hasChanges && (
        <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Icon name="info" size={16} />
            <span>You have unsaved stock adjustments for this style.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-md bg-surface text-ink text-xs font-semibold border border-border hover:bg-surface-raised cursor-pointer"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-soft-xs cursor-pointer flex items-center gap-1.5"
            >
              <Icon name="check" size={15} />
              <span>Apply &amp; Save Stock</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
