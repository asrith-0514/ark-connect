"use client";

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-primary text-primary-foreground border border-primary/40 shadow-soft-xs hover:bg-primary-hover active:scale-[0.98]",
    secondary:
      "bg-surface text-ink border border-border shadow-soft-xs hover:bg-surface-raised hover:border-border-strong active:scale-[0.98]",
    ghost:
      "bg-transparent text-ink border border-transparent hover:bg-surface hover:text-primary active:scale-[0.98]",
    danger:
      "bg-danger text-white border border-danger/40 shadow-soft-xs hover:opacity-90 active:scale-[0.98]",
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs rounded-sm gap-1.5 font-medium",
    md: "h-9.5 px-3.5 text-xs sm:text-sm rounded-sm gap-2 font-medium",
    lg: "h-11 px-5 text-sm sm:text-base rounded-md gap-2.5 font-semibold",
    icon: "h-9 w-9 p-0 rounded-sm flex items-center justify-center",
  };

  const disabledStyles = disabled || isLoading
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "cursor-pointer";

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center select-none transition-all duration-150 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}

export default Button;
