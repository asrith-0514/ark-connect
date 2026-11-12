"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { TierPricingArticle, MOCK_BRANDS, Brand } from "@/data/mockData";

export const DistributorProducts: React.FC = () => {
  const { tierArticles, updateTierArticle } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editApp, setEditApp] = useState<number>(0);
  const [editAp, setEditAp] = useState<number>(0);
  const [editA, setEditA] = useState<number>(0);
  const [editError, setEditError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Filter articles
  const filteredArticles = tierArticles.filter(art => {
    if (selectedBrand !== "all" && art.brand.toLowerCase() !== selectedBrand.toLowerCase()) {
      return false;
    }
    if (selectedCategory !== "all" && art.category !== selectedCategory) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        art.artNumber.toLowerCase().includes(q) ||
        art.title.toLowerCase().includes(q) ||
        art.brand.toLowerCase().includes(q) ||
        art.category.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const startEdit = (art: TierPricingArticle) => {
    setEditingId(art.id);
    setEditApp(art.tierAppPrice);
    setEditAp(art.tierApPrice);
    setEditA(art.tierAPrice);
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleAppChange = (val: number) => {
    setEditApp(val);
    validatePrices(val, editAp, editA);
  };

  const handleApChange = (val: number) => {
    setEditAp(val);
    validatePrices(editApp, val, editA);
  };

  const handleAChange = (val: number) => {
    setEditA(val);
    validatePrices(editApp, editAp, val);
  };

  const validatePrices = (app: number, ap: number, a: number) => {
    if (app > ap) {
      setEditError(`Tier A++ price (₹${app}) cannot exceed Tier A+ price (₹${ap}).`);
      return false;
    }
    if (ap > a) {
      setEditError(`Tier A+ price (₹${ap}) cannot exceed Tier A price (₹${a}).`);
      return false;
    }
    if (app <= 0 || ap <= 0 || a <= 0) {
      setEditError("Prices must be greater than zero.");
      return false;
    }
    setEditError(null);
    return true;
  };

  const saveEdit = (id: string) => {
    if (!validatePrices(editApp, editAp, editA)) {
      return;
    }

    const res = updateTierArticle(id, {
      tierAppPrice: editApp,
      tierApPrice: editAp,
      tierAPrice: editA
    });

    if (res.success) {
      setEditingId(null);
      setSaveSuccessMsg(`Updated tier pricing for article.`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } else {
      setEditError(res.error || "Failed to update pricing.");
    }
  };

  const toggleArticleActive = (art: TierPricingArticle) => {
    updateTierArticle(art.id, { isActive: !art.isActive });
  };

  // Export articles as CSV
  const exportCSV = () => {
    const headers = [
      "Article #",
      "Brand",
      "Product Title",
      "Category",
      "Pack Size",
      "Pcs/Pack",
      "Tier A++ Net Price (INR)",
      "Tier A+ Net Price (INR)",
      "Tier A Net Price (INR)",
      "Hub Stock (Pcs)",
      "Hub Stock (Boxes)",
      "Status",
      "HSN"
    ];

    const rows = tierArticles.map(a => [
      a.artNumber,
      `"${a.brand}"`,
      `"${a.title}"`,
      `"${a.category}"`,
      `"${a.packSize}"`,
      a.piecesPerPack,
      a.tierAppPrice,
      a.tierApPrice,
      a.tierAPrice,
      a.hubStock,
      a.hubStockBoxes,
      a.isActive ? "Active" : "Inactive",
      a.hsnCode
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ARK_Tier_Pricing_Matrix_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Distinct categories
  const categories = Array.from(new Set(tierArticles.map(a => a.category)));

  // Total stock count
  const totalStockPcs = tierArticles.reduce((sum, a) => sum + a.hubStock, 0);

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Products &amp; Pricing
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0047d3] text-xs font-bold border border-blue-200">
              9 Mill Brands
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Master wholesale price lists, volume tier rates (A++ / A+ / A), and hub inventory allocation
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={exportCSV}
            className="h-10 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Internal Security Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-start sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-amber-400 text-[20px] shrink-0">lock</span>
          <div>
            <span className="font-bold text-amber-300 mr-2">CONFIDENTIAL PRICING MATRIX:</span>
            <span className="text-slate-300">
              Tier pricing is strictly internal to ARK Backoffice. Retailers only see the single net price applicable to their assigned tier.
            </span>
          </div>
        </div>
        <span className="hidden lg:inline px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[11px] shrink-0">
          Rule: A++ &le; A+ &le; A
        </span>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Catalogued Brands
          </span>
          <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
            9 Brands
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Tiruppur Mill Sourced</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Master Articles
          </span>
          <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
            {tierArticles.length} Articles
          </span>
          <span className="text-[11px] text-emerald-600 mt-0.5 block">
            {tierArticles.filter(a => a.isActive).length} Active for Orders
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Hub Physical Stock
          </span>
          <span className="text-2xl font-bold text-slate-900 font-sans tabular-nums mt-1 block">
            {totalStockPcs.toLocaleString("en-IN")} pcs
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Secunderabad Depot</span>
        </div>
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Tier A++ Rebate Rule
          </span>
          <span className="text-2xl font-bold text-[#0047d3] font-sans tabular-nums mt-1 block">
            5% Margin Spread
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Max Volume Threshold</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute left-3 top-2.5">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by article #, brand, or title..."
              className="w-full h-10 pl-9 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3]/20 focus:border-[#0047d3] transition-all"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3]/20 focus:border-[#0047d3] text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All 9 Brands</option>
            {MOCK_BRANDS.map((b: Brand) => (
              <option key={b.id} value={b.name}>
                {b.name} ({b.shortCode})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0047d3]/20 focus:border-[#0047d3] text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing {filteredArticles.length} of {tierArticles.length} articles
        </div>
      </div>

      {/* Notifications / Toast */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px] text-emerald-600">check_circle</span>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Products & Tier Pricing Table */}
      <div className="bg-white rounded-2xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200 font-bold">
                <th className="py-3 px-4">Article # &amp; Title</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Pack Size</th>
                <th className="py-3 px-3 text-right">Pcs/Pack</th>
                <th className="py-3 px-3 text-right bg-blue-50/50 text-[#0047d3]">
                  Tier A++ (Net)
                </th>
                <th className="py-3 px-3 text-right bg-slate-50">
                  Tier A+ (Net)
                </th>
                <th className="py-3 px-3 text-right bg-slate-50">
                  Tier A (Net)
                </th>
                <th className="py-3 px-3 text-right">Hub Stock</th>
                <th className="py-3 px-3 text-center">Active</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-[36px] mb-2 block text-slate-300">
                      inventory_2
                    </span>
                    No articles match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredArticles.map(art => {
                  const isEditing = editingId === art.id;

                  return (
                    <tr
                      key={art.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isEditing ? "bg-blue-50/20" : ""
                      }`}
                    >
                      {/* Article # & Title */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                            {art.artNumber}
                          </span>
                          <span className="truncate max-w-[220px]" title={art.title}>
                            {art.title}
                          </span>
                        </div>
                      </td>

                      {/* Brand */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 whitespace-nowrap">
                          {art.brand}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {art.category}
                      </td>

                      {/* Pack Size */}
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {art.packSize}
                      </td>

                      {/* Pcs/Pack */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-700 font-medium">
                        {art.piecesPerPack}
                      </td>

                      {/* Tier A++ */}
                      <td className="py-3.5 px-3 text-right bg-blue-50/30 font-semibold font-sans tabular-nums text-[#0047d3]">
                        {isEditing ? (
                          <div className="flex items-center justify-end">
                            <span className="text-slate-400 mr-1">₹</span>
                            <input
                              type="number"
                              value={editApp}
                              onChange={e => handleAppChange(Number(e.target.value))}
                              className="w-20 h-8 px-2 text-right text-xs bg-white border border-[#0047d3] rounded-lg font-bold text-[#0047d3] focus:outline-none focus:ring-2 focus:ring-[#0047d3]/20"
                            />
                          </div>
                        ) : (
                          <span>₹{art.tierAppPrice.toLocaleString("en-IN")}</span>
                        )}
                      </td>

                      {/* Tier A+ */}
                      <td className="py-3.5 px-3 text-right font-semibold font-sans tabular-nums text-slate-800">
                        {isEditing ? (
                          <div className="flex items-center justify-end">
                            <span className="text-slate-400 mr-1">₹</span>
                            <input
                              type="number"
                              value={editAp}
                              onChange={e => handleApChange(Number(e.target.value))}
                              className="w-20 h-8 px-2 text-right text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047d3]/20"
                            />
                          </div>
                        ) : (
                          <span>₹{art.tierApPrice.toLocaleString("en-IN")}</span>
                        )}
                      </td>

                      {/* Tier A */}
                      <td className="py-3.5 px-3 text-right font-semibold font-sans tabular-nums text-slate-700">
                        {isEditing ? (
                          <div className="flex items-center justify-end">
                            <span className="text-slate-400 mr-1">₹</span>
                            <input
                              type="number"
                              value={editA}
                              onChange={e => handleAChange(Number(e.target.value))}
                              className="w-20 h-8 px-2 text-right text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0047d3]/20"
                            />
                          </div>
                        ) : (
                          <span>₹{art.tierAPrice.toLocaleString("en-IN")}</span>
                        )}
                      </td>

                      {/* Hub Stock */}
                      <td className="py-3.5 px-3 text-right font-sans tabular-nums text-slate-700">
                        <span className="font-semibold">{art.hubStock.toLocaleString("en-IN")} pcs</span>
                        <span className="text-[10px] text-slate-400 block">({art.hubStockBoxes} bx)</span>
                      </td>

                      {/* Active Toggle */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleArticleActive(art)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            art.isActive ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                          title={art.isActive ? "Active in retailer catalogue" : "Hidden from catalogue"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              art.isActive ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => saveEdit(art.id)}
                              disabled={Boolean(editError)}
                              className="px-2.5 py-1 rounded-lg bg-[#0047d3] hover:bg-[#1e5eff] disabled:opacity-50 text-white font-bold text-[11px] shadow-2xs transition-colors cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium text-[11px] transition-colors cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(art)}
                            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Inline Edit Error Message Bar */}
        {editError && (
          <div className="p-3 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span className="font-medium">{editError}</span>
            </div>
            <span className="text-[11px] text-rose-500 font-semibold uppercase">Rule: A++ &le; A+ &le; A</span>
          </div>
        )}
      </div>
    </div>
  );
};
