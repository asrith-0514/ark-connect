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
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-ink select-none tracking-tight"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3.5 text-ink-muted pointer-events-none flex items-center justify-center">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full min-h-[44px] px-3.5 py-2.5 text-sm bg-surface text-ink border rounded-md shadow-soft-sm transition-all duration-200 ease-out placeholder:text-ink-muted/50 focus:outline-none ${
              error
                ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/20"
                : "border-border hover:border-ink/20 focus:border-primary focus:ring-2 focus:ring-primary/20"
            } ${disabled ? "opacity-50 cursor-not-allowed bg-background" : ""} ${
              leftIcon ? "pl-10" : ""
            } ${rightIcon ? "pr-10" : ""} ${className}`}
            {...props}
          />

          {rightIcon && (
            <span className="absolute right-3.5 text-ink-muted flex items-center justify-center">
              {rightIcon}
            </span>
          )}
        </div>

        {error ? (
          <p className="text-xs font-medium text-danger flex items-center gap-1 mt-0.5">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-ink-muted mt-0.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
