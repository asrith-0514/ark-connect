"use client";

import React from "react";

export type CardVariant = "default" | "hero" | "tinted";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

export function Card({
  variant = "default",
  interactive = false,
  className = "",
  children,
  ...props
}: CardProps) {
  const variantStyles: Record<CardVariant, string> = {
    default:
      "bg-surface text-ink border border-border rounded-md shadow-soft-sm transition-all duration-150 ease-out",
    hero:
      "bg-surface-raised text-ink border border-border-strong rounded-lg shadow-soft-md transition-all duration-150 ease-out relative overflow-hidden",
    tinted:
      "bg-surface text-ink border border-primary/25 rounded-md shadow-soft-sm transition-all duration-150 ease-out",
  };

  const interactiveStyles = interactive
    ? "hover:border-primary/50 hover:shadow-soft-md cursor-pointer active:scale-[0.99]"
    : "";

  return (
    <div
      className={`${variantStyles[variant]} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
