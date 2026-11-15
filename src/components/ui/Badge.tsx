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
  size = "md",
  dot = false,
  pulse = false,
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
    default: {
      container: "bg-surface text-ink border border-border",
      dot: "bg-ink-muted",
    },
    neutral: {
      container: "bg-ink-muted/10 text-ink-muted border border-ink-muted/20",
      dot: "bg-ink-muted",
    },
    primary: {
      container: "bg-primary/10 text-primary border border-primary/25",
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
    sm: "px-2 py-0.5 text-[11px] font-medium rounded-sm gap-1.5",
    md: "px-2.5 py-1 text-xs font-semibold rounded-sm gap-2",
  };

  const currentVariant = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center tracking-tight transition-colors duration-200 ease-out select-none whitespace-nowrap ${currentVariant.container} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentVariant.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${currentVariant.dot}`} />
        </span>
      )}
      {children}
    </span>
  );
}

// Alias for StatusChip
export const StatusChip = Badge;
