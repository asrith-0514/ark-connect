"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { TierPricingArticle, MOCK_BRANDS, Brand, MOCK_PRODUCTS } from "@/data/mockData";
import { CATEGORIES_CONFIG } from "@/lib/mock/catalogueConfig";
import { imageStore, useEntityImages } from "@/lib/storage/imageStore";
import { BrandLogoUploadModal } from "@/components/distributor/BrandLogoUploadModal";
import { ProductImageUploadModal } from "@/components/distributor/ProductImageUploadModal";
import { ColorSizeStockMatrix } from "@/components/distributor/ColorSizeStockMatrix";

export function getBrandCategory(art: TierPricingArticle): string {
  const brand = art.brand.toLowerCase();
  const artNum = art.artNumber.toUpperCase();
  const title = art.title.toLowerCase();

  if (brand.includes("flybirds")) {
    if (artNum.includes("ANKLE") || title.includes("ankle")) return "Ankle leggings";
    if (artNum.includes("FULL") || title.includes("full length")) return "Full length leggings";
    if (artNum.includes("SHIM") || title.includes("shimmer")) return "Shimmer leggings";
    if (artNum.includes("SAREE") || title.includes("saree")) return "Saree shaper";
    if (artNum.includes("KURTI") || title.includes("kurti")) return "Kurti pant";
    if (artNum.includes("JR") || title.includes("junior")) return "Junior leggings";
    return "Leggings";
  }

  if (brand.includes("flycute")) {
    if (artNum.includes("ANKLE") || title.includes("ankle")) return "Ankle leggings";
    if (artNum.includes("FULL") || title.includes("full length")) return "Full length leggings";
    if (artNum.includes("SHIM") || title.includes("shimmer")) return "Shimmer leggings";
    if (artNum.includes("KURTI") || title.includes("kurti")) return "Kurti pants";
    return "Leggings";
  }

  if (brand.includes("loveit")) {
    if (artNum.includes("ANKLE") || title.includes("ankle")) return "Ankle leggings";
    if (artNum.includes("FULL") || title.includes("full length")) return "Full length leggings";
    if (artNum.includes("SHIM") || title.includes("shimmer")) return "Shimmer leggings";
    if (artNum.includes("KURTI") || title.includes("kurti")) return "Kurti pants";
    return "Leggings";
  }

  if (brand.includes("ira") || brand.includes("jyothika")) {
    if (artNum.includes("PLAIN") || title.includes("plain")) return "Plain Petticoat";
    if (artNum.includes("BRA") || title.includes("bra")) return "Bra Petticoat";
    return "Petticoats";
  }

  if (brand.includes("within") || brand.includes("aswati")) {
    if (art.category === "Bras" || title.includes("bra")) return "Bras";
    if (art.category === "Panties" || title.includes("pantie") || title.includes("panty")) return "Panties";
    return art.category;
  }

  if (brand.includes("rr")) {
    if (art.category === "T-shirts" || artNum.includes("RNT") || title.includes("t shirt") || title.includes("t-shirt")) return "T-shirts";
    return "Pants";
  }

  return art.category;
}

function getCategoryIcon(catName: string): string {
  const c = catName.toLowerCase();
  if (c.includes("shimmer")) return "auto_awesome";
  if (c.includes("ankle") || c.includes("full") || c.includes("legging") || c.includes("pant") || c.includes("short")) {
    return "checkroom";
  }
  if (c.includes("saree") || c.includes("petticoat")) return "styler";
  if (c.includes("bra") || c.includes("pantie")) return "favorite";
  if (c.includes("t-shirt") || c.includes("shirt")) return "apparel";
  return "category";
}

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
            <Icon name="add_a_photo" size={16} className="text-ink-muted" />
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
            <Icon name="image" size={13} />
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
            <Icon name="warning" size={11} />
            <span>No Photos</span>
          </button>
        )}
      </div>
    </div>
  );
}

function BrandLogoChip({
  brand,
  isSelected,
  onSelectBrand,
  onUploadLogo,
}: {
  brand: Brand;
  isSelected: boolean;
  onSelectBrand: () => void;
  onUploadLogo: () => void;
}) {
  const { primaryUrl } = useEntityImages("brand", brand.id);
  const displayImage = primaryUrl || brand.logo || brand.image;

  return (
    <div
      role="button"
      tabIndex={0}
      data-brand-name={brand.name}
      onClick={onSelectBrand}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectBrand();
        }
      }}
      className={`p-1.5 pr-2.5 rounded-full border flex items-center gap-2 shadow-soft-xs transition-all cursor-pointer group shrink-0 select-none ${
        isSelected
          ? "bg-primary/10 border-primary ring-2 ring-primary/30 text-primary font-bold shadow-soft-sm"
          : "bg-surface hover:bg-surface-raised border-border text-ink hover:border-primary/40"
      }`}
      title={`Open ${brand.name} inventory`}
    >
      <div
        className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-[10px] shadow-soft-xs shrink-0"
        style={{
          backgroundColor: !displayImage
            ? brand.colorHex || brand.accentColor || "#2F6BFF"
            : undefined,
        }}
      >
        {displayImage ? (
          <img src={displayImage} alt={brand.name} className="w-full h-full object-contain rounded-full bg-white p-0.5" />
        ) : (
          <span>{brand.name.substring(0, 2).toUpperCase()}</span>
        )}
      </div>
      <span className="text-xs font-semibold">{brand.name}</span>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onUploadLogo();
        }}
        className="p-1 rounded-full hover:bg-surface-raised text-ink-muted hover:text-primary transition-colors cursor-pointer"
        title={`Change logo for ${brand.name}`}
      >
        <Icon name="camera_alt" size={13} />
      </button>
    </div>
  );
}

export const DistributorProducts: React.FC = () => {
  const { tierArticles, updateTierArticle } = useApp();
  const { hasPermission } = useAuth();
  const canViewTierPricing = hasPermission("canViewTierPricing");
  const canEditTierPricing = hasPermission("canEditTierPricing");

  const searchParams = useSearchParams();
  const urlBrand = searchParams?.get("brand");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(urlBrand || "all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrandCategory, setSelectedBrandCategory] = useState("all");
  const [filterWithoutPhotos, setFilterWithoutPhotos] = useState(false);
  const [stylesWithPhotos, setStylesWithPhotos] = useState<Set<string>>(new Set());
  const [expandedArticleId, setExpandedArticleId] = useState<string | null>(null);
  const [stockMatrixArticle, setStockMatrixArticle] = useState<TierPricingArticle | null>(null);
  const [inventoryViewMode, setInventoryViewMode] = useState<"catalog" | "stock_tracker">("catalog");
  const [stockTrackerSelectedStyleId, setStockTrackerSelectedStyleId] = useState<string>("");

  useEffect(() => {
    if (urlBrand) {
      setSelectedBrand(urlBrand);
    }
  }, [urlBrand]);

  // Active brand object if a specific brand is selected
  const currentBrandObj = useMemo(() => {
    if (selectedBrand === "all") return null;
    return MOCK_BRANDS.find(b => b.name.toLowerCase() === selectedBrand.toLowerCase()) || null;
  }, [selectedBrand]);

  // Articles belonging to the selected brand
  const brandArticles = useMemo(() => {
    if (selectedBrand === "all") return [];
    return tierArticles.filter(a => a.brand.toLowerCase() === selectedBrand.toLowerCase());
  }, [tierArticles, selectedBrand]);

  // Unique categories for the selected brand
  const brandCategories = useMemo(() => {
    if (selectedBrand === "all") return [];
    const set = new Set<string>();
    brandArticles.forEach(a => set.add(getBrandCategory(a)));
    return Array.from(set);
  }, [selectedBrand, brandArticles]);

  const getCategorySummary = (catName: string, arts: TierPricingArticle[]) => {
    const catArticles = arts.filter(a => getBrandCategory(a) === catName);
    const totalBoxes = catArticles.reduce((s, a) => s + (a.hubStockBoxes || 0), 0);
    const totalPcs = catArticles.reduce((s, a) => s + (a.hubStock || 0), 0);
    const activeCount = catArticles.filter(a => a.isActive).length;

    let totalShades = 0;
    let sizesList: string[] = [];
    const firstArt = catArticles[0];
    const packDetails = firstArt?.packSize || "Box of 6";
    const piecesPerPack = firstArt?.piecesPerPack || (firstArt as any)?.pcsPerBox || 6;

    catArticles.forEach(a => {
      const prod = MOCK_PRODUCTS.find(p => p.id === a.id || p.artNumber === a.artNumber);
      if (prod) {
        if (prod.shades && prod.shades.length > totalShades) {
          totalShades = prod.shades.length;
        }
        if (prod.sizes && prod.sizes.length > 0) {
          sizesList = prod.sizes;
        }
      }
    });

    const prices = catArticles.filter(a => !a.pricePending && a.tierAppPrice).map(a => a.tierAppPrice);
    const minA = prices.length > 0 ? Math.min(...prices) : 0;
    const maxA = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      catName,
      articles: catArticles,
      articleCount: catArticles.length,
      totalBoxes,
      totalPcs,
      activeCount,
      totalShades,
      sizes: sizesList.length > 0 ? `${sizesList[0]} to ${sizesList[sizesList.length - 1]}` : "M to 3XL",
      packDetails: `${piecesPerPack} pcs/pack (${packDetails})`,
      priceRange: minA > 0 ? (minA === maxA ? `₹${minA}` : `₹${minA} – ₹${maxA}`) : "Confirmation awaited",
    };
  };

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
    if (selectedBrand !== "all") {
      if (selectedBrandCategory !== "all" && getBrandCategory(art) !== selectedBrandCategory) {
        return false;
      }
    } else {
      if (selectedCategory !== "all" && art.category !== selectedCategory) {
        return false;
      }
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
        art.category.toLowerCase().includes(q) ||
        getBrandCategory(art).toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const activeStockTrackerArticle = useMemo(() => {
    if (stockTrackerSelectedStyleId) {
      const found = tierArticles.find(a => a.id === stockTrackerSelectedStyleId);
      if (found) return found;
    }
    return filteredArticles[0] || tierArticles[0] || null;
  }, [stockTrackerSelectedStyleId, tierArticles, filteredArticles]);

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
        {selectedBrand === "all" ? (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
              <span>Catalogue</span>
              <Icon name="chevron_right" size={14} />
              <span className="text-ink font-bold">Inventory &amp; Stock</span>
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight mt-1">
              Inventory &amp; Stock Management
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Real product inventory across all 8 mill brands. Every item is box-packed with Tier A++ &le; Tier A+ &le; Tier A pricing.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand("all");
                  setSelectedBrandCategory("all");
                }}
                className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Inventory</span>
              </button>
              <Icon name="chevron_right" size={14} />
              <span className="text-ink font-bold">{currentBrandObj?.name || selectedBrand}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5">
              <div
                className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center text-white font-bold text-xs shadow-soft-xs shrink-0"
                style={{
                  backgroundColor: currentBrandObj?.colorHex || currentBrandObj?.accentColor || "#2F6BFF",
                }}
              >
                {currentBrandObj?.logo || currentBrandObj?.image ? (
                  <img src={currentBrandObj.logo || currentBrandObj.image} alt={selectedBrand} className="w-full h-full object-contain p-1 bg-white" />
                ) : (
                  <span>{selectedBrand.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
                  <span>{currentBrandObj?.name || selectedBrand}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono font-semibold">
                    {currentBrandObj?.shortCode || "BRAND"}
                  </span>
                </h1>
                <p className="text-xs text-ink-muted mt-0.5">
                  Category-wise inventory, pack configurations &amp; warehouse stock for {currentBrandObj?.name || selectedBrand}.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {selectedBrand !== "all" && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand("all");
                  setSelectedBrandCategory("all");
                }}
                className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-raised text-ink font-semibold text-xs transition-colors flex items-center gap-1.5 border border-border shadow-soft-sm cursor-pointer"
              >
                <Icon name="arrow_back" size={15} />
                <span>All Brands</span>
              </button>
              {currentBrandObj && (
                <button
                  type="button"
                  onClick={() => setSelectedBrandForLogo(currentBrandObj)}
                  className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-raised text-ink font-semibold text-xs transition-colors flex items-center gap-1.5 border border-border shadow-soft-sm cursor-pointer"
                >
                  <Icon name="camera_alt" size={15} />
                  <span>Logo</span>
                </button>
              )}
            </>
          )}
          {/* View Mode Switcher: Catalog & Pricing vs Color & Size Stock Tracker */}
          <div className="flex items-center bg-surface border border-border rounded-lg p-0.5 shadow-soft-xs">
            <button
              type="button"
              onClick={() => setInventoryViewMode("catalog")}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                inventoryViewMode === "catalog"
                  ? "bg-primary text-white shadow-soft-xs"
                  : "text-ink hover:text-primary"
              }`}
            >
              <Icon name="table_rows" size={15} />
              <span>Catalog &amp; Pricing</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setInventoryViewMode("stock_tracker");
                if (!stockTrackerSelectedStyleId && filteredArticles.length > 0) {
                  setStockTrackerSelectedStyleId(filteredArticles[0].id);
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                inventoryViewMode === "stock_tracker"
                  ? "bg-primary text-white shadow-soft-xs"
                  : "text-ink hover:text-primary"
              }`}
            >
              <Icon name="palette" size={15} />
              <span>Color &amp; Size Tracker</span>
            </button>
          </div>

          <button
            type="button"
            onClick={exportCSV}
            className="px-3.5 py-2 rounded-lg bg-surface hover:bg-surface-raised text-ink font-semibold text-xs transition-colors flex items-center gap-1.5 border border-border shadow-soft-sm cursor-pointer"
          >
            <Icon name="download" size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Inventory Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {selectedBrand === "all" ? (
          <>
            <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm">
              <span className="text-xs font-semibold text-ink-muted">Total Styles</span>
              <div className="text-2xl font-bold font-mono num text-ink mt-1">
                {tierArticles.length}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                Across {MOCK_BRANDS.length} Mill Brands
              </span>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm">
              <span className="text-xs font-semibold text-ink-muted">Active in Catalogue</span>
              <div className="text-2xl font-bold font-mono num text-success mt-1">
                {activeCount}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                Retailer Portal Enabled
              </span>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm">
              <span className="text-xs font-semibold text-ink-muted">Price Pending</span>
              <div className="text-2xl font-bold font-mono num text-warning mt-1">
                {pendingCount}
              </div>
              <span className="text-[11px] text-warning mt-1 block font-semibold">
                Rate confirmation awaited
              </span>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm">
              <span className="text-xs font-semibold text-ink-muted">Total Hub Stock</span>
              <div className="text-2xl font-bold font-mono num text-primary mt-1">
                {tierArticles.reduce((s, a) => s + (a.hubStockBoxes || 0), 0).toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                Boxes in Warehouse
              </span>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm">
              <span className="text-xs font-semibold text-ink-muted">Brand Categories</span>
              <div className="text-2xl font-bold font-mono num text-ink mt-1">
                {brandCategories.length}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                Product Lines in {currentBrandObj?.name || selectedBrand}
              </span>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm">
              <span className="text-xs font-semibold text-ink-muted">Active Styles</span>
              <div className="text-2xl font-bold font-mono num text-success mt-1">
                {brandArticles.filter(a => a.isActive).length} / {brandArticles.length}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                Live on Retailer Portal
              </span>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm">
              <span className="text-xs font-semibold text-ink-muted">Brand Hub Stock</span>
              <div className="text-2xl font-bold font-mono num text-primary mt-1">
                {brandArticles.reduce((s, a) => s + (a.hubStockBoxes || 0), 0).toLocaleString("en-IN")}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                Boxes in Secunderabad Hub
              </span>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm">
              <span className="text-xs font-semibold text-ink-muted">Rate Confirmation</span>
              <div className="text-2xl font-bold font-mono num text-ink mt-1">
                {brandArticles.some(a => a.pricePending) ? (
                  <span className="text-warning">Pending</span>
                ) : (
                  <span className="text-success">Active</span>
                )}
              </div>
              <span className="text-[11px] text-ink-muted mt-1 block">
                {brandArticles.some(a => a.pricePending)
                  ? `${brandArticles.filter(a => a.pricePending).length} rates awaited`
                  : "All Tier Rates confirmed"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Brand Selector Strip */}
      <div className="p-3 bg-surface rounded-xl border border-border shadow-soft-sm flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0 pl-1">
          <Icon name="verified" size={17} className="text-primary" />
          <span className="text-xs font-bold text-ink uppercase tracking-wider">
            Brands:
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {/* All Brands Chip */}
          <button
            type="button"
            onClick={() => {
              setSelectedBrand("all");
              setSelectedBrandCategory("all");
            }}
            className={`p-1.5 px-3 rounded-full border flex items-center gap-1.5 shadow-soft-xs transition-all cursor-pointer shrink-0 text-xs font-bold ${
              selectedBrand === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-soft-sm"
                : "bg-surface hover:bg-surface-raised border-border text-ink hover:border-primary/40"
            }`}
          >
            <Icon name="apps" size={14} />
            <span>All Brands</span>
          </button>

          {/* Individual Brand Chips */}
          {MOCK_BRANDS.map((brand: Brand) => (
            <BrandLogoChip
              key={brand.id}
              brand={brand}
              isSelected={selectedBrand.toLowerCase() === brand.name.toLowerCase()}
              onSelectBrand={() => {
                if (selectedBrand.toLowerCase() === brand.name.toLowerCase()) {
                  setSelectedBrand("all");
                  setSelectedBrandCategory("all");
                } else {
                  setSelectedBrand(brand.name);
                  setSelectedBrandCategory("all");
                }
              }}
              onUploadLogo={() => setSelectedBrandForLogo(brand)}
            />
          ))}
        </div>
      </div>

      {/* Brand Category Cards Grid (Visible when a specific brand is selected) */}
      {selectedBrand !== "all" && brandCategories.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon name="category" size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-ink">
                {currentBrandObj?.name || selectedBrand} Categories ({brandCategories.length})
              </h3>
            </div>
            {selectedBrandCategory !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedBrandCategory("all")}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Icon name="close" size={13} />
                <span>Show All Categories</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {brandCategories.map(catName => {
              const summary = getCategorySummary(catName, brandArticles);
              const isSelected = selectedBrandCategory === catName;
              const icon = getCategoryIcon(catName);

              return (
                <div
                  key={catName}
                  onClick={() => setSelectedBrandCategory(isSelected ? "all" : catName)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group relative overflow-hidden ${
                    isSelected
                      ? "bg-primary/10 border-primary ring-2 ring-primary/30 shadow-soft-sm"
                      : "bg-surface hover:bg-surface-raised border-border hover:border-primary/40 shadow-soft-xs"
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors"
                        }`}
                      >
                        <Icon name={icon} size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-ink group-hover:text-primary transition-colors">
                          {catName}
                        </h4>
                        <span className="text-[11px] text-ink-muted">
                          {summary.articleCount} {summary.articleCount === 1 ? "style" : "styles"}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shadow-soft-xs shrink-0">
                        Selected
                      </span>
                    ) : summary.totalShades > 0 ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised border border-border text-ink-muted shrink-0">
                        {summary.totalShades} shades
                      </span>
                    ) : null}
                  </div>

                  {/* Middle specs */}
                  <div className="space-y-1 text-xs text-ink-muted bg-background/50 p-2.5 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Packing:</span>
                      <span className="font-semibold text-ink font-mono">{summary.packDetails}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Sizes:</span>
                      <span className="font-semibold text-ink">{summary.sizes}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-ink-muted">Hub Stock:</span>
                      <span className="font-bold text-primary font-mono">{summary.totalBoxes.toLocaleString("en-IN")} boxes</span>
                    </div>
                  </div>

                  {/* Bottom pricing */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <span className="text-[11px] text-ink-muted">Tier A++ (Net):</span>
                    <span className="text-xs font-bold font-mono text-ink num">
                      {summary.priceRange}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Tree Navigation / Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-surface rounded-xl border border-border shadow-soft-sm">
        {selectedBrand === "all" ? (
          <>
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setSelectedBrandCategory("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBrandCategory === "all"
                  ? "bg-primary text-primary-foreground shadow-soft-xs"
                  : "bg-surface-raised hover:bg-surface text-ink"
              }`}
            >
              <Icon name="apps" size={14} />
              <span>All {currentBrandObj?.name || selectedBrand} Categories</span>
              <span className="text-[10px] font-mono opacity-80 num">({brandArticles.length})</span>
            </button>
            {brandCategories.map(catName => {
              const count = brandArticles.filter(a => getBrandCategory(a) === catName).length;
              return (
                <button
                  key={catName}
                  type="button"
                  onClick={() => setSelectedBrandCategory(catName)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    selectedBrandCategory === catName
                      ? "bg-primary text-primary-foreground shadow-soft-xs"
                      : "bg-surface-raised hover:bg-surface text-ink"
                  }`}
                >
                  <Icon name={getCategoryIcon(catName)} size={14} />
                  <span>{catName}</span>
                  <span className="text-[10px] font-mono opacity-80 num">({count})</span>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 bg-surface rounded-md border border-border shadow-soft-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Icon name="search" size={18} className="absolute left-3 top-2.5 text-ink-muted" />
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
            onChange={e => {
              setSelectedBrand(e.target.value);
              setSelectedBrandCategory("all");
            }}
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
          <Icon name="check_circle" size={18} />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Products & Tier Pricing Table OR Color & Size Stock Tracker */}
      {inventoryViewMode === "stock_tracker" ? (
        <div className="flex flex-col gap-4">
          {/* Style Selector Toolbar */}
          <div className="p-4 bg-surface rounded-xl border border-border shadow-soft-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <Icon name="palette" size={18} className="text-primary" />
                <span className="text-xs font-bold text-ink whitespace-nowrap">
                  Select Article to Track:
                </span>
              </div>
              <select
                value={activeStockTrackerArticle?.id || ""}
                onChange={e => setStockTrackerSelectedStyleId(e.target.value)}
                className="flex-1 max-w-xl h-10 px-3 text-xs bg-surface-raised border border-border rounded-md text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                {filteredArticles.map(art => (
                  <option key={art.id} value={art.id}>
                    {art.artNumber} - {art.title} ({art.brand}) · {art.hubStockBoxes.toLocaleString("en-IN")} boxes
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <span>Showing {filteredArticles.length} matching styles in active filters</span>
            </div>
          </div>

          {activeStockTrackerArticle ? (
            <ColorSizeStockMatrix
              article={activeStockTrackerArticle}
              onSave={(updatedVariants, newTotalBoxes, newTotalPieces) => {
                updateTierArticle(activeStockTrackerArticle.id, {
                  variants: updatedVariants,
                  hubStockBoxes: newTotalBoxes,
                  hubStock: newTotalPieces,
                });
                setSaveSuccessMsg(`Stock updated for ${activeStockTrackerArticle.title}: ${newTotalBoxes.toLocaleString("en-IN")} boxes (${newTotalPieces.toLocaleString("en-IN")} pcs)`);
                setTimeout(() => setSaveSuccessMsg(null), 3500);
              }}
            />
          ) : (
            <div className="p-12 bg-surface rounded-xl border border-border text-center text-ink-muted">
              <Icon name="inventory_2" size={32} className="mx-auto mb-2 opacity-50" />
              <p className="font-semibold text-sm">No styles match your brand or category filter.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-md shadow-soft-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead className="sticky top-0 z-10 bg-surface-raised border-b border-border select-none">
              <tr className="text-ink-muted text-[11px] uppercase tracking-wider font-bold font-mono">
                <th className="py-2.5 px-3">Photo</th>
                <th className="py-2.5 px-4">Article # &amp; Title</th>
                <th className="py-2.5 px-3">Brand</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Packing</th>
                {canViewTierPricing ? (
                  <>
                    <th className="py-2.5 px-3 text-right bg-primary/5 text-primary">
                      Tier A++ (Net)
                    </th>
                    <th className="py-2.5 px-3 text-right bg-surface-raised">
                      Tier A+ (Net)
                    </th>
                    <th className="py-2.5 px-3 text-right bg-surface-raised">
                      Tier A (Net)
                    </th>
                  </>
                ) : (
                  <th className="py-2.5 px-3 text-right bg-primary/5 text-primary">
                    Wholesale MRP (List Rate)
                  </th>
                )}
                <th className="py-2.5 px-3 text-right">Hub Stock</th>
                <th className="py-2.5 px-3 text-center min-w-[130px]">Color &amp; Size Stock</th>
                <th className="py-2.5 px-3 text-center">Active</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12">
                    <EmptyState
                      icon={<Icon name="inventory_2" size={24} />}
                      title="No articles match the selected filters"
                      description="Try clearing your search query or brand filter."
                    />
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
                        <td className="py-2.5 sm:py-3 px-3">
                          <StyleThumbnailCell
                            article={art}
                            onClick={() => setSelectedArticleForImages(art)}
                          />
                        </td>

                        {/* Article # & Title */}
                        <td className="py-2.5 sm:py-3 px-4 font-semibold text-ink">
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
                        <td className="py-2.5 sm:py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised border border-border text-ink whitespace-nowrap">
                            {art.brand}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-2.5 sm:py-3 px-3 text-ink-muted whitespace-nowrap">
                          <span className="font-semibold text-ink block">{getBrandCategory(art)}</span>
                          <span className="text-[10px] text-ink-muted block">{art.category}</span>
                        </td>

                        {/* Packing */}
                        <td className="py-2.5 sm:py-3 px-3 text-ink-muted whitespace-nowrap">
                          <span className="font-medium text-ink">Box of {art.piecesPerPack || (art as any).pcsPerBox || 10}</span>
                          <span className="text-[10px] text-ink-muted block font-mono">({(art as any).boxesPerCase || 60} bx/case)</span>
                        </td>

                        {/* Price Cells */}
                        {canViewTierPricing ? (
                          <>
                            {/* Tier A++ */}
                            <td className="py-2.5 sm:py-3 px-3 text-right bg-primary/5 font-semibold font-mono num text-primary">
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
                            <td className="py-2.5 sm:py-3 px-3 text-right font-semibold font-mono num text-ink">
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
                            <td className="py-2.5 sm:py-3 px-3 text-right font-semibold font-mono num text-ink">
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
                          <td className="py-2.5 sm:py-3 px-3 text-right font-semibold font-mono num text-ink bg-primary/5">
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
                        <td className="py-2.5 sm:py-3 px-3 text-right font-mono num text-ink">
                          <span className="font-semibold">{art.hubStockBoxes.toLocaleString("en-IN")} boxes</span>
                        </td>

                        {/* Color & Size Stock Trigger */}
                        <td className="py-2.5 sm:py-3 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setExpandedArticleId(isExpanded ? null : art.id)}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 shadow-soft-xs ${
                                isExpanded
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-surface-raised hover:bg-surface text-ink border-border hover:border-primary/40"
                              }`}
                              title={isExpanded ? "Collapse Color & Size Matrix" : "Expand Color & Size Stock Matrix"}
                            >
                              <Icon name="palette" size={13} className={isExpanded ? "text-white" : "text-primary"} />
                              <span>Track Stock</span>
                              <Icon name={isExpanded ? "expand_less" : "expand_more"} size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setStockMatrixArticle(art)}
                              className="p-1 rounded-md bg-surface-raised hover:bg-primary/10 text-ink-muted hover:text-primary border border-border hover:border-primary/40 transition-colors cursor-pointer"
                              title="Open Fullscreen Color & Size Stock Matrix"
                            >
                              <Icon name="open_in_full" size={13} />
                            </button>
                          </div>
                        </td>

                        {/* Active Toggle */}
                        <td className="py-2.5 sm:py-3 px-3 text-center">
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
                        <td className="py-2.5 sm:py-3 px-4 text-right whitespace-nowrap">
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
                          <td colSpan={12} className="p-3 sm:p-4">
                            <ColorSizeStockMatrix
                              article={art}
                              onSave={(updatedVariants, newTotalBoxes, newTotalPieces) => {
                                updateTierArticle(art.id, {
                                  variants: updatedVariants,
                                  hubStockBoxes: newTotalBoxes,
                                  hubStock: newTotalPieces,
                                });
                                setSaveSuccessMsg(`Stock updated for ${art.title}: ${newTotalBoxes.toLocaleString("en-IN")} boxes (${newTotalPieces.toLocaleString("en-IN")} pcs)`);
                                setTimeout(() => setSaveSuccessMsg(null), 3500);
                              }}
                            />
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
              <Icon name="error" size={16} />
              <span className="font-medium">{editError}</span>
            </div>
            <span className="text-[11px] text-danger/80 font-semibold uppercase">Rule: A++ &le; A+ &le; A</span>
          </div>
        )}
      </div>
      )}

      {/* Fullscreen Color & Size Stock Matrix Modal */}
      {stockMatrixArticle && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
          onClick={() => setStockMatrixArticle(null)}
        >
          <div
            className="bg-surface rounded-2xl border border-border shadow-soft-xl w-full max-w-6xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <ColorSizeStockMatrix
              article={stockMatrixArticle}
              isModal
              onClose={() => setStockMatrixArticle(null)}
              onSave={(updatedVariants, newTotalBoxes, newTotalPieces) => {
                updateTierArticle(stockMatrixArticle.id, {
                  variants: updatedVariants,
                  hubStockBoxes: newTotalBoxes,
                  hubStock: newTotalPieces,
                });
                setStockMatrixArticle(prev => prev ? {
                  ...prev,
                  variants: updatedVariants,
                  hubStockBoxes: newTotalBoxes,
                  hubStock: newTotalPieces,
                } : null);
                setSaveSuccessMsg(`Stock updated for ${stockMatrixArticle.title}: ${newTotalBoxes.toLocaleString("en-IN")} boxes (${newTotalPieces.toLocaleString("en-IN")} pcs)`);
                setTimeout(() => setSaveSuccessMsg(null), 3500);
              }}
            />
          </div>
        </div>
      )}

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
