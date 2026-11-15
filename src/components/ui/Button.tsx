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
      "bg-primary text-primary-foreground border border-transparent shadow-soft-sm hover:opacity-90 active:scale-[0.98]",
    secondary:
      "bg-surface text-ink border border-border shadow-soft-sm hover:bg-background hover:border-ink/20 active:scale-[0.98]",
    ghost:
      "bg-transparent text-ink border border-transparent hover:bg-surface hover:text-primary active:scale-[0.98]",
    danger:
      "bg-danger text-white border border-transparent shadow-soft-sm hover:opacity-90 active:scale-[0.98]",
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "min-h-[44px] px-3.5 py-1.5 text-xs rounded-sm gap-1.5 font-medium",
    md: "min-h-[44px] px-4 py-2.5 text-sm rounded-md gap-2 font-medium",
    lg: "min-h-[48px] px-6 py-3 text-base rounded-md gap-2.5 font-semibold",
    icon: "min-h-[44px] min-w-[44px] p-2.5 rounded-md flex items-center justify-center",
  };

  const disabledStyles = disabled || isLoading
    ? "opacity-50 cursor-not-allowed pointer-events-none"
    : "cursor-pointer";

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center select-none transition-all duration-200 ease-out focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </button>
  );
}
