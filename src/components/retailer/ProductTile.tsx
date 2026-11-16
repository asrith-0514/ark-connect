"use client";

import React from "react";
import { Icon } from "@/components/ui/Icon";
import { useEntityImages } from "@/lib/storage/imageStore";

export interface BrandColorMeta {
  hex: string;
  bgLight: string;
  textLight: string;
  badge: string;
  monogram: string;
}

export const CANONICAL_BRAND_META: Record<string, BrandColorMeta> = {
  flybirds: {
    hex: "#2F6BFF",
    bgLight: "bg-[#2F6BFF]/10",
    textLight: "text-[#2F6BFF]",
    badge: "border-[#2F6BFF]/30 bg-[#2F6BFF]/10 text-[#2F6BFF]",
    monogram: "FB",
  },
  flycute: {
    hex: "#E11D48",
    bgLight: "bg-[#E11D48]/10",
    textLight: "text-[#E11D48]",
    badge: "border-[#E11D48]/30 bg-[#E11D48]/10 text-[#E11D48]",
    monogram: "FC",
  },
  loveit: {
    hex: "#7C3AED",
    bgLight: "bg-[#7C3AED]/10",
    textLight: "text-[#7C3AED]",
    badge: "border-[#7C3AED]/30 bg-[#7C3AED]/10 text-[#7C3AED]",
    monogram: "LV",
  },
  within: {
    hex: "#0D9488",
    bgLight: "bg-[#0D9488]/10",
    textLight: "text-[#0D9488]",
    badge: "border-[#0D9488]/30 bg-[#0D9488]/10 text-[#0D9488]",
    monogram: "WT",
  },
  aswati: {
    hex: "#D97706",
    bgLight: "bg-[#D97706]/10",
    textLight: "text-[#D97706]",
    badge: "border-[#D97706]/30 bg-[#D97706]/10 text-[#D97706]",
    monogram: "AS",
  },
  ira: {
    hex: "#DB2777",
    bgLight: "bg-[#DB2777]/10",
    textLight: "text-[#DB2777]",
    badge: "border-[#DB2777]/30 bg-[#DB2777]/10 text-[#DB2777]",
    monogram: "IR",
  },
  jyothika: {
    hex: "#4F46E5",
    bgLight: "bg-[#4F46E5]/10",
    textLight: "text-[#4F46E5]",
    badge: "border-[#4F46E5]/30 bg-[#4F46E5]/10 text-[#4F46E5]",
    monogram: "JY",
  },
};

export function getBrandMeta(brandNameOrId: string): BrandColorMeta {
  const normalized = (brandNameOrId || "").toLowerCase().trim().replace(/[^a-z]/g, "");
  for (const [key, meta] of Object.entries(CANONICAL_BRAND_META)) {
    if (normalized.includes(key)) {
      return meta;
    }
  }
  return CANONICAL_BRAND_META.flybirds;
}

export function getCategoryIconName(category: string): string {
  const c = (category || "").toLowerCase();
  if (c.includes("legging") || c.includes("pant") || c.includes("bottom")) return "straighten";
  if (c.includes("petticoat") || c.includes("shaper") || c.includes("skirt")) return "styler";
  if (c.includes("bra")) return "checkroom";
  if (c.includes("pantie") || c.includes("panty") || c.includes("brief")) return "dry_cleaning";
  return "checkroom";
}

export function BrandMonogramCircle({
  brandName,
  size = 56,
  isActive = false,
  onClick,
}: {
  brandName: string;
  size?: number;
  isActive?: boolean;
  onClick?: () => void;
}) {
  const meta = getBrandMeta(brandName);
  const { primaryUrl } = useEntityImages("brand", brandName.toLowerCase());

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
    >
      <div
        style={{ width: size, height: size }}
        className={`rounded-full p-0.5 transition-all duration-200 bg-surface shadow-soft-sm flex items-center justify-center overflow-hidden border ${
          isActive
            ? "border-primary ring-2 ring-primary/20 scale-105"
            : "border-border group-hover:border-primary/50 group-hover:scale-105"
        }`}
      >
        {primaryUrl ? (
          <img
            src={primaryUrl}
            alt={brandName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div
            className={`w-full h-full rounded-full ${meta.bgLight} ${meta.textLight} font-bold flex items-center justify-center font-mono select-none text-sm tracking-wider`}
            style={{ color: meta.hex }}
          >
            {meta.monogram}
          </div>
        )}
      </div>
      <span className="text-xs font-medium text-ink group-hover:text-primary transition-colors truncate max-w-[72px] text-center">
        {brandName}
      </span>
    </button>
  );
}

export function ProductTile({
  productId,
  brand,
  category,
  title,
  pcsPerBox,
  className = "",
  aspectRatio = "aspect-square",
}: {
  productId: string;
  brand: string;
  category: string;
  title: string;
  pcsPerBox?: number;
  className?: string;
  aspectRatio?: string;
}) {
  const { primaryUrl } = useEntityImages("style", productId);
  const meta = getBrandMeta(brand);
  const iconName = getCategoryIconName(category);

  if (primaryUrl) {
    return (
      <div className={`relative w-full ${aspectRatio} rounded-lg overflow-hidden bg-surface-raised border border-border ${className}`}>
        <img
          src={primaryUrl}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-out"
        />
        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded bg-surface/90 backdrop-blur-md text-[11px] font-mono font-bold text-ink shadow-soft-xs border border-border">
            {brand}
          </span>
        </div>
      </div>
    );
  }

  // Neutral Branded Tile (Zero unrelated photos)
  return (
    <div
      className={`relative w-full ${aspectRatio} rounded-lg overflow-hidden border border-border flex flex-col justify-between p-3 select-none transition-transform duration-200 group-hover:border-primary/40 ${className}`}
      style={{
        background: `radial-gradient(circle at 80% 20%, ${meta.hex}18 0%, var(--surface) 70%)`,
      }}
    >
      {/* Top Header: Brand Monogram + Category Icon */}
      <div className="flex items-center justify-between w-full">
        <span
          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider border ${meta.badge}`}
        >
          {brand}
        </span>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${meta.hex}15`, color: meta.hex }}
        >
          <Icon name={iconName} size={16} />
        </div>
      </div>

      {/* Center Silhouette / Graphic Display */}
      <div className="flex flex-col items-center justify-center py-2 flex-1 text-center">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-soft-xs mb-1.5 transition-transform group-hover:scale-110"
          style={{ backgroundColor: `${meta.hex}20`, color: meta.hex }}
        >
          <Icon name={iconName} size={26} />
        </div>
        <span className="text-xs font-semibold text-ink line-clamp-1 max-w-[90%]">
          {category}
        </span>
      </div>

      {/* Bottom Pack Size Strip */}
      <div className="flex items-center justify-between pt-1.5 border-t border-border/60 text-[11px] text-ink-muted">
        <span className="font-mono text-[10px]">
          {pcsPerBox ? `Box of ${pcsPerBox}` : "Master pack"}
        </span>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: meta.hex }}
        />
      </div>
    </div>
  );
}
