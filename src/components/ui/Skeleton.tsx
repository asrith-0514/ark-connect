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
    text: "h-4 w-full rounded-sm",
    circular: "rounded-full shrink-0",
    rectangular: "w-full h-24 rounded-none",
    rounded: "w-full h-24 rounded-md",
  };

  const inlineStyles: React.CSSProperties = {
    ...style,
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  return (
    <div
      className={`animate-shimmer border border-border/40 select-none ${variantStyles[variant]} ${className}`}
      style={inlineStyles}
      aria-hidden="true"
      {...props}
    />
  );
}
