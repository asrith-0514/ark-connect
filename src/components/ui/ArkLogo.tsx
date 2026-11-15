"use client";

import React, { useId } from "react";

export type LogoVariant = "gradient" | "mono";

export interface ArkMonogramProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  variant?: LogoVariant;
  className?: string;
}

/**
 * Precision Industrial-Tech ARK Geometric Monogram
 * Refined from starting point vector, optimized for 24px, 32px, 48px, 64px crisp rendering.
 * Features Electric Blue (#2F6BFF) to Neon Cyan (#22E5FF) linear gradient.
 */
export function ArkMonogram({
  size = 32,
  variant = "gradient",
  className = "",
  ...props
}: ArkMonogramProps) {
  const rawId = useId();
  const gradId = `ark-grad-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      {...props}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2F6BFF" />
          <stop offset="100%" stopColor="#22E5FF" />
        </linearGradient>
      </defs>

      {/* Background container glow / subtle plate for large sizes */}
      {typeof size === "number" && size >= 48 && (
        <rect
          x="1"
          y="1"
          width="30"
          height="30"
          rx="7"
          className="fill-surface-raised stroke-border"
          strokeWidth="1"
        />
      )}

      {/* Primary Geometric ARK Monogram Body */}
      <path
        d="M16 3L3.8 29H10.1L12.3 23.8H19.7L21.9 29H28.2L16 3ZM16 11.2L18.8 18.2H13.2L16 11.2Z"
        fill={variant === "gradient" ? `url(#${gradId})` : "currentColor"}
        fillRule="evenodd"
        clipRule="evenodd"
      />

      {/* Precision Geometric Industrial Cut / Neon Cyan Core Accent */}
      <path
        d="M13.2 18.2H18.8L19.5 20H12.5L13.2 18.2Z"
        fill="#22E5FF"
        opacity={variant === "gradient" ? 0.9 : 0.4}
      />
    </svg>
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
 * Optional Tagline "Wholesale, Connected." strictly for login & splash screens.
 */
export function ArkWordmark({
  product = "default",
  variant = "gradient",
  size = "md",
  withTagline = false,
  className = "",
  ...props
}: ArkWordmarkProps) {
  const iconSize = size === "sm" ? 24 : size === "lg" ? 40 : 30;

  return (
    <div className={`flex items-center gap-2.5 ${className}`} {...props}>
      <ArkMonogram size={iconSize} variant={variant} />

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-sans font-bold tracking-tight text-ink text-sm sm:text-base">
            ARK
          </span>
          {product !== "default" && (
            <span className="font-sans font-semibold tracking-tight text-primary text-sm sm:text-base">
              {product}
            </span>
          )}
        </div>

        {withTagline && (
          <span className="font-mono text-[10px] sm:text-[11px] text-ink-muted tracking-tight mt-1">
            Wholesale, Connected.
          </span>
        )}
      </div>
    </div>
  );
}

export default ArkMonogram;
