"use client";

import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-ink select-none tracking-tight"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-ink-muted pointer-events-none flex items-center justify-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full h-9.5 px-3 py-2 text-xs sm:text-sm bg-surface text-ink border rounded-sm shadow-soft-xs transition-all duration-150 ease-out placeholder:text-ink-muted/50 focus:outline-none ${
              error
                ? "border-danger focus:border-danger focus:ring-1 focus:ring-danger/30"
                : "border-border hover:border-border-strong focus:border-accent focus:ring-1 focus:ring-accent/30"
            } ${disabled ? "opacity-50 cursor-not-allowed bg-background" : ""} ${
              leftIcon ? "pl-9" : ""
            } ${rightIcon ? "pr-9" : ""} ${className}`}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3 text-ink-muted flex items-center justify-center">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-danger font-medium tracking-tight mt-0.5">
            {error}
          </p>
        )}

        {helperText && !error && (
          <p className="text-[11px] text-ink-muted tracking-tight mt-0.5">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
