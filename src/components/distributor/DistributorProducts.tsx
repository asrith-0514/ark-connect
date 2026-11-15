"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { TierPricingArticle, MOCK_BRANDS, Brand } from "@/data/mockData";
import { CATEGORIES_CONFIG } from "@/lib/mock/catalogueConfig";
import { imageStore, useEntityImages } from "@/lib/storage/imageStore";
import { BrandLogoUploadModal } from "@/components/distributor/BrandLogoUploadModal";
import { ProductImageUploadModal } from "@/components/distributor/ProductImageUploadModal";

function StyleThumbnailCell({
  article,
  onClick,
}: {
  article: TierPricingArticle;
  onClick: () => void;
}) {
  const { primaryUrl, images } = useEntityImages("style", article.id);
  const count = images.length;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        className="relative w-10 h-10 rounded-lg overflow-hidden border border-border bg-background shrink-0 hover:border-primary/50 group cursor-pointer shadow-soft-xs"
        title="Manage style photos"
      >
        {primaryUrl ? (
          <img src={primaryUrl} alt={article.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-surface-raised text-ink-muted">
            <span className="material-symbols-outlined text-[16px] text-ink-muted">add_a_photo</span>
          </div>
        )}
      </button>

      <div>
        {count > 0 ? (
          <button
            type="button"
            onClick={onClick}
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[13px]">image</span>
            <span>
              {count} {count === 1 ? "photo" : "photos"}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onClick}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-warning/15 text-warning border border-warning/25 hover:bg-warning/25 flex items-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[11px]">warning</span>
            <span>No Photos</span>
          </button>
        )}
      </div>
    </div>
  );
}

function BrandLogoChip({ brand, onClick }: { brand: Brand; onClick: () => void }) {
  const { primaryUrl } = useEntityImages("brand", brand.id);
  const displayImage = primaryUrl || brand.logo || brand.image;

  return (
    <button
      type="button"
      onClick={onClick}
      className="p-1.5 pr-3 rounded-full bg-surface hover:bg-surface-raised border border-border flex items-center gap-2 shadow-soft-xs hover:border-primary/40 transition-all cursor-pointer group shrink-0"
      title={`Upload or manage logo for ${brand.name}`}
    >
      <div
        className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-[10px] shadow-soft-xs shrink-0"
        style={{
          backgroundColor: !displayImage
            ? brand.colorHex || brand.accentColor || "#3B3BF5"
            : undefined,
        }}
      >
        {displayImage ? (
          <img src={displayImage} alt={brand.name} className="w-full h-full object-cover rounded-full" />
        ) : (
          <span>{brand.name.substring(0, 2).toUpperCase()}</span>
        )}
      </div>
      <span className="text-xs font-bold text-ink">{brand.name}</span>
      <span className="material-symbols-outlined text-[14px] text-ink-muted group-hover:text-primary">
        camera_alt
      </span>
    </button>
  );
}

export const DistributorProducts: React.FC = () => {
  const { tierArticles, updateTierArticle } = useApp();
  const { hasPermission } = useAuth();
  const canViewTierPricing = hasPermission("canViewTierPricing");
  const canEditTierPricing = hasPermission("canEditTierPricing");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterWithoutPhotos, setFilterWithoutPhotos] = useState(false);
  const [stylesWithPhotos, setStylesWithPhotos] = useState<Set<string>>(new Set());
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);

  // Modals
  const [selectedBrandForLogo, setSelectedBrandForLogo] = useState<Brand | null>(null);
  const [selectedArticleForImages, setSelectedArticleForImages] = useState<TierPricingArticle | null>(null);

  // Load styles that have images in store
  const refreshPhotosSet = async () => {
    try {
      const set = await imageStore.getAllEntityIdsWithImages("style");
      setStylesWithPhotos(set);
    } catch (e) {
      console.warn("Failed to read styles with photos:", e);
    }
  };

  useEffect(() => {
    refreshPhotosSet();

    const handler = () => {
      refreshPhotosSet();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("ark:image-store-updated", handler);
      return () => window.removeEventListener("ark:image-store-updated", handler);
    }
  }, []);

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
    if (filterWithoutPhotos && stylesWithPhotos.has(art.id.toLowerCase())) {
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

  const missingPhotosCount = tierArticles.filter(
    a => !stylesWithPhotos.has(a.id.toLowerCase())
  ).length;

  const startEdit = (art: TierPricingArticle) => {
    setEditingId(art.id);
    setEditApp(art.tierAppPrice || 350);
    setEditAp(art.tierApPrice || 375);
    setEditA(art.tierAPrice || 400);
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
      tierAPrice: editA,
      pricePending: false,
    });

    if (res.success) {
      setEditingId(null);
      setSaveSuccessMsg(`Updated tier pricing for article. Price is now live!`);
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
      "Price Status",
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
      a.pricePending ? "PENDING" : a.tierAppPrice,
      a.pricePending ? "PENDING" : a.tierApPrice,
      a.pricePending ? "PENDING" : a.tierAPrice,
      a.pricePending ? "Pending" : "Active",
      a.hubStock,
      a.hubStockBoxes,
      a.isActive ? "Active" : "Inactive",
      a.hsnCode || "61091000"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ark_product_catalog_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingCount = tierArticles.filter(a => a.pricePending).length;
  const activeCount = tierArticles.filter(a => a.isActive).length;

  return (
    <div className="w-full flex flex-col gap-6 pb-16">
      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
            <span>Catalogue</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-ink font-bold">Products &amp; Pricing</span>
          </div>
          <h1 className="text-2xl font-bold text-ink tracking-tight mt-1">
            Products &amp; Pricing
          </h1>
          <p className="text-xs text-ink-muted mt-0.5">
            Real product catalogue across all 7 mill brands. Every item is box-packed with Tier A++ &le; Tier A+ &le; Tier A pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-md bg-surface hover:bg-surface-raised text-ink font-semibold text-xs transition-colors flex items-center gap-1.5 border border-border shadow-soft-sm cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Catalog Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-surface rounded-md border border-border shadow-soft-sm">
          <span className="text-xs font-semibold text-ink-muted">Total Styles</span>
          <div className="text-2xl font-bold font-mono num text-ink mt-1">
            {tierArticles.length}
          </div>
          <span className="text-[11px] text-ink-muted mt-1 block">
            Across {MOCK_BRANDS.length} Mill Brands
          </span>
        </div>

        <div className="p-4 bg-surface rounded-md border border-border shadow-soft-sm">
          <span className="text-xs font-semibold text-ink-muted">Active in Catalogue</span>
          <div className="text-2xl font-bold font-mono num text-success mt-1">
            {activeCount}
          </div>
          <span className="text-[11px] text-ink-muted mt-1 block">
            Retailer Portal Enabled
          </span>
        </div>

        <div className="p-4 bg-surface rounded-md border border-border shadow-soft-sm">
          <span className="text-xs font-semibold text-ink-muted">Price Pending</span>
          <div className="text-2xl font-bold font-mono num text-warning mt-1">
            {pendingCount}
          </div>
          <span className="text-[11px] text-warning mt-1 block font-semibold">
            Rate confirmation awaited
          </span>
        </div>

        <div className="p-4 bg-surface rounded-md border border-border shadow-soft-sm">
          <span className="text-xs font-semibold text-ink-muted">Total Hub Stock</span>
          <div className="text-2xl font-bold font-mono num text-primary mt-1">
            {tierArticles.reduce((s, a) => s + (a.hubStockBoxes || 0), 0).toLocaleString("en-IN")}
          </div>
          <span className="text-[11px] text-ink-muted mt-1 block">
            Master Boxes in Warehouse
          </span>
        </div>
      </div>

      {/* Brand Logos Management Strip */}
      <div className="p-3 bg-surface rounded-xl border border-border shadow-soft-sm flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <span className="material-symbols-outlined text-[17px] text-primary">verified</span>
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            Brand Logos:
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {MOCK_BRANDS.map((brand: Brand) => (
            <BrandLogoChip
              key={brand.id}
              brand={brand}
              onClick={() => setSelectedBrandForLogo(brand)}
            />
          ))}
        </div>
      </div>

      {/* Category Tree Navigation / Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-surface rounded-md border border-border shadow-soft-sm">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground shadow-soft-xs"
              : "bg-surface-raised hover:bg-surface text-ink"
          }`}
        >
          All Categories ({tierArticles.length})
        </button>
        {CATEGORIES_CONFIG.map(cat => {
          const count = tierArticles.filter(a => a.category === cat).length;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-soft-xs"
                  : "bg-surface-raised hover:bg-surface text-ink"
              }`}
            >
              <span>{cat}</span>
              <span className="text-[10px] font-mono opacity-80 num">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 bg-surface rounded-md border border-border shadow-soft-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-ink-muted text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by article #, brand, or title..."
              className="w-full h-10 pl-9 pr-3 text-xs bg-surface-raised border border-border rounded-md text-ink placeholder:text-ink-muted focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="h-10 px-3 text-xs bg-surface-raised border border-border rounded-md focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-ink font-medium cursor-pointer"
          >
            <option value="all">All {MOCK_BRANDS.length} Brands</option>
            {MOCK_BRANDS.map((b: Brand) => (
              <option key={b.id} value={b.name}>
                {b.name} ({b.shortCode})
              </option>
            ))}
          </select>

          {/* Missing Photos Filter Toggle */}
          <label className="h-10 flex items-center gap-2 text-xs text-ink font-semibold cursor-pointer bg-surface-raised px-3.5 rounded-md border border-border hover:bg-surface shadow-soft-sm select-none shrink-0">
            <input
              type="checkbox"
              checked={filterWithoutPhotos}
              onChange={e => setFilterWithoutPhotos(e.target.checked)}
              className="w-4 h-4 rounded text-primary focus:ring-0 cursor-pointer accent-primary"
            />
            <span className="flex items-center gap-1.5">
              <span>Styles Without Photos</span>
              <span className="px-1.5 py-0.2 rounded-full bg-warning/20 text-warning text-[10px] font-mono font-bold num">
                {missingPhotosCount}
              </span>
            </span>
          </label>
        </div>

        <div className="text-xs text-ink-muted font-medium">
          Showing {filteredArticles.length} of {tierArticles.length} styles
        </div>
      </div>

      {/* Notifications / Toast */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-md bg-success/10 border border-success/20 text-success text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Products & Tier Pricing Table */}
      <div className="bg-surface rounded-md shadow-soft-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-surface-raised text-ink-muted text-[11px] uppercase tracking-wider border-b border-border font-bold">
                <th className="py-3 px-3">Photo</th>
                <th className="py-3 px-4">Article # &amp; Title</th>
                <th className="py-3 px-3">Brand</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Packing</th>
                {canViewTierPricing ? (
                  <>
                    <th className="py-3 px-3 text-right bg-primary/5 text-primary">
                      Tier A++ (Net)
                    </th>
                    <th className="py-3 px-3 text-right bg-surface-raised">
                      Tier A+ (Net)
                    </th>
                    <th className="py-3 px-3 text-right bg-surface-raised">
                      Tier A (Net)
                    </th>
                  </>
                ) : (
                  <th className="py-3 px-3 text-right bg-primary/5 text-primary">
                    Wholesale MRP (List Rate)
                  </th>
                )}
                <th className="py-3 px-3 text-right">Hub Stock</th>
                <th className="py-3 px-3 text-center">Variants</th>
                <th className="py-3 px-3 text-center">Active</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-ink-muted">
                    <span className="material-symbols-outlined text-[36px] mb-2 block text-ink-muted/50">
                      inventory_2
                    </span>
                    No articles match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredArticles.map(art => {
                  const isEditing = editingId === art.id;
                  const isPending = art.pricePending === true;
                  const isExpanded = expandedArticleId === art.id;
                  const variants = (art as any).variants || [];

                  return (
                    <React.Fragment key={art.id}>
                      <tr
                        className={`hover:bg-primary/5 transition-colors ${
                          isEditing ? "bg-primary/10" : ""
                        }`}
                      >
                        {/* Photo Column */}
                        <td className="py-3.5 px-3">
                          <StyleThumbnailCell
                            article={art}
                            onClick={() => setSelectedArticleForImages(art)}
                          />
                        </td>

                        {/* Article # & Title */}
                        <td className="py-3.5 px-4 font-semibold text-ink">
                          <div className="flex items-center gap-2">
                            <span className="font-mono num text-xs px-2 py-0.5 rounded-sm bg-surface-raised border border-border text-ink font-bold">
                              {art.artNumber}
                            </span>
                            <span className="truncate max-w-[220px]" title={art.title}>
                              {art.title}
                            </span>
                          </div>
                        </td>

                        {/* Brand */}
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised border border-border text-ink whitespace-nowrap">
                            {art.brand}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3 text-ink-muted whitespace-nowrap">
                          {art.category}
                        </td>

                        {/* Packing */}
                        <td className="py-3.5 px-3 text-ink-muted whitespace-nowrap">
                          <span className="font-medium text-ink">Box of {art.piecesPerPack || (art as any).pcsPerBox || 10}</span>
                          <span className="text-[10px] text-ink-muted block">({(art as any).boxesPerCase || 60} bx/case)</span>
                        </td>

                        {/* Price Cells */}
                        {canViewTierPricing ? (
                          <>
                            {/* Tier A++ */}
                            <td className="py-3.5 px-3 text-right bg-primary/5 font-semibold font-mono num text-primary">
                              {isEditing ? (
                                <div className="flex items-center justify-end">
                                  <span className="text-ink-muted mr-1">₹</span>
                                  <input
                                    type="number"
                                    value={editApp}
                                    onChange={e => handleAppChange(Number(e.target.value))}
                                    className="w-20 h-8 px-2 text-right text-xs bg-surface border border-primary rounded-sm font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>
                              ) : isPending ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-warning/10 text-warning border border-warning/20">
                                  Price Pending
                                </span>
                              ) : (
                                <span>₹{art.tierAppPrice.toLocaleString("en-IN")}</span>
                              )}
                            </td>

                            {/* Tier A+ */}
                            <td className="py-3.5 px-3 text-right font-semibold font-mono num text-ink">
                              {isEditing ? (
                                <div className="flex items-center justify-end">
                                  <span className="text-ink-muted mr-1">₹</span>
                                  <input
                                    type="number"
                                    value={editAp}
                                    onChange={e => handleApChange(Number(e.target.value))}
                                    className="w-20 h-8 px-2 text-right text-xs bg-surface border border-border rounded-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>
                              ) : isPending ? (
                                <span className="text-ink-muted text-xs font-mono">-</span>
                              ) : (
                                <span>₹{art.tierApPrice.toLocaleString("en-IN")}</span>
                              )}
                            </td>

                            {/* Tier A */}
                            <td className="py-3.5 px-3 text-right font-semibold font-mono num text-ink">
                              {isEditing ? (
                                <div className="flex items-center justify-end">
                                  <span className="text-ink-muted mr-1">₹</span>
                                  <input
                                    type="number"
                                    value={editA}
                                    onChange={e => handleAChange(Number(e.target.value))}
                                    className="w-20 h-8 px-2 text-right text-xs bg-surface border border-border rounded-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                                  />
                                </div>
                              ) : isPending ? (
                                <span className="text-ink-muted text-xs font-mono">-</span>
                              ) : (
                                <span>₹{art.tierAPrice.toLocaleString("en-IN")}</span>
                              )}
                            </td>
                          </>
                        ) : (
                          /* Non-tier viewing (Salesman / Warehouse staff): Standard List Price */
                          <td className="py-3.5 px-3 text-right font-semibold font-mono num text-ink bg-primary/5">
                            {isPending ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-warning/10 text-warning border border-warning/20">
                                Price Pending
                              </span>
                            ) : (
                              <span>₹{(art.tierAppPrice || 350).toLocaleString("en-IN")}</span>
                            )}
                          </td>
                        )}

                        {/* Hub Stock */}
                        <td className="py-3.5 px-3 text-right font-mono num text-ink">
                          <span className="font-semibold">{art.hubStock.toLocaleString("en-IN")} pcs</span>
                          <span className="text-[10px] text-ink-muted block">({art.hubStockBoxes} bx)</span>
                        </td>

                        {/* Variants Breakdown Trigger */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                            className={`px-2 py-1 rounded-sm text-[11px] font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1 mx-auto ${
                              isExpanded
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-surface-raised hover:bg-surface text-ink border-border"
                            }`}
                          >
                            <span>{variants.length || "View"}</span>
                            <span className="material-symbols-outlined text-[14px]">
                              {isExpanded ? "expand_less" : "expand_more"}
                            </span>
                          </button>
                        </td>

                        {/* Active Toggle */}
                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleArticleActive(art)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              art.isActive ? "bg-success" : "bg-surface-raised border border-border"
                            }`}
                            title={art.isActive ? "Active in retailer catalogue" : "Hidden from catalogue"}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-soft-sm ring-0 transition duration-200 ease-in-out ${
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
                                className="px-2.5 py-1 rounded-sm bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-[11px] shadow-soft-sm transition-colors cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={cancelEdit}
                                className="px-2 py-1 rounded-sm bg-surface-raised hover:bg-surface text-ink font-medium text-[11px] transition-colors cursor-pointer border border-border"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : canEditTierPricing ? (
                            <button
                              type="button"
                              onClick={() => startEdit(art)}
                              className="px-3 py-1 rounded-sm bg-surface-raised hover:bg-surface text-ink font-semibold text-xs transition-colors cursor-pointer border border-border"
                            >
                              {isPending ? "Set Price" : "Edit"}
                            </button>
                          ) : (
                            <span className="text-[11px] text-ink-muted font-medium">View only</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Stock Per Variant Drawer / Sub-Table */}
                      {isExpanded && (
                        <tr className="bg-surface-raised/40 border-b border-border">
                          <td colSpan={12} className="p-4">
                            <div className="bg-surface p-4 rounded-md border border-border shadow-soft-xs space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-ink uppercase tracking-wider flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-primary">grid_view</span>
                                  Stock Breakdown per Variant for {art.title}
                                </span>
                                <span className="text-xs text-ink-muted">
                                  Total: <strong>{art.hubStockBoxes} boxes</strong> ({art.hubStock} pcs)
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t border-border">
                                {variants.map((v: any) => (
                                  <div
                                    key={v.id}
                                    className="p-2.5 rounded-sm bg-surface-raised border border-border flex flex-col justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-border"
                                        style={{ backgroundColor: v.shade?.hex || "#475569" }}
                                      />
                                      <span className="font-semibold text-ink truncate text-[11px]">
                                        {v.shade?.name}
                                      </span>
                                    </div>

                                    <div className="flex items-baseline justify-between text-[11px] text-ink-muted">
                                      <span>
                                        {v.fit ? `${v.fit} Fit · ` : ""}
                                        {v.size}
                                      </span>
                                      <span className="font-bold text-primary font-mono num">
                                        {v.stockBoxes} bx
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Inline Edit Error Message Bar */}
        {editError && (
          <div className="p-3 bg-danger/10 border-t border-danger/20 text-danger text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span className="font-medium">{editError}</span>
            </div>
            <span className="text-[11px] text-danger/80 font-semibold uppercase">Rule: A++ &le; A+ &le; A</span>
          </div>
        )}
      </div>

      {/* Brand Logo Upload Modal */}
      <BrandLogoUploadModal
        brand={selectedBrandForLogo}
        isOpen={Boolean(selectedBrandForLogo)}
        onClose={() => setSelectedBrandForLogo(null)}
      />

      {/* Product Style & Colour Images Upload Modal */}
      <ProductImageUploadModal
        article={selectedArticleForImages}
        isOpen={Boolean(selectedArticleForImages)}
        onClose={() => setSelectedArticleForImages(null)}
      />
    </div>
  );
};
