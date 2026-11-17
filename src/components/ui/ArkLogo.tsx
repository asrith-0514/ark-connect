"use client";

import React from "react";

export type LogoVariant = "gradient" | "mono";

export interface ArkMonogramProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: number | string;
  variant?: LogoVariant;
  className?: string;
}

/**
 * Official ARK Distributors Brand Monogram
 * Displays the authentic vibrant geometric ARK logo icon.
 */
export function ArkMonogram({
  size = 32,
  variant = "gradient",
  className = "",
  ...props
}: ArkMonogramProps) {
  const pixelSize = typeof size === "number" ? size : parseInt(String(size), 10) || 32;

  return (
    <div
      style={{ width: pixelSize, height: pixelSize }}
      className={`rounded-lg overflow-hidden shrink-0 select-none bg-white p-0.5 shadow-soft-xs flex items-center justify-center border border-border/50 ${className}`}
      {...props}
    >
      <img
        src="/logos/ark-distributors.jpg"
        alt="ARK"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export interface ArkWordmarkProps extends React.HTMLAttributes<HTMLDivElement> {
  product?: "Connect" | "Backoffice" | "default";
  variant?: LogoVariant;
  size?: "sm" | "md" | "lg";
  withTagline?: boolean;
}

/**
 * Wordmark lockup for "ARK Connect" (Retailer) or "ARK Backoffice" (Distributor ERP)
 * Features the official colorful ARK Distributors logo.
 */
export function ArkWordmark({
  product = "default",
  variant = "gradient",
  size = "md",
  withTagline = false,
  className = "",
  ...props
}: ArkWordmarkProps) {
  const height = size === "sm" ? 28 : size === "lg" ? 42 : 34;

  return (
    <div className={`flex items-center gap-2 select-none ${className}`} {...props}>
      <img
        src="/logos/ark-distributors.jpg"
        alt="ARK Distributors"
        style={{ height }}
        className="object-contain rounded-md bg-white p-0.5 shadow-soft-xs border border-border/50 shrink-0"
      />

      {product !== "default" && (
        <span className="font-sans font-bold tracking-tight text-primary text-sm sm:text-base whitespace-nowrap">
          {product}
        </span>
      )}

      {withTagline && (
        <span className="font-mono text-[10px] sm:text-[11px] text-ink-muted tracking-tight ml-1 whitespace-nowrap">
          Wholesale, Connected.
        </span>
      )}
    </div>
  );
}

export default ArkMonogram;
