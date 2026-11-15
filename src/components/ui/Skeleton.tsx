"use client";

import React from "react";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
  style,
  ...props
}: SkeletonProps) {
  const variantStyles: Record<string, string> = {
    text: "h-3.5 w-full rounded-xs",
    circular: "rounded-full shrink-0",
    rectangular: "w-full h-20 rounded-none",
    rounded: "w-full h-20 rounded-sm",
  };

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      className={`animate-shimmer border border-border/30 select-none ${variantStyles[variant]} ${className}`}
      style={inlineStyles}
      aria-hidden="true"
      {...props}
    />
  );
}

export default Skeleton;
