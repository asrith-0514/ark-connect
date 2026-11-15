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
      "bg-surface text-ink border border-border rounded-lg shadow-soft-sm transition-all duration-200 ease-out",
    hero:
      "bg-surface-raised text-ink border border-border/80 rounded-xl shadow-soft-md transition-all duration-200 ease-out relative overflow-hidden",
    tinted:
      "bg-primary/5 text-ink border border-primary/20 rounded-lg shadow-soft-sm transition-all duration-200 ease-out",
  };

  const interactiveStyles = interactive
    ? "hover:border-primary/40 hover:shadow-soft-md cursor-pointer active:scale-[0.99]"
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
