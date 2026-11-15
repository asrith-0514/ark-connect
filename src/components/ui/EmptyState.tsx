"use client";

import React from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = "",
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={`bg-surface border border-dashed border-border rounded-md p-6 sm:p-8 text-center flex flex-col items-center justify-center max-w-md mx-auto ${className}`}
      {...props}
    >
      <div className="w-11 h-11 rounded-sm bg-surface-raised border border-border text-primary flex items-center justify-center mb-3 shadow-soft-xs">
        {icon || <Icon name="inbox" size={20} />}
      </div>

      <h3 className="text-sm sm:text-base font-bold text-ink tracking-tight font-sans">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-ink-muted mt-1.5 max-w-xs leading-relaxed">
          {description}
        </p>
      )}

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-4">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="secondary" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
