"use client";

import React from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "accent"
  | "primary"
  | "neutral";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  variant = "default",
  size = "sm",
  dot = false,
  pulse = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    default: {
      container: "bg-surface-raised text-ink border border-border",
      dot: "bg-ink-muted",
    },
    neutral: {
      container: "bg-surface-raised text-ink-muted border border-border",
      dot: "bg-ink-muted",
    },
    primary: {
      container: "bg-primary/10 text-primary-link border border-primary/25",
      dot: "bg-primary",
    },
    accent: {
      container: "bg-accent/10 text-accent border border-accent/25",
      dot: "bg-accent",
    },
    success: {
      container: "bg-success/10 text-success border border-success/25",
      dot: "bg-success",
    },
    warning: {
      container: "bg-warning/10 text-warning border border-warning/25",
      dot: "bg-warning",
    },
    danger: {
      container: "bg-danger/10 text-danger border border-danger/25",
      dot: "bg-danger",
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-[11px] font-medium rounded-xs gap-1.5",
    md: "px-2.5 py-0.5 text-xs font-semibold rounded-xs gap-1.5",
  };

  const currentVariant = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center tracking-tight transition-colors duration-150 ease-out select-none whitespace-nowrap ${currentVariant.container} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentVariant.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${currentVariant.dot}`} />
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}

/**
 * StatusChip primitive per brand kit:
 * Always pairs a status dot indicator with a text label (never color alone).
 */
export interface StatusChipProps extends BadgeProps {
  label?: string;
}

export function StatusChip({
  variant = "default",
  size = "sm",
  dot = true,
  pulse = false,
  className = "",
  label,
  children,
  ...props
}: StatusChipProps) {
  return (
    <Badge
      variant={variant}
      size={size}
      dot={dot}
      pulse={pulse}
      className={`font-sans ${className}`}
      {...props}
    >
      {label || children}
    </Badge>
  );
}

export default Badge;
